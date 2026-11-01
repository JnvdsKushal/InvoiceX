from django.urls import path
from .views import MarketplaceView, OfferListCreateView, AcceptOfferView, AgreementListView, ConfirmDisbursementView, RepaymentListView, RecordRepaymentView

urlpatterns = [
    path("marketplace/", MarketplaceView.as_view(), name="financing-marketplace"),
    path("offers/", OfferListCreateView.as_view(), name="financing-offers"),
    path("offers/<uuid:pk>/accept/", AcceptOfferView.as_view(), name="financing-offer-accept"),
    path("agreements/", AgreementListView.as_view(), name="financing-agreements"),
    path("agreements/<uuid:pk>/disburse/", ConfirmDisbursementView.as_view(), name="financing-disburse"),
    path("repayments/", RepaymentListView.as_view(), name="financing-repayments"),
    path("repayments/<uuid:pk>/record/", RecordRepaymentView.as_view(), name="financing-repayment-record"),
]
