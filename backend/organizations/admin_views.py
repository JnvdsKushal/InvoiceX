
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Organization
from .permissions import IsPlatformAdmin
from .admin_serializers import AdminOrganizationSerializer

User = get_user_model()


class AdminOverviewView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        organizations = Organization.objects.all()

        data = {
            "total_organizations": organizations.count(),
            "pending_organizations": organizations.filter(
                status=Organization.Status.PENDING
            ).count(),
            "active_organizations": organizations.filter(
                status=Organization.Status.ACTIVE
            ).count(),
            "suspended_organizations": organizations.filter(
                status=Organization.Status.SUSPENDED
            ).count(),
            "total_users": User.objects.count(),
            "active_users": User.objects.filter(
                is_active=True,
                status=User.AccountStatus.ACTIVE,
            ).count(),
            "pending_users": User.objects.filter(
                status=User.AccountStatus.PENDING
            ).count(),
        }

        return Response(data)


class AdminOrganizationListView(generics.ListAPIView):
    serializer_class = AdminOrganizationSerializer
    permission_classes = [IsPlatformAdmin]

    def get_queryset(self):
        queryset = Organization.objects.annotate(
            user_count=Count("users")
        ).order_by("-created_at")

        organization_status = self.request.query_params.get("status")
        organization_type = self.request.query_params.get("type")
        search = self.request.query_params.get("search")

        if organization_status:
            queryset = queryset.filter(status=organization_status.upper())

        if organization_type:
            queryset = queryset.filter(type=organization_type.upper())

        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset


class PendingOrganizationListView(generics.ListAPIView):
    serializer_class = AdminOrganizationSerializer
    permission_classes = [IsPlatformAdmin]

    def get_queryset(self):
        return (
            Organization.objects
            .filter(status=Organization.Status.PENDING)
            .annotate(user_count=Count("users"))
            .order_by("created_at")
        )


class ApproveOrganizationView(APIView):
    permission_classes = [IsPlatformAdmin]

    @transaction.atomic
    def post(self, request, pk):
        organization = get_object_or_404(
            Organization.objects.select_for_update(),
            pk=pk,
        )

        if organization.status != Organization.Status.PENDING:
            return Response(
                {
                    "detail": (
                        "Only pending organizations can be approved."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        organization.status = Organization.Status.ACTIVE
        organization.save(update_fields=["status"])

        # Activate only pending users belonging to this organization.
        activated_users = User.objects.filter(
            organization=organization,
            status=User.AccountStatus.PENDING,
        ).update(
            status=User.AccountStatus.ACTIVE,
            is_active=True,
        )

        return Response(
            {
                "detail": "Organization approved successfully.",
                "organization_id": str(organization.id),
                "organization_name": organization.name,
                "status": organization.status,
                "activated_users": activated_users,
            },
            status=status.HTTP_200_OK,
        )
