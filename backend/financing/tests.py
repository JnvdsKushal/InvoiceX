from datetime import date, timedelta
from decimal import Decimal
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from accounts.models import User
from organizations.models import Organization
from invoices.models import Invoice
from .models import FinancingAgreement, FinancingOffer, Repayment


class FinancingWorkflowTests(APITestCase):
    def setUp(self):
        self.supplier_org = Organization.objects.create(name="Supplier Co", type="MSME", status="ACTIVE")
        self.buyer_org = Organization.objects.create(name="Buyer Co", type="BUYER", status="ACTIVE")
        self.lender_org = Organization.objects.create(name="Lender Co", type="LENDER", status="ACTIVE")
        self.supplier = User.objects.create_user(email="supplier-fin@example.com", password="TestPassword123!", name="Supplier", organization=self.supplier_org, role="supplier", status="ACTIVE", is_active=True)
        self.buyer = User.objects.create_user(email="buyer-fin@example.com", password="TestPassword123!", name="Buyer", organization=self.buyer_org, role="buyer", status="ACTIVE", is_active=True)
        self.lender = User.objects.create_user(email="lender-fin@example.com", password="TestPassword123!", name="Lender", organization=self.lender_org, role="lender", status="ACTIVE", is_active=True)
        self.invoice = Invoice.objects.create(
            supplier_organization=self.supplier_org,
            buyer_organization=self.buyer_org,
            invoice_number="INV-FIN-001",
            issue_date=date.today(),
            due_date=date.today() + timedelta(days=60),
            amount=Decimal("100000.00"),
            currency="INR",
            status=Invoice.Status.ELIGIBLE_FOR_FINANCING,
        )

    def test_lender_can_create_offer_supplier_accept_and_repay(self):
        self.client.force_authenticate(user=self.lender)
        response = self.client.post(
            reverse("financing-offers"),
            {
                "invoice": str(self.invoice.id),
                "advance_percentage": "85.00",
                "fee_percentage": "1.50",
                "annual_interest_rate": "12.00",
                "repayment_days": 60,
                "expires_at": (timezone.now() + timedelta(days=5)).isoformat(),
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        offer_id = response.data["id"]

        self.client.force_authenticate(user=self.supplier)
        accepted = self.client.post(reverse("financing-offer-accept", kwargs={"pk": offer_id}), {}, format="json")
        self.assertEqual(accepted.status_code, 201, accepted.data)
        agreement_id = accepted.data["id"]
        self.assertEqual(accepted.data["status"], FinancingAgreement.Status.FUNDING_PENDING)

        self.client.force_authenticate(user=self.lender)
        funded = self.client.post(
            reverse("financing-disburse", kwargs={"pk": agreement_id}),
            {"reference": "BANK-TEST-REF-001"},
            format="json",
        )
        self.assertEqual(funded.status_code, 200, funded.data)
        self.assertEqual(funded.data["status"], FinancingAgreement.Status.REPAYMENT_PENDING)

        repayment = Repayment.objects.get(agreement_id=agreement_id)
        paid = self.client.post(
            reverse("financing-repayment-record", kwargs={"pk": repayment.id}),
            {"amount": str(repayment.amount_due), "reference": "PAYMENT-TEST-001"},
            format="json",
        )
        self.assertEqual(paid.status_code, 200, paid.data)
        self.assertEqual(paid.data["status"], Repayment.Status.PAID)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.Status.SETTLED)

    def test_lender_cannot_offer_on_unverified_invoice(self):
        self.invoice.status = Invoice.Status.PENDING_VERIFICATION
        self.invoice.save(update_fields=["status"])
        self.client.force_authenticate(user=self.lender)
        response = self.client.post(
            reverse("financing-offers"),
            {
                "invoice": str(self.invoice.id),
                "advance_percentage": "85.00",
                "fee_percentage": "1.50",
                "annual_interest_rate": "12.00",
                "repayment_days": 60,
                "expires_at": (timezone.now() + timedelta(days=5)).isoformat(),
            },
            format="json",
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(FinancingOffer.objects.count(), 0)
