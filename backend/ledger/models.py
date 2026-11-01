import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone
from invoices.models import Invoice
from financing.models import FinancingAgreement


class LedgerOutboxEvent(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        DELIVERED = "DELIVERED", "Delivered"
        FAILED = "FAILED", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    event_type = models.CharField(max_length=64)
    entity_type = models.CharField(max_length=32)
    entity_id = models.CharField(max_length=64)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="ledger_outbox_events")
    invoice = models.ForeignKey(Invoice, null=True, blank=True, on_delete=models.PROTECT, related_name="ledger_events")
    financing_agreement = models.ForeignKey(FinancingAgreement, null=True, blank=True, on_delete=models.PROTECT, related_name="ledger_events")
    payload = models.JSONField(default=dict)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    attempts = models.PositiveIntegerField(default=0)
    next_attempt_at = models.DateTimeField(default=timezone.now)
    block_index = models.PositiveIntegerField(null=True, blank=True)
    block_hash = models.CharField(max_length=64, blank=True)
    last_error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["status", "next_attempt_at"], name="ledger_outbox_retry_idx"),
        ]

    def __str__(self):
        return f"{self.event_type} ({self.status})"
