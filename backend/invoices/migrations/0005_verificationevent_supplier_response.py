from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("invoices", "0004_verificationevent"),
    ]

    operations = [
        migrations.AlterField(
            model_name="verificationevent",
            name="decision",
            field=models.CharField(
                choices=[
                    ("APPROVED", "Approved"),
                    ("REJECTED", "Rejected"),
                    ("CLARIFICATION", "Clarification Requested"),
                    ("CLARIFICATION_RESPONSE", "Supplier Clarification Response"),
                ],
                max_length=30,
            ),
        ),
    ]
