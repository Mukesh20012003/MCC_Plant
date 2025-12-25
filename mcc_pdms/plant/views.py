from rest_framework import viewsets
from .models import RawMaterial, ProductionBatch, QCReport
from .serializers import (
    RawMaterialSerializer,
    ProductionBatchSerializer,
    QCReportSerializer,
)

from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required

from rest_framework.permissions import IsAuthenticated, AllowAny
from .permissions import IsQCOrReadOnly


from django.contrib.auth.decorators import login_required,user_passes_test
from django.shortcuts import render, redirect
from .forms import RawMaterialForm, ProductionBatchForm, QCReportForm


from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

#ML 
from .ml_service import predict_quality
from .serializers import QualityPredictionRequestSerializer
from .models import ProductionBatch, QCReport


from django.http import HttpResponseRedirect
from django.urls import reverse
from .ml_service import predict_quality

from django.db.models import Prefetch


class RawMaterialViewSet(viewsets.ModelViewSet):
    queryset = RawMaterial.objects.all().order_by("-created_at")
    serializer_class = RawMaterialSerializer


class ProductionBatchViewSet(viewsets.ModelViewSet):
    queryset = ProductionBatch.objects.all().order_by("-created_at")
    serializer_class = ProductionBatchSerializer


class QCReportViewSet(viewsets.ModelViewSet):
    queryset = QCReport.objects.all().order_by("-created_at")
    serializer_class = QCReportSerializer
    permission_classes = [IsAuthenticated, IsQCOrReadOnly]


def get_role(user):
    if hasattr(user, "profile"):
        return user.profile.role
    return "OPERATOR"

def is_admin(user):
    return get_role(user) == "ADMIN"

def is_qc_or_admin(user):
    return get_role(user) in ["ADMIN", "QC_ANALYST"]

def is_pm_or_admin(user):
    return get_role(user) in ["ADMIN", "PLANT_MANAGER"]



def login_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return redirect("dashboard")
        messages.error(request, "Invalid credentials")
    return render(request, "plant/login.html")


@login_required
def logout_view(request):
    logout(request)
    return redirect("login")


@login_required
def dashboard_view(request):
    # Top cards
    total_batches = ProductionBatch.objects.count()
    total_qc_reports = QCReport.objects.count()
    predicted_to_pass = QCReport.objects.filter(predicted_pass=True).count()  # ML predictions marked pass [web:75][web:78]

    # Recent batches with their latest QC report (if any)
    recent_batches_qs = (
        ProductionBatch.objects
        .all()
        .order_by("-created_at")[:5]  # latest 5 batches [web:79][web:82]
    )

    # attach latest_qc manually (simple and clear)
    recent_batches = []
    for batch in recent_batches_qs:
        latest_qc = (
            QCReport.objects
            .filter(batch=batch)
            .order_by("-created_at")
            .first()
        )
        batch.latest_qc = latest_qc
        recent_batches.append(batch)

    context = {
        "total_batches": total_batches,
        "total_qc_reports": total_qc_reports,
        "predicted_to_pass": predicted_to_pass,
        "recent_batches": recent_batches,
    }
    return render(request, "plant/dashboard.html", context)



@login_required
@user_passes_test(is_admin)
def create_raw_material_view(request):
    if request.method == "POST":
        form = RawMaterialForm(request.POST)
        if form.is_valid():
            rm = form.save(commit=False)
            rm.properties_json = {
                "source": form.cleaned_data["source"],
                "grade": form.cleaned_data["grade"],
                "moisture_percent": form.cleaned_data["moisture_percent"],
                "bulk_density_g_per_ml": form.cleaned_data["bulk_density"],
                "particle_size_microns": form.cleaned_data["particle_size"],
            }
            rm.save()
            return redirect("dashboard")
    else:
        form = RawMaterialForm()

    return render(request, "plant/create_raw_material.html", {"form": form})


@login_required
@user_passes_test(is_pm_or_admin)
def create_production_batch_view(request):
    if request.method == "POST":
        form = ProductionBatchForm(request.POST)
        if form.is_valid():
            batch = form.save(commit=False)
            batch.process_parameters_json = {
                "temperature_c": form.cleaned_data["temperature_c"],
                "ph": form.cleaned_data["ph"],
                "reaction_time_min": form.cleaned_data["reaction_time_min"],
            }
            batch.save()
            return redirect("dashboard")
    else:
        form = ProductionBatchForm()

    return render(request, "plant/create_production_batch.html", {"form": form})


@login_required
@user_passes_test(is_qc_or_admin)
def create_qc_report_view(request):
    if request.method == "POST":
        form = QCReportForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect("dashboard")
    else:
        form = QCReportForm()
    return render(request, "plant/create_qc_report.html", {"form": form})


@login_required
def batches_page_view(request):
    return render(request, "plant/batches.html")

#Run prediction for all completed batches
@login_required
@user_passes_test(is_admin)
def run_predictions_for_completed_batches(request):
    completed_batches = ProductionBatch.objects.filter(status="COMPLETED")

    updated = 0
    for batch in completed_batches:
        params = batch.process_parameters_json or {}
        try:
            predicted_pass, probability = predict_quality(params)
        except Exception:
            # skip batches that don't have valid params
            continue

        qc = (
            QCReport.objects
            .filter(batch=batch)
            .order_by("-created_at")
            .first()
        )
        if qc is None:
            qc = QCReport(batch=batch)

        qc.predicted_pass = predicted_pass
        qc.predicted_probability = probability
        qc.save()
        updated += 1

    if updated == 0:
        messages.warning(
            request,
            "No predictions were generated. Check that completed batches have valid process parameters."
        )
    else:
        messages.success(request, f"Predictions updated for {updated} completed batch(es).")

    return redirect("dashboard")


@login_required
def production_batches_list_view(request):
    batches = (
        ProductionBatch.objects
        .all()
        .order_by("-created_at")
    )
    return render(request, "plant/production_batches_list.html", {"batches": batches})

# views.py
@login_required
def qc_reports_list_view(request):
    reports = QCReport.objects.select_related("batch").order_by("-created_at")
    return render(request, "plant/qc_reports_list.html", {"reports": reports})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
# @permission_classes([AllowAny])
def predict_quality_view(request):
    """
    POST /api/ml/predict-quality/
    Body: { "batch_id": 1 } OR { "process_parameters": { ... } }
    """
    serializer = QualityPredictionRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    params = None
    batch = None

    if data.get("batch_id"):
        try:
            batch = ProductionBatch.objects.get(id=data["batch_id"])
        except ProductionBatch.DoesNotExist:
            return Response(
                {"detail": "Batch not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        params = batch.process_parameters_json or {}
    else:
        params = data.get("process_parameters") or {}

    try:
        predicted_pass, probability = predict_quality(params)
    except ValueError as e:
        return Response(
            {"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST
        )

    # if batch is given, optionally update or create QCReport with prediction
    if batch:
        QCReport.objects.create(
            batch=batch,
            predicted_pass=predicted_pass,
            predicted_probability=probability,
        )

    return Response(
        {
            "predicted_pass": predicted_pass,
            "predicted_probability": probability,
        }
    )


@login_required
def predicted_to_pass_list_view(request):
    reports = (
        QCReport.objects
        .select_related("batch")
        .filter(predicted_pass=True)
        .order_by("-created_at")
    )
    return render(request, "plant/predicted_to_pass_list.html", {"reports": reports})



# def rag_demo_view(request):
#     # If you have the JWT somewhere, put it here.
#     # For now, hard‑code or leave empty string as placeholder.
#     access_token_string = ""  # TODO: get real token if you secure this path

#     return render(request, "plant/rag_demo.html", {
#         "jwt_access": access_token_string,
#     })


# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import IsAuthenticated, AllowAny
# from rest_framework.response import Response
# from .models import ProductionBatch, QCReport
# from rest_framework import status


# @api_view(["GET"])
# # @permission_classes([IsAuthenticated])
# @permission_classes([AllowAny])
# def dashboard_summary_api(request):
#     total_batches = ProductionBatch.objects.count()
#     total_qc_reports = QCReport.objects.count()
#     predicted_to_pass = QCReport.objects.filter(predicted_pass=True).count()

#     recent_batches = []
#     for batch in ProductionBatch.objects.order_by("-created_at")[:5]:
#         latest_qc = (
#             QCReport.objects.filter(batch=batch)
#             .order_by("-created_at")
#             .first()
#         )
#         recent_batches.append({
#             "id": batch.id,
#             "batch_no": batch.batch_no,
#             "status": batch.status,
#             "predicted": None if not latest_qc else latest_qc.predicted_pass,
#             "probability": None if not latest_qc else latest_qc.predicted_probability,
#         })

#     return Response({
#         "total_batches": total_batches,
#         "total_qc_reports": total_qc_reports,
#         "predicted_to_pass": predicted_to_pass,
#         "recent_batches": recent_batches,
#     })



# @api_view(["GET"])
# # @permission_classes([IsAuthenticated])
# @permission_classes([AllowAny])
# def qc_reports_predicted_pass_api(request):
#     reports = (
#         QCReport.objects.select_related("batch")
#         .filter(predicted_pass=True)
#         .order_by("-created_at")
#     )
#     data = [
#         {
#             "id": r.id,
#             "batch_no": r.batch.batch_no,
#             "predicted_probability": r.predicted_probability,
#             "created_at": r.created_at,
#         }
#         for r in reports
#     ]
#     return Response(data)



# @api_view(["GET"])
# # @permission_classes([IsAuthenticated])
# @permission_classes([AllowAny])
# def current_user_api(request):
#     profile = getattr(request.user, "profile", None)
#     return Response({
#         "username": request.user.username,
#         "role": profile.role if profile else "OPERATOR",
#     })
