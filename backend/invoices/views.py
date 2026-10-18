
from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.exceptions import APIException, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Invoice
from .serializers import InvoiceSerializer


class Conflict(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "WORKFLOW_CONFLICT"
    default_detail = "The requested change conflicts with the current state."


def visible_invoices(user):
    queryset = Invoice.objects.select_related(
        "supplier_organization",
        "buyer_organization",
    )

    if user.role == "admin" and user.is_superuser:
        return queryset

    if user.role == "supplier":
        return queryset.filter(
            supplier_organization_id=user.organization_id
        )

    if user.role == "buyer":
        return queryset.filter(
            buyer_organization_id=user.organization_id
        )

    # Lenders will get a dedicated eligible-opportunities API later.
    return queryset.none()


class InvoiceListCreateView(generics.ListCreateAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return visible_invoices(self.request.user)

    def perform_create(self, serializer):
        if self.request.user.role != "supplier":
            raise PermissionDenied(
                "Only supplier users can create invoices."
            )

        if self.request.user.status != "ACTIVE":
            raise PermissionDenied("Your account is not active.")

        if self.request.user.organization.status != "ACTIVE":
            raise PermissionDenied(
                "Your organization is not active."
            )

        serializer.save()


class InvoiceDetailView(generics.RetrieveAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return visible_invoices(self.request.user)


class SubmitInvoiceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != "supplier":
            raise PermissionDenied(
                "Only suppliers can submit invoices."
            )

        if request.user.status != "ACTIVE":
            raise PermissionDenied("Your account is not active.")

        invoice = get_object_or_404(
            visible_invoices(request.user),
            pk=pk,
        )

        if invoice.status != Invoice.Status.DRAFT:
            raise Conflict("Only draft invoices can be submitted.")

        version = request.data.get("version")

        if isinstance(version, bool) or not isinstance(version, int):
            return Response(
                {"error": {
                    "code": "VALIDATION_ERROR",
                    "message": "A valid invoice version is required.",
                }},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            invoice = Invoice.objects.select_for_update().get(pk=invoice.pk)

            if invoice.version != version:
                raise Conflict("STALE_VERSION: Reload the invoice.")

            if invoice.status != Invoice.Status.DRAFT:
                raise Conflict("Only draft invoices can be submitted.")

            invoice.status = Invoice.Status.PENDING_VERIFICATION
            invoice.version += 1

            try:
                invoice.save(
                    update_fields=["status", "version", "updated_at"]
                )
            except IntegrityError:
                raise Conflict("The invoice could not be submitted.")

        return Response(
            InvoiceSerializer(
                invoice,
                context={"request": request},
            ).data
        )
