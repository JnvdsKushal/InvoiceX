import uuid

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q

from organizations.models import Organization


class Invoice(models.Model):

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PENDING_VERIFICATION = "PENDING_VERIFICATION", "Pending Verification"
        NEEDS_CLARIFICATION = "NEEDS_CLARIFICATION", "Needs Clarification"
        VERIFIED = "VERIFIED", "Verified"
        REJECTED = "REJECTED", "Rejected"
        DISPUTED = "DISPUTED", "Disputed"
        ELIGIBLE_FOR_FINANCING = "ELIGIBLE_FOR_FINANCING", "Eligible for Financing"
        OFFER_PENDING = "OFFER_PENDING", "Offer Pending"
        OFFER_ACCEPTED = "OFFER_ACCEPTED", "Offer Accepted"
        FUNDING_PENDING = "FUNDING_PENDING", "Funding Pending"
        FUNDED = "FUNDED", "Funded"
        REPAYMENT_PENDING = "REPAYMENT_PENDING", "Repayment Pending"
        SETTLED = "SETTLED", "Settled"
        CANCELLED = "CANCELLED", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    supplier_organization = models.ForeignKey(
        Organization, on_delete=models.PROTECT, related_name="supplier_invoices"
    )
    buyer_organization = models.ForeignKey(
        Organization, on_delete=models.PROTECT, related_name="buyer_invoices"
    )
    invoice_number = models.CharField(max_length=100)
    issue_date = models.DateField()
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=3, default="INR")
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.DRAFT)
    purchase_order_reference = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True)
    version = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["supplier_organization", "invoice_number"],
                name="unique_invoice_number_per_supplier",
            ),
            models.CheckConstraint(condition=Q(amount__gt=0), name="invoice_amount_must_be_positive"),
            models.CheckConstraint(condition=Q(due_date__gte=F("issue_date")), name="invoice_due_date_not_before_issue_date"),
        ]

    def clean(self):
        super().clean()
        if self.supplier_organization_id and self.buyer_organization_id and self.supplier_organization_id == self.buyer_organization_id:
            raise ValidationError("The supplier and buyer must be different organizations.")
        if self.issue_date and self.due_date and self.due_date < self.issue_date:
            raise ValidationError({"due_date": "Due date cannot be before issue date."})
        if self.amount is not None and self.amount <= 0:
            raise ValidationError({"amount": "Invoice amount must be greater than zero."})

    def __str__(self):
        return f"{self.invoice_number} - {self.amount} {self.currency}"


class VerificationEvent(models.Model):
    class Decision(models.TextChoices):
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        CLARIFICATION = "CLARIFICATION", "Clarification Requested"
        CLARIFICATION_RESPONSE = "CLARIFICATION_RESPONSE", "Supplier Clarification Response"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name="verification_events")
    actor = models.ForeignKey("accounts.User", on_delete=models.PROTECT, related_name="invoice_verification_events")
    decision = models.CharField(max_length=30, choices=Decision.choices)
    comment = models.TextField(blank=True)
    previous_status = models.CharField(max_length=30)
    new_status = models.CharField(max_length=30)
    invoice_version = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
