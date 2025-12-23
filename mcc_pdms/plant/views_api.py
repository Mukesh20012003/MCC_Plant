from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import ProductionBatch, QCReport

@api_view(["GET"])
@permission_classes([AllowAny])
def dashboard_summary_api(request):
    total_batches = ProductionBatch.objects.count()
    total_qc_reports = QCReport.objects.count()
    predicted_to_pass = QCReport.objects.filter(predicted_pass=True).count()

    recent_batches = []
    for batch in ProductionBatch.objects.order_by("-created_at")[:5]:
        latest_qc = (
            QCReport.objects.filter(batch=batch)
            .order_by("-created_at")
            .first()
        )
        recent_batches.append({
            "id": batch.id,
            "batch_no": batch.batch_no,
            "status": batch.status,
            "predicted": None if not latest_qc else latest_qc.predicted_pass,
            "probability": None if not latest_qc else latest_qc.predicted_probability,
        })

    return Response({
        "total_batches": total_batches,
        "total_qc_reports": total_qc_reports,
        "predicted_to_pass": predicted_to_pass,
        "recent_batches": recent_batches,
    })



@api_view(["GET"])
@permission_classes([AllowAny])
def qc_reports_predicted_pass_api(request):
    reports = (
        QCReport.objects.select_related("batch")
        .filter(predicted_pass=True)
        .order_by("-created_at")
    )
    data = [
        {
            "id": r.id,
            "batch_no": r.batch.batch_no,
            "predicted_probability": r.predicted_probability,
            "created_at": r.created_at,
        }
        for r in reports
    ]
    return Response(data)



@api_view(["GET"])
@permission_classes([AllowAny])
def current_user_api(request):
    profile = getattr(request.user, "profile", None)
    return Response({
        "username": request.user.username,
        "role": profile.role if profile else "OPERATOR",
    })