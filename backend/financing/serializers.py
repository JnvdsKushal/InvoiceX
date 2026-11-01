from decimal import Decimal, ROUND_HALF_UP
from rest_framework import serializers
from .models import FinancingOffer, FinancingAgreement, Repayment


class FinancingOfferSerializer(serializers.ModelSerializer):
    invoiceNumber = serializers.CharField(source="invoice.invoice_number", read_only=True)
    invoiceAmount = serializers.DecimalField(source="invoice.amount", max_digits=14, decimal_places=2, read_only=True)
    currency = serializers.CharField(source="invoice.currency", read_only=True)
    supplierName = serializers.CharField(source="invoice.supplier_organization.name", read_only=True)
    buyerName = serializers.CharField(source="invoice.buyer_organization.name", read_only=True)
    lenderName = serializers.CharField(source="lender_organization.name", read_only=True)
    advanceAmount = serializers.SerializerMethodField()
    feeAmount = serializers.SerializerMethodField()

    class Meta:
        model = FinancingOffer
        fields = ("id", "invoice", "invoiceNumber", "invoiceAmount", "currency", "supplierName", "buyerName", "lenderName", "advance_percentage", "fee_percentage", "annual_interest_rate", "repayment_days", "expires_at", "status", "created_at", "advanceAmount", "feeAmount")
        read_only_fields = ("id", "status", "created_at")

    def get_advanceAmount(self, obj):
        return str((obj.invoice.amount * obj.advance_percentage / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

    def get_feeAmount(self, obj):
        advance = obj.invoice.amount * obj.advance_percentage / Decimal("100")
        return str((advance * obj.fee_percentage / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


class FinancingAgreementSerializer(serializers.ModelSerializer):
    invoiceNumber = serializers.CharField(source="invoice.invoice_number", read_only=True)
    lenderName = serializers.CharField(source="lender_organization.name", read_only=True)
    supplierName = serializers.CharField(source="supplier_organization.name", read_only=True)

    class Meta:
        model = FinancingAgreement
        fields = ("id", "offer", "invoice", "invoiceNumber", "lenderName", "supplierName", "principal_amount", "fee_amount", "interest_amount", "net_proceeds", "repayment_amount", "due_date", "status", "disbursement_reference", "funded_at", "created_at")


class RepaymentSerializer(serializers.ModelSerializer):
    invoiceNumber = serializers.CharField(source="agreement.invoice.invoice_number", read_only=True)
    lenderName = serializers.CharField(source="agreement.lender_organization.name", read_only=True)
    supplierName = serializers.CharField(source="agreement.supplier_organization.name", read_only=True)
    outstanding = serializers.SerializerMethodField()

    class Meta:
        model = Repayment
        fields = ("id", "agreement", "invoiceNumber", "lenderName", "supplierName", "amount_due", "amount_received", "outstanding", "due_date", "status", "payment_reference", "paid_at")

    def get_outstanding(self, obj):
        return str(obj.amount_due - obj.amount_received)
