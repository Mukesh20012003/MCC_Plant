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


from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from .forms import RawMaterialForm, ProductionBatchForm, QCReportForm


from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

#ML 
from .ml_service import predict_quality
from .serializers import QualityPredictionRequestSerializer
from .models import ProductionBatch, QCReport


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
    # simple placeholder dashboard
    return render(request, "plant/dashboard.html")



@login_required
def create_raw_material_view(request):
    if request.method == "POST":
        form = RawMaterialForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect("dashboard")
    else:
        form = RawMaterialForm()
    return render(request, "plant/create_raw_material.html", {"form": form})


@login_required
def create_production_batch_view(request):
    if request.method == "POST":
        form = ProductionBatchForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect("dashboard")
    else:
        form = ProductionBatchForm()
    return render(request, "plant/create_production_batch.html", {"form": form})


@login_required
def create_qc_report_view(request):
    if request.method == "POST":
        form = QCReportForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect("dashboard")
    else:
        form = QCReportForm()
    return render(request, "plant/create_qc_report.html", {"form": form})



@api_view(["POST"])
@permission_classes([AllowAny])
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
