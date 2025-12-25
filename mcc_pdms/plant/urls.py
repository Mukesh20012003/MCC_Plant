from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RawMaterialViewSet, ProductionBatchViewSet, QCReportViewSet, login_view, logout_view, dashboard_view, create_raw_material_view, create_production_batch_view, create_qc_report_view, predict_quality_view, batches_page_view,run_predictions_for_completed_batches, production_batches_list_view, qc_reports_list_view, predicted_to_pass_list_view 
from .views_api import dashboard_summary_api, qc_reports_predicted_pass_api, current_user_api, rag_query_api, detect_anomaly_api
# from . import views

router = DefaultRouter()
router.register(r"raw-materials", RawMaterialViewSet, basename="raw-material")
router.register(r"production/batch", ProductionBatchViewSet, basename="production-batch")
router.register(r"qc/report", QCReportViewSet, basename="qc-report")

urlpatterns = [
    path("api/", include(router.urls)),
    path("api/ml/predict-quality/", predict_quality_view, name="predict_quality"),
    path("login/", login_view, name="login"),
    path("logout/", logout_view, name="logout"),
    path("", dashboard_view, name="dashboard"),

    path("raw-materials/create/", create_raw_material_view, name="create_raw_material"),
    path("batches/create/", create_production_batch_view, name="create_production_batch"),
    path("qc/create/", create_qc_report_view, name="create_qc_report"),
    
    path("batches/", batches_page_view, name="batches_page"),
    path("batches/run-predictions/", run_predictions_for_completed_batches ,name="run_predictions"),
    path("batches/all/", production_batches_list_view, name="batches_list"),
    path("qc-reports/", qc_reports_list_view, name="qc_reports_list"),
    path("qc-reports/predicted-pass/", predicted_to_pass_list_view, name="predicted_to_pass_list"),
    
    # path("rag-demo/", views.rag_demo_view, name="rag_demo"),


    path("api/dashboard-summary/", dashboard_summary_api, name="dashboard_summary_api"),
    path("api/qc-reports/predicted-pass/", qc_reports_predicted_pass_api, name="qc_reports_predicted_pass_api"),
    path("api/me/", current_user_api, name="current_user_api"),
    path("api/rag/query/", rag_query_api, name="rag_query_api"),
    path("api/ml/detect-anomaly/", detect_anomaly_api, name="detect_anomaly_api"),
]
