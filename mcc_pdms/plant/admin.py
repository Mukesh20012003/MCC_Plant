from django.contrib import admin
from .models import RawMaterial, ProductionBatch, QCReport, UserProfile


@admin.register(RawMaterial)
class RawMaterialAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'supplier', 'batch_no', 'created_at')
    search_fields = ('name', 'supplier', 'batch_no')


@admin.register(ProductionBatch)
class ProductionBatchAdmin(admin.ModelAdmin):
    list_display = ('id', 'batch_no', 'raw_material', 'status', 'start_time', 'end_time')
    list_filter = ('status',)
    search_fields = ('batch_no',)


@admin.register(QCReport)
class QCReportAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'batch',
        'moisture_actual',
        'particle_size_actual',
        'passed',
        'predicted_pass',
        'predicted_probability',
        'created_at',
    )
    list_filter = ('passed', 'predicted_pass')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'role')
    list_filter = ('role',)