from rest_framework import serializers
from .models import RawMaterial, ProductionBatch, QCReport


class RawMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = RawMaterial
        fields = [
            "id",
            "name",
            "supplier",
            "batch_no",
            "properties_json",
            "created_at",
        ]


class ProductionBatchSerializer(serializers.ModelSerializer):
    raw_material_detail = RawMaterialSerializer(source="raw_material", read_only=True)
    latest_qc = serializers.SerializerMethodField()

    class Meta:
        model = ProductionBatch
        fields = [
            "id",
            "batch_no",
            "raw_material",
            "raw_material_detail",
            "process_parameters_json",
            "start_time",
            "end_time",
            "status",
            "created_at",
            "latest_qc",
        ]

    def get_latest_qc(self, obj):
        qc = obj.qc_reports.order_by("-created_at").first()
        if not qc:
            return None
        return {
            "id": qc.id,
            "moisture_actual": qc.moisture_actual,
            "particle_size_actual": qc.particle_size_actual,
            "passed": qc.passed,
            "predicted_pass": qc.predicted_pass,
            "predicted_probability": qc.predicted_probability,
            "created_at": qc.created_at,
        }



class QCReportSerializer(serializers.ModelSerializer):
    batch_detail = ProductionBatchSerializer(source="batch", read_only=True)

    class Meta:
        model = QCReport
        fields = [
            "id",
            "batch",
            "batch_detail",
            "moisture_actual",
            "particle_size_actual",
            "passed",
            "predicted_pass",
            "predicted_probability",
            "created_at",
        ]


class QualityPredictionRequestSerializer(serializers.Serializer):
    batch_id = serializers.IntegerField(required=False)
    process_parameters = serializers.DictField(required=False)

    def validate(self, attrs):
        if not attrs.get("batch_id") and not attrs.get("process_parameters"):
            raise serializers.ValidationError(
                "Either batch_id or process_parameters must be provided."
            )
        return attrs