from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import APIException, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from invoices.models import Invoice
from .models import FinancingOffer, FinancingAgreement, Repayment
from .serializers import FinancingOfferSerializer, FinancingAgreementSerializer, RepaymentSerializer


class WorkflowConflict(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "The requested financing transition is not valid."


def active_user(user, role):
    return bool(user.is_authenticated and user.is_active and user.status == "ACTIVE" and user.organization.status == "ACTIVE" and user.role == role)


def offer_queryset(user):
    qs = FinancingOffer.objects.select_related("invoice", "invoice__supplier_organization", "invoice__buyer_organization", "lender_organization")
    if user.role == "lender":
        return qs.filter(lender_organization=user.organization)
    if user.role == "supplier":
        return qs.filter(invoice__supplier_organization=user.organization)
    return qs.none()


class MarketplaceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not active_user(request.user, "lender"):
            raise PermissionDenied("An active lender account is required.")
        invoices = Invoice.objects.filter(status=Invoice.Status.ELIGIBLE_FOR_FINANCING).select_related("supplier_organization", "buyer_organization").order_by("due_date")
        return Response([{"id": str(row.id), "invoiceNumber": row.invoice_number, "supplierName": row.supplier_organization.name, "buyerName": row.buyer_organization.name, "amount": str(row.amount), "currency": row.currency, "issueDate": row.issue_date, "dueDate": row.due_date, "description": row.description, "purchaseOrderReference": row.purchase_order_reference, "version": row.version} for row in invoices])


class OfferListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(FinancingOfferSerializer(offer_queryset(request.user), many=True).data)

    def post(self, request):
        if not active_user(request.user, "lender"):
            raise PermissionDenied("An active lender account is required.")
        serializer = FinancingOfferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invoice_id = serializer.validated_data["invoice"].id
        with transaction.atomic():
            invoice = get_object_or_404(Invoice.objects.select_for_update(), pk=invoice_id)
            if invoice.status != Invoice.Status.ELIGIBLE_FOR_FINANCING:
                raise WorkflowConflict("Only buyer-verified, financing-eligible invoices can receive offers.")
            expires_at = serializer.validated_data["expires_at"]
            if expires_at <= timezone.now():
                return Response({"detail": "Offer expiry must be in the future."}, status=400)
            offer = serializer.save(invoice=invoice, lender_organization=request.user.organization, created_by=request.user)
        return Response(FinancingOfferSerializer(offer).data, status=201)


class AcceptOfferView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not active_user(request.user, "supplier"):
            raise PermissionDenied("An active supplier account is required.")
        with transaction.atomic():
            offer = get_object_or_404(FinancingOffer.objects.select_for_update().select_related("invoice"), pk=pk, invoice__supplier_organization=request.user.organization)
            if offer.status != FinancingOffer.Status.ACTIVE or offer.expires_at <= timezone.now():
                raise WorkflowConflict("This offer is no longer available.")
            invoice = Invoice.objects.select_for_update().get(pk=offer.invoice_id)
            if invoice.status != Invoice.Status.ELIGIBLE_FOR_FINANCING:
                raise WorkflowConflict("This invoice is no longer eligible for financing.")
            if FinancingAgreement.objects.filter(invoice=invoice).exclude(status=FinancingAgreement.Status.CANCELLED).exists():
                raise WorkflowConflict("This invoice already has an accepted financing agreement.")
            principal = (invoice.amount * offer.advance_percentage / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            fee = (principal * offer.fee_percentage / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            interest = (principal * offer.annual_interest_rate * offer.repayment_days / Decimal("36500")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            agreement = FinancingAgreement.objects.create(offer=offer, invoice=invoice, supplier_organization=invoice.supplier_organization, lender_organization=offer.lender_organization, principal_amount=principal, fee_amount=fee, interest_amount=interest, net_proceeds=principal-fee, repayment_amount=principal+interest, due_date=timezone.localdate()+timedelta(days=offer.repayment_days))
            offer.status = FinancingOffer.Status.ACCEPTED
            offer.save(update_fields=["status"])
            invoice.status = Invoice.Status.FUNDING_PENDING
            invoice.version += 1
            invoice.save(update_fields=["status", "version", "updated_at"])
        return Response(FinancingAgreementSerializer(agreement).data, status=201)


class AgreementListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = FinancingAgreement.objects.select_related("invoice", "supplier_organization", "lender_organization")
        if request.user.role == "supplier":
            qs = qs.filter(supplier_organization=request.user.organization)
        elif request.user.role == "lender":
            qs = qs.filter(lender_organization=request.user.organization)
        else:
            raise PermissionDenied("Supplier or lender access is required.")
        return Response(FinancingAgreementSerializer(qs, many=True).data)


class ConfirmDisbursementView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not active_user(request.user, "lender"):
            raise PermissionDenied("An active lender account is required.")
        reference = str(request.data.get("reference", "")).strip()
        if not reference:
            return Response({"detail": "A disbursement reference is required."}, status=400)
        with transaction.atomic():
            agreement = get_object_or_404(FinancingAgreement.objects.select_for_update(), pk=pk, lender_organization=request.user.organization)
            if agreement.status != FinancingAgreement.Status.FUNDING_PENDING:
                raise WorkflowConflict("Only funding-pending agreements can be confirmed.")
            agreement.status = FinancingAgreement.Status.REPAYMENT_PENDING
            agreement.disbursement_reference = reference
            agreement.funded_at = timezone.now()
            agreement.save(update_fields=["status", "disbursement_reference", "funded_at"])
            invoice = Invoice.objects.select_for_update().get(pk=agreement.invoice_id)
            invoice.status = Invoice.Status.REPAYMENT_PENDING
            invoice.version += 1
            invoice.save(update_fields=["status", "version", "updated_at"])
            Repayment.objects.create(agreement=agreement, amount_due=agreement.repayment_amount, due_date=agreement.due_date)
        return Response(FinancingAgreementSerializer(agreement).data)


class RepaymentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Repayment.objects.select_related("agreement", "agreement__invoice", "agreement__supplier_organization", "agreement__lender_organization")
        if request.user.role == "supplier":
            qs = qs.filter(agreement__supplier_organization=request.user.organization)
        elif request.user.role == "lender":
            qs = qs.filter(agreement__lender_organization=request.user.organization)
        else:
            raise PermissionDenied("Supplier or lender access is required.")
        today = timezone.localdate()
        for item in qs.filter(status=Repayment.Status.UPCOMING, due_date__lt=today):
            item.status = Repayment.Status.OVERDUE
            item.save(update_fields=["status"])
        return Response(RepaymentSerializer(qs, many=True).data)


class RecordRepaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not active_user(request.user, "lender"):
            raise PermissionDenied("An active lender account is required.")
        reference = str(request.data.get("reference", "")).strip()
        try:
            received = Decimal(str(request.data.get("amount")))
        except Exception:
            return Response({"detail": "Enter a valid received amount."}, status=400)
        if received <= 0 or not reference:
            return Response({"detail": "A positive amount and payment reference are required."}, status=400)
        with transaction.atomic():
            repayment = get_object_or_404(Repayment.objects.select_for_update().select_related("agreement"), pk=pk, agreement__lender_organization=request.user.organization)
            outstanding = repayment.amount_due - repayment.amount_received
            if received > outstanding:
                return Response({"detail": "Received amount exceeds the outstanding balance."}, status=400)
            repayment.amount_received += received
            repayment.payment_reference = reference
            if repayment.amount_received == repayment.amount_due:
                repayment.status = Repayment.Status.PAID
                repayment.paid_at = timezone.now()
            else:
                repayment.status = Repayment.Status.PARTIALLY_PAID
            repayment.save(update_fields=["amount_received", "payment_reference", "status", "paid_at"])
            if repayment.status == Repayment.Status.PAID:
                agreement = FinancingAgreement.objects.select_for_update().get(pk=repayment.agreement_id)
                agreement.status = FinancingAgreement.Status.SETTLED
                agreement.save(update_fields=["status"])
                invoice = Invoice.objects.select_for_update().get(pk=agreement.invoice_id)
                invoice.status = Invoice.Status.SETTLED
                invoice.version += 1
                invoice.save(update_fields=["status", "version", "updated_at"])
        return Response(RepaymentSerializer(repayment).data)
