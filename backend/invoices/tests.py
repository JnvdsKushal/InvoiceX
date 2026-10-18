
from datetime import date, timedelta
from decimal import Decimal

from django.urls import reverse
from rest_framework.test import APITestCase

from accounts.models import User
from organizations.models import Organization
from .models import Invoice


class InvoiceAPITests(APITestCase):
    def setUp(self):
        self.supplier_org = Organization.objects.create(
            name="Supplier One",
            type="MSME",
            status="ACTIVE",
        )
        self.other_supplier_org = Organization.objects.create(
            name="Supplier Two",
            type="MSME",
            status="ACTIVE",
        )
        self.buyer_org = Organization.objects.create(
            name="Buyer One",
            type="BUYER",
            status="ACTIVE",
        )

        self.supplier = User.objects.create_user(
            email="supplier@example.com",
            password="TestPassword123!",
            name="Supplier User",
            organization=self.supplier_org,
            role="supplier",
            status="ACTIVE",
            is_active=True,
        )

        self.other_supplier = User.objects.create_user(
            email="other@example.com",
            password="TestPassword123!",
            name="Other Supplier",
            organization=self.other_supplier_org,
            role="supplier",
            status="ACTIVE",
            is_active=True,
        )

        self.invoice_url = reverse("invoice-list-create")
        self.client.force_authenticate(user=self.supplier)

    def invoice_payload(self, invoice_number="INV-TEST-001"):
        today = date.today()
        return {
            "buyerOrganizationId": str(self.buyer_org.id),
            "invoiceNumber": invoice_number,
            "issueDate": today.isoformat(),
            "dueDate": (today + timedelta(days=30)).isoformat(),
            "amount": "12500.00",
            "currency": "INR",
            "purchaseOrderReference": "PO-TEST-001",
            "description": "Test invoice",
        }

    def test_supplier_can_create_invoice(self):
        response = self.client.post(
            self.invoice_url,
            self.invoice_payload(),
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["status"], "DRAFT")
        self.assertEqual(response.data["organizationId"], str(self.supplier_org.id))
        self.assertEqual(response.data["buyerOrganizationId"], str(self.buyer_org.id))

    def test_supplier_cannot_see_another_suppliers_invoice(self):
        invoice = Invoice.objects.create(
            supplier_organization=self.other_supplier_org,
            buyer_organization=self.buyer_org,
            invoice_number="INV-PRIVATE-001",
            issue_date=date.today(),
            due_date=date.today() + timedelta(days=30),
            amount=Decimal("5000.00"),
            currency="INR",
        )

        response = self.client.get(self.invoice_url)

        self.assertEqual(response.status_code, 200)
        returned_ids = {item["id"] for item in response.data["results"]}
        self.assertNotIn(str(invoice.id), returned_ids)

    def test_supplier_can_submit_draft_with_current_version(self):
        invoice = Invoice.objects.create(
            supplier_organization=self.supplier_org,
            buyer_organization=self.buyer_org,
            invoice_number="INV-SUBMIT-001",
            issue_date=date.today(),
            due_date=date.today() + timedelta(days=30),
            amount=Decimal("7500.00"),
            currency="INR",
        )

        response = self.client.post(
            reverse("invoice-submit", kwargs={"pk": invoice.id}),
            {"version": 1},
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(
            response.data["status"],
            "PENDING_VERIFICATION",
        )
        self.assertEqual(response.data["version"], 2)

    def test_stale_version_submission_is_rejected(self):
        invoice = Invoice.objects.create(
            supplier_organization=self.supplier_org,
            buyer_organization=self.buyer_org,
            invoice_number="INV-STALE-001",
            issue_date=date.today(),
            due_date=date.today() + timedelta(days=30),
            amount=Decimal("9000.00"),
            currency="INR",
        )

        response = self.client.post(
            reverse("invoice-submit", kwargs={"pk": invoice.id}),
            {"version": 0},
            format="json",
        )

        self.assertEqual(response.status_code, 409)
        invoice.refresh_from_db()
        self.assertEqual(invoice.status, Invoice.Status.DRAFT)
        self.assertEqual(invoice.version, 1)
