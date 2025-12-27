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
from django.db.models import Count,Sum
from django.db.models.functions import TruncDate



def get_shift_kpi_trends():
    """
    Aggregate basic quality/scrap/defect KPIs per production day
    using ProductionBatch. Uses created_at date and a dummy shift
    until real fields exist.
    """
    # If you later add shift/quantity fields, update these annotations.
    buckets = (
        ProductionBatch.objects
        .annotate(production_date=TruncDate("created_at"))
        .values("production_date")
        .annotate(
            # Placeholder quantities. Replace with real numeric fields when you add them.
            total_units=Sum("qc_reports__id"),   # just to avoid zero; use real field later
            good_units=Sum("qc_reports__id"),    # same placeholder
            scrap_units=Sum("qc_reports__id") * 0,   # 0 scrap for now
            defect_units=Sum("qc_reports__id") * 0,  # 0 defects for now
        )
        .order_by("production_date")
    )

    oee_trend = []
    scrap_trend = []
    defect_trend = []

    for b in buckets:
        total = b["total_units"] or 0
        good = b["good_units"] or 0
        scrap = b["scrap_units"] or 0
        defects = b["defect_units"] or 0

        quality = (good / total * 100) if total else 0
        scrap_rate = (scrap / total * 100) if total else 0
        defect_rate = (defects / total * 100) if total else 0

        # For now, use quality as OEE placeholder.
        oee = quality

        date_value = b["production_date"]
        date_str = date_value.isoformat() if date_value else ""

        oee_trend.append({
            "date": date_str,
            "shift": "A",          # dummy shift, update when you add a real shift field
            "oee": round(oee, 1),
        })
        scrap_trend.append({
            "date": date_str,
            "shift": "A",
            "scrap_rate": round(scrap_rate, 2),
        })
        defect_trend.append({
            "date": date_str,
            "shift": "A",
            "defect_rate": round(defect_rate, 2),
        })

    return oee_trend, scrap_trend, defect_trend


@api_view(["GET"])
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

        if latest_qc:
            latest_qc_payload = {
                "id": latest_qc.id,
                "moisture_actual": latest_qc.moisture_actual,
                "particle_size_actual": latest_qc.particle_size_actual,
                "passed": latest_qc.passed,
                "predicted_pass": latest_qc.predicted_pass,
                "predicted_probability": latest_qc.predicted_probability,
                "created_at": latest_qc.created_at,
            }
        else:
            latest_qc_payload = None

        recent_batches.append({
            "id": batch.id,
            "batch_no": batch.batch_no,
            "status": batch.status,
            "predicted": None if not latest_qc else latest_qc.predicted_pass,
            "probability": None if not latest_qc else latest_qc.predicted_probability,
            "is_anomaly": batch.is_anomaly,
            "anomaly_score": batch.anomaly_score,
            "latest_qc": latest_qc_payload,
        })

    # Simple example stoppages: count COMPLETED vs FAILED vs RUNNING as minutes
    # Replace this with real stoppage model if you have one.
    status_counts = (
        ProductionBatch.objects
        .values("status")
        .annotate(count=Count("id"))
    )
    stoppages = []
    for row in status_counts:
        status = row["status"]
        minutes = row["count"] * 10  # placeholder: 10 minutes per batch
        label = {
            "FAILED": "Quality hold / failed",
            "RUNNING": "Minor stoppage",
            "COMPLETED": "Completed",
        }.get(status, status)
        stoppages.append({
            "reason": label,
            "minutes": minutes,
        })
    

      # ====== NEW: derived KPI numerators for OEE / scrap / FPY etc. ======
    # For demo: assume each batch represents 100 units
    UNITS_PER_BATCH = 100

    # total units produced in this period
    total_units = total_batches * UNITS_PER_BATCH

    # "good" units = all units minus failed-batch units (very coarse)
    failed_batches = ProductionBatch.objects.filter(status="FAILED").count()
    scrap_units = failed_batches * UNITS_PER_BATCH
    good_units = max(total_units - scrap_units, 0)

    # simple time assumptions (in minutes)
    planned_minutes = total_batches * 10          # e.g. each batch planned 10 minutes
    downtime_minutes = failed_batches * 5         # e.g. each failed batch = 5 min downtime

    # ideal cycle time: seconds per unit (e.g. 5s for demo)
    ideal_cycle_time_sec = 5

     # NEW: engineer/manager trend KPIs (OEE, scrap, defect by shift)
    oee_trend, scrap_trend, defect_trend = get_shift_kpi_trends()

    # after computing good_units, total_units, scrap_units, etc.

    # very simple "last shift" placeholders based on the same aggregates
    # you can later restrict to last shift time window
    if total_units > 0:
        oee_last_shift = (good_units / total_units) * 100
        scrap_rate_last_shift = (scrap_units / total_units) * 100
    else:
        oee_last_shift = 0
        scrap_rate_last_shift = 0

    # no defects data yet, so set 0
    defect_rate_last_shift = 0

    # throughput = units per (planned) shift
    throughput_last_shift = total_units  # or total_units / number_of_shifts
    
    return Response({
        "total_batches": total_batches,
        "total_qc_reports": total_qc_reports,
        "predicted_to_pass": predicted_to_pass,
        "recent_batches": recent_batches,
        "stoppages": stoppages,
        "oee_trend": oee_trend,
        "scrap_trend": scrap_trend,
        "defect_trend": defect_trend,

        # NEW KPI numerators for frontend computeKpis
        "good_units": good_units,
        "total_units": total_units,
        "scrap_units": scrap_units,
        "ideal_cycle_time_sec": ideal_cycle_time_sec,
        "planned_minutes": planned_minutes,
        "downtime_minutes": downtime_minutes,
        "oee_last_shift": oee_last_shift,
        "scrap_rate_last_shift": scrap_rate_last_shift,
        "defect_rate_last_shift": defect_rate_last_shift,
        "throughput_last_shift": throughput_last_shift,
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
