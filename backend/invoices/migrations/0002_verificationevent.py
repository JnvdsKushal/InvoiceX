import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("invoices", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="VerificationEvent",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("decision", models.CharField(choices=[("APPROVED", "Approved"), ("REJECTED", "Rejected"), ("CLARIFICATION", "Clarification Requested")], max_length=20)),
                ("comment", models.TextField(blank=True)),
                ("previous_status", models.CharField(max_length=30)),
                ("new_status", models.CharField(max_length=30)),
                ("invoice_version", models.PositiveIntegerField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("actor", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="invoice_verification_events", to=settings.AUTH_USER_MODEL)),
                ("invoice", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="verification_events", to="invoices.invoice")),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
