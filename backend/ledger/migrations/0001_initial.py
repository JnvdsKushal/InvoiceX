import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("invoices", "0002_verificationevent"),
        ("financing", "0002_repaymentreceipt"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="LedgerOutboxEvent",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("event_id", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ("event_type", models.CharField(max_length=64)),
                ("entity_type", models.CharField(max_length=32)),
                ("entity_id", models.CharField(max_length=64)),
                ("payload", models.JSONField(default=dict)),
                ("status", models.CharField(choices=[("PENDING", "Pending"), ("DELIVERED", "Delivered"), ("FAILED", "Failed")], default="PENDING", max_length=12)),
                ("attempts", models.PositiveIntegerField(default=0)),
                ("next_attempt_at", models.DateTimeField()),
                ("block_index", models.PositiveIntegerField(blank=True, null=True)),
                ("block_hash", models.CharField(blank=True, max_length=64)),
                ("last_error", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("delivered_at", models.DateTimeField(blank=True, null=True)),
                ("actor", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="ledger_outbox_events", to=settings.AUTH_USER_MODEL)),
                ("financing_agreement", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="ledger_events", to="financing.financingagreement")),
                ("invoice", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="ledger_events", to="invoices.invoice")),
            ],
            options={"ordering": ["created_at"], "indexes": [models.Index(fields=["status", "next_attempt_at"], name="ledger_outbox_retry_idx")]},
        ),
    ]
