from django.urls import path

from .views import (
    BuyerDecisionView,
    BuyerSupplierDirectoryView,
    InvoiceDetailView,
    InvoiceListCreateView,
    SubmitInvoiceView,
    SupplierClarificationResponseView,
    VerificationHistoryView,
)

urlpatterns = [
    path("", InvoiceListCreateView.as_view(), name="invoice-list-create"),
    path("verification-history/", VerificationHistoryView.as_view(), name="verification-history"),
    path("suppliers/", BuyerSupplierDirectoryView.as_view(), name="buyer-supplier-directory"),
    path("<uuid:pk>/", InvoiceDetailView.as_view(), name="invoice-detail"),
    path("<uuid:pk>/submit", SubmitInvoiceView.as_view(), name="invoice-submit"),
    path("<uuid:pk>/decision/", BuyerDecisionView.as_view(), name="buyer-invoice-decision"),
    path("<uuid:pk>/clarification-response/", SupplierClarificationResponseView.as_view(), name="supplier-clarification-response"),
]
