from django import forms
from .models import RawMaterial, ProductionBatch, QCReport


class RawMaterialForm(forms.ModelForm):
    # user‑friendly fields instead of raw JSON
    source=forms.CharField(required=False)
    grade = forms.CharField(required=False)
    moisture_percent = forms.FloatField(required=False)
    bulk_density = forms.FloatField(required=False)
    particle_size = forms.IntegerField(required=False)

    class Meta:
        model = RawMaterial
        fields = ["name", "supplier", "properties_json"]  # include JSONField
        widgets = {
            "properties_json": forms.HiddenInput(),  # hide raw JSON
        }


class ProductionBatchForm(forms.ModelForm):
    # user-friendly inputs instead of raw JSON typing
    temperature_c = forms.FloatField(required=False, label="Temperature (°C)")
    ph = forms.FloatField(required=False, label="pH")
    reaction_time_min = forms.IntegerField(required=False, label="Reaction Time (min)")

    class Meta:
        model = ProductionBatch
        fields = [
            "batch_no",
            "raw_material",
            "start_time",
            "end_time",
            "status",
            "process_parameters_json",  # keep JSONField in form
        ]
        widgets = {
            "start_time": forms.DateTimeInput(
                attrs={"type": "datetime-local", "class": "form-control"}
            ),
            "end_time": forms.DateTimeInput(
                attrs={"type": "datetime-local", "class": "form-control"}
            ),
            # hide raw JSON textbox – we will fill it in code
            "process_parameters_json": forms.HiddenInput(),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["batch_no"].widget.attrs.update({"class": "form-control"})
        self.fields["raw_material"].widget.attrs.update({"class": "form-select"})
        self.fields["status"].widget.attrs.update({"class": "form-select"})

    def clean(self):
        cleaned_data = super().clean()
        # build JSON dict from user‑friendly fields
        params = {
            "temperature_c": cleaned_data.get("temperature_c"),
            "ph": cleaned_data.get("ph"),
            "reaction_time_min": cleaned_data.get("reaction_time_min"),
        }
        # remove None values so JSON is clean
        params = {k: v for k, v in params.items() if v is not None}
        cleaned_data["process_parameters_json"] = params
        return cleaned_data




class QCReportForm(forms.ModelForm):
    class Meta:
        model = QCReport
        fields = [
            "batch",
            "moisture_actual",
            "particle_size_actual",
            "passed",
        ]
