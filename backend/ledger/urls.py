from django.urls import path
from .views import LedgerEventsView, LedgerVerifyView

urlpatterns = [
    path("events/", LedgerEventsView.as_view(), name="ledger-events"),
    path("verify/", LedgerVerifyView.as_view(), name="ledger-verify"),
]
