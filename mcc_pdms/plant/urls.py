from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RawMaterialViewSet, ProductionBatchViewSet, QCReportViewSet, login_view, logout_view, dashboard_view, create_raw_material_view, create_production_batch_view, create_qc_report_view

router = DefaultRouter()
router.register(r"raw-materials", RawMaterialViewSet, basename="raw-material")
router.register(r"production/batch", ProductionBatchViewSet, basename="production-batch")
router.register(r"qc/report", QCReportViewSet, basename="qc-report")

urlpatterns = [
    path("api/", include(router.urls)),
    path("login/", login_view, name="login"),
    path("logout/", logout_view, name="logout"),
    path("", dashboard_view, name="dashboard"),

    path("raw-materials/create/", create_raw_material_view, name="create_raw_material"),
    path("batches/create/", create_production_batch_view, name="create_production_batch"),
    path("qc/create/", create_qc_report_view, name="create_qc_report"),
]
