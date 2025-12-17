from django.db import models

from django.conf import settings
from django.db import models


class RawMaterial(models.Model):
    name = models.CharField(max_length=100)
    supplier = models.CharField(max_length=100, blank=True, null=True)
    batch_no = models.CharField(max_length=50, unique=True)
    # store extra properties like moisture, particle size, grade, etc.
    properties_json = models.JSONField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.batch_no}"


class ProductionBatch(models.Model):
    STATUS_CHOICES = [
        ('PLANNED', 'Planned'),
        ('RUNNING', 'Running'),
        ('COMPLETED', 'Completed'),
    ]

    batch_no = models.CharField(max_length=50, unique=True)
    raw_material = models.ForeignKey(
        RawMaterial, on_delete=models.CASCADE, related_name='batches'
    )
    # process parameters like temperature, pH, drying_time, etc.
    process_parameters_json = models.JSONField(blank=True, null=True)

    start_time = models.DateTimeField(blank=True, null=True)
    end_time = models.DateTimeField(blank=True, null=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='PLANNED'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return self.batch_no


class QCReport(models.Model):
    batch = models.OneToOneField(
        ProductionBatch, on_delete=models.CASCADE, related_name='qc_report'
    )

    moisture_actual = models.FloatField(blank=True, null=True)
    particle_size_actual = models.FloatField(blank=True, null=True)
    passed = models.BooleanField(default=False)

    # ML outputs (will be filled in later)
    predicted_pass = models.BooleanField(default=False)
    predicted_probability = models.FloatField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"QC for {self.batch.batch_no}"
    


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('PLANT_MANAGER', 'Plant Manager'),
        ('OPERATOR', 'Operator'),
        ('QC_ANALYST', 'QC Analyst'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='OPERATOR',
    )

    def __str__(self):
        return f"{self.user.username} ({self.role})"

