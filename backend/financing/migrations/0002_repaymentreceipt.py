import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("financing", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="RepaymentReceipt",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=14)),
                ("reference", models.CharField(max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("recorded_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="recorded_repayment_receipts", to=settings.AUTH_USER_MODEL)),
                ("repayment", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="receipts", to="financing.repayment")),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
