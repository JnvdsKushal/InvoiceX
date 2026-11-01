
from django.urls import path

from .admin_views import (
    AdminOverviewView,
    AdminOrganizationListView,
    PendingOrganizationListView,
    ApproveOrganizationView,
)

urlpatterns = [
    path("overview/", AdminOverviewView.as_view(), name="admin-overview"),

    path(
        "organizations/",
        AdminOrganizationListView.as_view(),
        name="admin-organizations",
    ),

    path(
        "organizations/pending/",
        PendingOrganizationListView.as_view(),
        name="admin-pending-organizations",
    ),

    path(
        "organizations/<uuid:pk>/approve/",
        ApproveOrganizationView.as_view(),
        name="admin-approve-organization",
    ),
]
