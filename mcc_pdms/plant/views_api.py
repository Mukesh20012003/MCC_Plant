from django.db import models
from rest_framework.decorators import api_view, permission_classes,authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import SessionAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from .models import ProductionBatch, QCReport
from rest_framework import status
from .rag_service import retrieve_top_k, generate_answer
from .anomaly_service import detect_anomaly, extract_features
from .rag_service import answer_with_rag
from ragapp.models import DocumentChunk
from .ml_anomaly import detect_anomaly_for_batch
from .ml_service import predict_anomaly

@api_view(["GET"])
# @permission_classes([AllowAny])
@permission_classes([IsAuthenticated])
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
# @permission_classes([AllowAny])
@permission_classes([IsAuthenticated])
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
# @permission_classes([AllowAny])
@permission_classes([IsAuthenticated])
def current_user_api(request):
    profile = getattr(request.user, "profile", None)
    return Response({
        "username": request.user.username,
        "role": profile.role if profile else "OPERATOR",
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def rag_query_api(request):
    question = request.data.get("question", "").strip()
    batch_id = request.data.get("batch_id")

    if not question:
        return Response({"error": "question is required"}, status=400)

    batch_context = None
    if batch_id:
        try:
            batch = ProductionBatch.objects.get(id=batch_id)
            qcs = QCReport.objects.filter(batch=batch)
            batch_context = (
                f"Batch {batch.batch_no} status={batch.status}, "
                f"raw={batch.raw_material}, qc_count={qcs.count()}"
            )
        except ProductionBatch.DoesNotExist:
            pass

    answer, top_chunks = answer_with_rag(question, batch_context)
    sources = [
        {
            "document_id": c.document_id,
            "title": c.document.title,
            "doc_type": c.document.doc_type,
            "chunk_index": c.chunk_index,
        }
        for c in top_chunks
    ]
    return Response({"question": question, "answer": answer, "sources": sources})


@api_view(["POST"])
@authentication_classes([SessionAuthentication, JWTAuthentication])
@permission_classes([IsAuthenticated])
def detect_anomaly_api(request):
    batch_id = request.data.get("batch_id")
    if not batch_id:
        return Response(
            {"error": "batch_id is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        batch = ProductionBatch.objects.get(id=batch_id)
    except ProductionBatch.DoesNotExist:
        return Response(
            {"error": "batch not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    # 1) Get QC data for this batch
    qc_qs = QCReport.objects.filter(batch=batch)
    if not qc_qs.exists():
        return Response(
            {"error": "No QC data for this batch"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    qc_avg = qc_qs.aggregate(
        moisture_avg=models.Avg("moisture_actual"),
        ps_avg=models.Avg("particle_size_actual"),
    )

    moisture = qc_avg["moisture_avg"]
    particle_size = qc_avg["ps_avg"]

    if moisture is None or particle_size is None:
        return Response(
            {"error": "Incomplete QC data for this batch"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 2) Call ML model
    score, is_anomaly = predict_anomaly(moisture, particle_size)

    # 3) Persist to DB
    batch.anomaly_score = score
    batch.is_anomaly = is_anomaly
    batch.save(update_fields=["anomaly_score", "is_anomaly"])

    # 4) Return response
    return Response(
        {
            "batch_id": batch.id,
            "batch_no": batch.batch_no,
            "score": score,
            "is_anomaly": is_anomaly,
        }
    )
