import uuid
from django.db import models
from django.db.models import Q
from invoices.models import Invoice
from organizations.models import Organization


class FinancingOffer(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        ACCEPTED = "ACCEPTED", "Accepted"
        REJECTED = "REJECTED", "Rejected"
        WITHDRAWN = "WITHDRAWN", "Withdrawn"
        EXPIRED = "EXPIRED", "Expired"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name="financing_offers")
    lender_organization = models.ForeignKey(Organization, on_delete=models.PROTECT, related_name="financing_offers")
    created_by = models.ForeignKey("accounts.User", on_delete=models.PROTECT, related_name="created_financing_offers")
    advance_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    fee_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    annual_interest_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    repayment_days = models.PositiveIntegerField(default=60)
    expires_at = models.DateTimeField()
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(condition=Q(advance_percentage__gt=0) & Q(advance_percentage__lte=100), name="offer_advance_percentage_valid"),
            models.CheckConstraint(condition=Q(fee_percentage__gte=0) & Q(fee_percentage__lte=100), name="offer_fee_percentage_valid"),
            models.CheckConstraint(condition=Q(annual_interest_rate__gte=0), name="offer_interest_nonnegative"),
        ]


class FinancingAgreement(models.Model):
    class Status(models.TextChoices):
        FUNDING_PENDING = "FUNDING_PENDING", "Funding Pending"
        REPAYMENT_PENDING = "REPAYMENT_PENDING", "Repayment Pending"
        SETTLED = "SETTLED", "Settled"
        CANCELLED = "CANCELLED", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    offer = models.OneToOneField(FinancingOffer, on_delete=models.PROTECT, related_name="agreement")
    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name="financing_agreements")
    supplier_organization = models.ForeignKey(Organization, on_delete=models.PROTECT, related_name="received_financing")
    lender_organization = models.ForeignKey(Organization, on_delete=models.PROTECT, related_name="provided_financing")
    principal_amount = models.DecimalField(max_digits=14, decimal_places=2)
    fee_amount = models.DecimalField(max_digits=14, decimal_places=2)
    interest_amount = models.DecimalField(max_digits=14, decimal_places=2)
    net_proceeds = models.DecimalField(max_digits=14, decimal_places=2)
    repayment_amount = models.DecimalField(max_digits=14, decimal_places=2)
    due_date = models.DateField()
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.FUNDING_PENDING)
    disbursement_reference = models.CharField(max_length=120, blank=True)
    funded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class Repayment(models.Model):
    class Status(models.TextChoices):
        UPCOMING = "UPCOMING", "Upcoming"
        PARTIALLY_PAID = "PARTIALLY_PAID", "Partially Paid"
        PAID = "PAID", "Paid"
        OVERDUE = "OVERDUE", "Overdue"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agreement = models.OneToOneField(FinancingAgreement, on_delete=models.PROTECT, related_name="repayment")
    amount_due = models.DecimalField(max_digits=14, decimal_places=2)
    amount_received = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UPCOMING)
    payment_reference = models.CharField(max_length=120, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["due_date"]


class RepaymentReceipt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    repayment = models.ForeignKey(Repayment, on_delete=models.PROTECT, related_name="receipts")
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    reference = models.CharField(max_length=120)
    recorded_by = models.ForeignKey("accounts.User", on_delete=models.PROTECT, related_name="recorded_repayment_receipts")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
