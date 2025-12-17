from django import forms
from .models import RawMaterial, ProductionBatch, QCReport


class RawMaterialForm(forms.ModelForm):
    class Meta:
        model = RawMaterial
        fields = ["name", "supplier", "batch_no", "properties_json"]


class ProductionBatchForm(forms.ModelForm):
    class Meta:
        model = ProductionBatch
        fields = [
            "batch_no",
            "raw_material",
            "process_parameters_json",
            "start_time",
            "end_time",
            "status",
        ]
        widgets = {
            "start_time": forms.DateTimeInput(attrs={"type": "datetime-local", "class": "form-control"}),
            "end_time": forms.DateTimeInput(attrs={"type": "datetime-local", "class": "form-control"}),
            "process_parameters_json": forms.Textarea(attrs={"class": "form-control", "rows": 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["batch_no"].widget.attrs.update({"class": "form-control"})
        self.fields["raw_material"].widget.attrs.update({"class": "form-select"})
        self.fields["status"].widget.attrs.update({"class": "form-select"})



class QCReportForm(forms.ModelForm):
    class Meta:
        model = QCReport
        fields = [
            "batch",
            "moisture_actual",
            "particle_size_actual",
            "passed",
        ]
