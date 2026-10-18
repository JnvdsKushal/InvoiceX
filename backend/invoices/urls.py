
from django.urls import path

from .views import (
    InvoiceDetailView,
    InvoiceListCreateView,
    SubmitInvoiceView,
)

urlpatterns = [
    path("", InvoiceListCreateView.as_view(), name="invoice-list-create"),
    path("<uuid:pk>/", InvoiceDetailView.as_view(), name="invoice-detail"),
    path(
        "<uuid:pk>/submit",
        SubmitInvoiceView.as_view(),
        name="invoice-submit",
    ),
]
