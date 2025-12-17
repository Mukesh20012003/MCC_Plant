from rest_framework import viewsets
from .models import RawMaterial, ProductionBatch, QCReport
from .serializers import (
    RawMaterialSerializer,
    ProductionBatchSerializer,
    QCReportSerializer,
)

from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required

from rest_framework.permissions import IsAuthenticated
from .permissions import IsQCOrReadOnly


class RawMaterialViewSet(viewsets.ModelViewSet):
    queryset = RawMaterial.objects.all().order_by("-created_at")
    serializer_class = RawMaterialSerializer


class ProductionBatchViewSet(viewsets.ModelViewSet):
    queryset = ProductionBatch.objects.all().order_by("-created_at")
    serializer_class = ProductionBatchSerializer


class QCReportViewSet(viewsets.ModelViewSet):
    queryset = QCReport.objects.all().order_by("-created_at")
    serializer_class = QCReportSerializer



def login_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return redirect("dashboard")
        messages.error(request, "Invalid credentials")
    return render(request, "plant/login.html")


@login_required
def logout_view(request):
    logout(request)
    return redirect("login")


@login_required
def dashboard_view(request):
    # simple placeholder dashboard
    return render(request, "plant/dashboard.html")


class QCReportViewSet(viewsets.ModelViewSet):
    queryset = QCReport.objects.all().order_by("-created_at")
    serializer_class = QCReportSerializer
    permission_classes = [IsAuthenticated, IsQCOrReadOnly]