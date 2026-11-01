from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("invoices", "0002_verificationevent"),
    ]

    operations = [
        migrations.AlterField(
            model_name="invoice",
            name="status",
            field=models.CharField(
                choices=[
                    ("DRAFT", "Draft"),
                    ("PENDING_VERIFICATION", "Pending Verification"),
                    ("NEEDS_CLARIFICATION", "Needs Clarification"),
                    ("VERIFIED", "Verified"),
                    ("REJECTED", "Rejected"),
                    ("DISPUTED", "Disputed"),
                    ("ELIGIBLE_FOR_FINANCING", "Eligible for Financing"),
                    ("OFFER_PENDING", "Offer Pending"),
                    ("OFFER_ACCEPTED", "Offer Accepted"),
                    ("FUNDING_PENDING", "Funding Pending"),
                    ("FUNDED", "Funded"),
                    ("REPAYMENT_PENDING", "Repayment Pending"),
                    ("SETTLED", "Settled"),
                    ("CANCELLED", "Cancelled"),
                ],
                default="DRAFT",
                max_length=30,
            ),
        ),
    ]
