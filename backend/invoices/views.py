from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.exceptions import APIException, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from organizations.models import Organization
from .models import Invoice, VerificationEvent
from .serializers import InvoiceSerializer
from ledger.services import queue_ledger_event


class Conflict(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "WORKFLOW_CONFLICT"
    default_detail = "The requested change conflicts with the current state."


def visible_invoices(user):
    queryset = Invoice.objects.select_related("supplier_organization", "buyer_organization")
    if user.role == "admin" and user.is_superuser:
        return queryset
    if user.role == "supplier":
        return queryset.filter(supplier_organization_id=user.organization_id)
    if user.role == "buyer":
        return queryset.filter(buyer_organization_id=user.organization_id)
    return queryset.none()


class InvoiceListCreateView(generics.ListCreateAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return visible_invoices(self.request.user)

    def perform_create(self, serializer):
        if self.request.user.role != "supplier":
            raise PermissionDenied("Only supplier users can create invoices.")
        if self.request.user.status != "ACTIVE" or self.request.user.organization.status != "ACTIVE":
            raise PermissionDenied("Your account and organization must be active.")
        with transaction.atomic():
            invoice = serializer.save()
            queue_ledger_event(
                event_type="INVOICE_DRAFT_CREATED",
                entity_type="invoice",
                entity_id=invoice.id,
                actor=self.request.user,
                invoice=invoice,
                payload={"status": invoice.status, "version": invoice.version, "currency": invoice.currency},
            )


class InvoiceDetailView(generics.RetrieveAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return visible_invoices(self.request.user)


class SubmitInvoiceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != "supplier":
            raise PermissionDenied("Only suppliers can submit invoices.")
        invoice = get_object_or_404(visible_invoices(request.user), pk=pk)
        version = request.data.get("version")
        if isinstance(version, bool) or not isinstance(version, int):
            return Response({"detail": "A valid invoice version is required."}, status=400)
        with transaction.atomic():
            invoice = Invoice.objects.select_for_update().get(pk=invoice.pk)
            if invoice.version != version:
                raise Conflict("STALE_VERSION: Reload the invoice.")
            if invoice.status != Invoice.Status.DRAFT:
                raise Conflict("Only draft invoices can be submitted.")
            invoice.status = Invoice.Status.PENDING_VERIFICATION
            invoice.version += 1
            invoice.save(update_fields=["status", "version", "updated_at"])
            queue_ledger_event(
                event_type="INVOICE_SUBMITTED",
                entity_type="invoice",
                entity_id=invoice.id,
                actor=request.user,
                invoice=invoice,
                payload={"status": invoice.status, "version": invoice.version},
            )
        return Response(InvoiceSerializer(invoice, context={"request": request}).data)


class BuyerDecisionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        if user.role != "buyer" or user.status != "ACTIVE" or user.organization.status != "ACTIVE":
            raise PermissionDenied("An active buyer account is required.")
        decision = request.data.get("decision")
        comment = str(request.data.get("comment", "")).strip()
        version = request.data.get("version")
        allowed = {
            "APPROVED": Invoice.Status.ELIGIBLE_FOR_FINANCING,
            "REJECTED": Invoice.Status.REJECTED,
            "CLARIFICATION": Invoice.Status.NEEDS_CLARIFICATION,
        }
        if decision not in allowed:
            return Response({"detail": "Decision must be APPROVED, REJECTED or CLARIFICATION."}, status=400)
        if decision != "APPROVED" and not comment:
            return Response({"detail": "A comment is required for rejection or clarification."}, status=400)
        if isinstance(version, bool) or not isinstance(version, int):
            return Response({"detail": "A valid invoice version is required."}, status=400)
        invoice = get_object_or_404(visible_invoices(user), pk=pk)
        with transaction.atomic():
            invoice = Invoice.objects.select_for_update().get(pk=invoice.pk)
            if invoice.version != version:
                raise Conflict("STALE_VERSION: Reload the invoice before deciding.")
            if invoice.status not in [Invoice.Status.PENDING_VERIFICATION, Invoice.Status.NEEDS_CLARIFICATION]:
                raise Conflict("This invoice is not awaiting buyer verification.")
            previous = invoice.status
            invoice.status = allowed[decision]
            invoice.version += 1
            invoice.save(update_fields=["status", "version", "updated_at"])
            event = VerificationEvent.objects.create(
                invoice=invoice, actor=user, decision=decision, comment=comment,
                previous_status=previous, new_status=invoice.status,
                invoice_version=invoice.version,
            )
            queue_ledger_event(
                event_type="BUYER_INVOICE_" + decision,
                entity_type="invoice",
                entity_id=invoice.id,
                actor=user,
                invoice=invoice,
                payload={"decision": decision, "status": invoice.status, "version": invoice.version},
            )
        return Response({
            "invoice": InvoiceSerializer(invoice, context={"request": request}).data,
            "verification": {
                "id": str(event.id), "decision": event.decision, "comment": event.comment,
                "previousStatus": event.previous_status, "newStatus": event.new_status,
                "invoiceVersion": event.invoice_version, "createdAt": event.created_at,
                "actorName": user.name,
            },
        })


class SupplierClarificationResponseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        if user.role != "supplier" or user.status != "ACTIVE" or user.organization.status != "ACTIVE":
            raise PermissionDenied("An active supplier account is required.")

        comment = str(request.data.get("comment", "")).strip()
        version = request.data.get("version")
        if not comment:
            return Response({"detail": "Please provide a response to the buyer's clarification."}, status=400)
        if len(comment) > 5000:
            return Response({"detail": "The response must be 5,000 characters or fewer."}, status=400)
        if isinstance(version, bool) or not isinstance(version, int):
            return Response({"detail": "A valid invoice version is required."}, status=400)

        invoice = get_object_or_404(visible_invoices(user), pk=pk)
        with transaction.atomic():
            invoice = Invoice.objects.select_for_update().get(pk=invoice.pk)
            if invoice.version != version:
                raise Conflict("STALE_VERSION: Reload the invoice before responding.")
            if invoice.status != Invoice.Status.NEEDS_CLARIFICATION:
                raise Conflict("This invoice is not currently awaiting a supplier clarification response.")

            previous = invoice.status
            invoice.version += 1
            invoice.save(update_fields=["version", "updated_at"])
            event = VerificationEvent.objects.create(
                invoice=invoice,
                actor=user,
                decision=VerificationEvent.Decision.CLARIFICATION_RESPONSE,
                comment=comment,
                previous_status=previous,
                new_status=invoice.status,
                invoice_version=invoice.version,
            )
            queue_ledger_event(
                event_type="SUPPLIER_CLARIFICATION_RESPONDED",
                entity_type="invoice",
                entity_id=invoice.id,
                actor=user,
                invoice=invoice,
                payload={"status": invoice.status, "version": invoice.version, "response_event_id": str(event.id)},
            )

        return Response({
            "invoice": InvoiceSerializer(invoice, context={"request": request}).data,
            "response": {
                "id": str(event.id),
                "comment": event.comment,
                "invoiceVersion": event.invoice_version,
                "createdAt": event.created_at,
                "actorName": user.name,
            },
        })


class VerificationHistoryView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = VerificationEvent.objects.select_related("invoice", "actor", "invoice__supplier_organization")
        if self.request.user.role == "buyer":
            qs = qs.filter(invoice__buyer_organization=self.request.user.organization)
        elif self.request.user.role == "supplier":
            qs = qs.filter(invoice__supplier_organization=self.request.user.organization)
        else:
            return qs.none()
        return qs.order_by("-created_at")

    def list(self, request, *args, **kwargs):
        rows = self.get_queryset()
        return Response([{
            "id": str(row.id), "invoiceId": str(row.invoice_id),
            "invoiceNumber": row.invoice.invoice_number,
            "supplierName": row.invoice.supplier_organization.name,
            "decision": row.decision, "comment": row.comment,
            "previousStatus": row.previous_status, "newStatus": row.new_status,
            "invoiceVersion": row.invoice_version, "createdAt": row.created_at,
            "actorName": row.actor.name,
        } for row in rows])


class BuyerSupplierDirectoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "buyer":
            raise PermissionDenied("Only buyer users can access this directory.")
        suppliers = Organization.objects.filter(
            supplier_invoices__buyer_organization=request.user.organization
        ).distinct().order_by("name")
        return Response([{
            "id": str(org.id), "name": org.name, "status": org.status,
            "registrationIdentifier": org.registration_identifier,
            "invoiceCount": org.supplier_invoices.filter(buyer_organization=request.user.organization).count(),
        } for org in suppliers])
