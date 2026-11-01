import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models
from django.db.models import Q


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("invoices", "0003_invoice_workflow_statuses"),
        ("organizations", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="FinancingOffer",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("advance_percentage", models.DecimalField(decimal_places=2, max_digits=5)),
                ("fee_percentage", models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ("annual_interest_rate", models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ("repayment_days", models.PositiveIntegerField(default=60)),
                ("expires_at", models.DateTimeField()),
                ("status", models.CharField(choices=[("ACTIVE", "Active"), ("ACCEPTED", "Accepted"), ("REJECTED", "Rejected"), ("WITHDRAWN", "Withdrawn"), ("EXPIRED", "Expired")], default="ACTIVE", max_length=12)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("created_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="created_financing_offers", to=settings.AUTH_USER_MODEL)),
                ("invoice", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="financing_offers", to="invoices.invoice")),
                ("lender_organization", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="financing_offers", to="organizations.organization")),
            ],
            options={"ordering": ["-created_at"], "constraints": [
                models.CheckConstraint(condition=Q(("advance_percentage__gt", 0), ("advance_percentage__lte", 100)), name="offer_advance_percentage_valid"),
                models.CheckConstraint(condition=Q(("fee_percentage__gte", 0), ("fee_percentage__lte", 100)), name="offer_fee_percentage_valid"),
                models.CheckConstraint(condition=Q(("annual_interest_rate__gte", 0)), name="offer_interest_nonnegative"),
            ]},
        ),
        migrations.CreateModel(
            name="FinancingAgreement",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("principal_amount", models.DecimalField(decimal_places=2, max_digits=14)),
                ("fee_amount", models.DecimalField(decimal_places=2, max_digits=14)),
                ("interest_amount", models.DecimalField(decimal_places=2, max_digits=14)),
                ("net_proceeds", models.DecimalField(decimal_places=2, max_digits=14)),
                ("repayment_amount", models.DecimalField(decimal_places=2, max_digits=14)),
                ("due_date", models.DateField()),
                ("status", models.CharField(choices=[("FUNDING_PENDING", "Funding Pending"), ("REPAYMENT_PENDING", "Repayment Pending"), ("SETTLED", "Settled"), ("CANCELLED", "Cancelled")], default="FUNDING_PENDING", max_length=24)),
                ("disbursement_reference", models.CharField(blank=True, max_length=120)),
                ("funded_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("invoice", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="financing_agreements", to="invoices.invoice")),
                ("lender_organization", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="provided_financing", to="organizations.organization")),
                ("offer", models.OneToOneField(on_delete=django.db.models.deletion.PROTECT, related_name="agreement", to="financing.financingoffer")),
                ("supplier_organization", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="received_financing", to="organizations.organization")),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="Repayment",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("amount_due", models.DecimalField(decimal_places=2, max_digits=14)),
                ("amount_received", models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ("due_date", models.DateField()),
                ("status", models.CharField(choices=[("UPCOMING", "Upcoming"), ("PARTIALLY_PAID", "Partially Paid"), ("PAID", "Paid"), ("OVERDUE", "Overdue")], default="UPCOMING", max_length=20)),
                ("payment_reference", models.CharField(blank=True, max_length=120)),
                ("paid_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("agreement", models.OneToOneField(on_delete=django.db.models.deletion.PROTECT, related_name="repayment", to="financing.financingagreement")),
            ],
            options={"ordering": ["due_date"]},
        ),
    ]
