
from datetime import date, timedelta
from decimal import Decimal

from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
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


    def test_buyer_can_approve_invoice_and_history_is_saved(self):
        invoice = Invoice.objects.create(
            supplier_organization=self.supplier_org,
            buyer_organization=self.buyer_org,
            invoice_number="INV-BUYER-001",
            issue_date=date.today(),
            due_date=date.today() + timedelta(days=20),
            amount=Decimal("18000.00"),
            currency="INR",
            status=Invoice.Status.PENDING_VERIFICATION,
        )
        buyer = User.objects.create_user(
            email="buyer@example.com",
            password="TestPassword123!",
            name="Buyer User",
            organization=self.buyer_org,
            role="buyer",
            status="ACTIVE",
            is_active=True,
        )
        self.client.force_authenticate(user=buyer)
        response = self.client.post(
            reverse("buyer-invoice-decision", kwargs={"pk": invoice.id}),
            {"decision": "APPROVED", "comment": "", "version": 1},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        invoice.refresh_from_db()
        self.assertEqual(invoice.status, Invoice.Status.ELIGIBLE_FOR_FINANCING)
        self.assertEqual(invoice.version, 2)
        self.assertEqual(response.data["verification"]["decision"], "APPROVED")

    def test_buyer_rejection_requires_comment(self):
        invoice = Invoice.objects.create(
            supplier_organization=self.supplier_org,
            buyer_organization=self.buyer_org,
            invoice_number="INV-BUYER-002",
            issue_date=date.today(),
            due_date=date.today() + timedelta(days=20),
            amount=Decimal("18000.00"),
            currency="INR",
            status=Invoice.Status.PENDING_VERIFICATION,
        )
        buyer = User.objects.create_user(
            email="buyer2@example.com",
            password="TestPassword123!",
            name="Buyer User",
            organization=self.buyer_org,
            role="buyer",
            status="ACTIVE",
            is_active=True,
        )
        self.client.force_authenticate(user=buyer)
        response = self.client.post(
            reverse("buyer-invoice-decision", kwargs={"pk": invoice.id}),
            {"decision": "REJECTED", "comment": "", "version": 1},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        invoice.refresh_from_db()
        self.assertEqual(invoice.status, Invoice.Status.PENDING_VERIFICATION)


    def test_supplier_can_respond_to_buyer_clarification(self):
        invoice = Invoice.objects.create(
            supplier_organization=self.supplier_org,
            buyer_organization=self.buyer_org,
            invoice_number="INV-CLARIFY-001",
            issue_date=date.today(),
            due_date=date.today() + timedelta(days=20),
            amount=Decimal("18000.00"),
            currency="INR",
            status=Invoice.Status.NEEDS_CLARIFICATION,
        )
        response = self.client.post(
            reverse("supplier-clarification-response", kwargs={"pk": invoice.id}),
            {"comment": "Attached the corrected purchase order reference.", "version": 1},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        invoice.refresh_from_db()
        self.assertEqual(invoice.status, Invoice.Status.NEEDS_CLARIFICATION)
        self.assertEqual(invoice.version, 2)
        self.assertEqual(
            response.data["response"]["comment"],
            "Attached the corrected purchase order reference.",
        )

    def test_supplier_clarification_response_requires_comment(self):
        invoice = Invoice.objects.create(
            supplier_organization=self.supplier_org,
            buyer_organization=self.buyer_org,
            invoice_number="INV-CLARIFY-002",
            issue_date=date.today(),
            due_date=date.today() + timedelta(days=20),
            amount=Decimal("18000.00"),
            currency="INR",
            status=Invoice.Status.NEEDS_CLARIFICATION,
        )
        response = self.client.post(
            reverse("supplier-clarification-response", kwargs={"pk": invoice.id}),
            {"comment": "   ", "version": 1},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        invoice.refresh_from_db()
        self.assertEqual(invoice.version, 1)

    def test_supplier_cannot_respond_when_invoice_is_not_awaiting_clarification(self):
        invoice = Invoice.objects.create(
            supplier_organization=self.supplier_org,
            buyer_organization=self.buyer_org,
            invoice_number="INV-CLARIFY-003",
            issue_date=date.today(),
            due_date=date.today() + timedelta(days=20),
            amount=Decimal("18000.00"),
            currency="INR",
            status=Invoice.Status.PENDING_VERIFICATION,
        )
        response = self.client.post(
            reverse("supplier-clarification-response", kwargs={"pk": invoice.id}),
            {"comment": "Here is the response.", "version": 1},
            format="json",
        )
        self.assertEqual(response.status_code, 409)


    def test_supplier_can_upload_private_pdf_and_receive_sha256(self):
        invoice = Invoice.objects.create(
            supplier_organization=self.supplier_org,
            buyer_organization=self.buyer_org,
            invoice_number="INV-DOC-001",
            issue_date=date.today(),
            due_date=date.today() + timedelta(days=20),
            amount=Decimal("18000.00"),
            currency="INR",
            status=Invoice.Status.DRAFT,
        )
        file_content = b"%PDF-1.4\\nInvoice test content\\n%%EOF"
        upload = SimpleUploadedFile("invoice.pdf", file_content, content_type="application/pdf")
        response = self.client.post(
            reverse("invoice-documents", kwargs={"pk": invoice.id}),
            {"file": upload},
            format="multipart",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["sha256"], __import__("hashlib").sha256(file_content).hexdigest())
        self.assertEqual(response.data["fileType"], "PDF")
        self.assertEqual(len(response.data["sha256"]), 64)

    def test_invoice_document_upload_rejects_mismatched_file_signature(self):
        invoice = Invoice.objects.create(
            supplier_organization=self.supplier_org,
            buyer_organization=self.buyer_org,
            invoice_number="INV-DOC-002",
            issue_date=date.today(),
            due_date=date.today() + timedelta(days=20),
            amount=Decimal("18000.00"),
            currency="INR",
        )
        upload = SimpleUploadedFile("fake.pdf", b"this is not a pdf", content_type="application/pdf")
        response = self.client.post(
            reverse("invoice-documents", kwargs={"pk": invoice.id}),
            {"file": upload},
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(invoice.documents.exists())

    def test_another_supplier_cannot_access_invoice_documents(self):
        invoice = Invoice.objects.create(
            supplier_organization=self.supplier_org,
            buyer_organization=self.buyer_org,
            invoice_number="INV-DOC-003",
            issue_date=date.today(),
            due_date=date.today() + timedelta(days=20),
            amount=Decimal("18000.00"),
            currency="INR",
        )
        self.client.force_authenticate(user=self.other_supplier)
        response = self.client.get(
            reverse("invoice-documents", kwargs={"pk": invoice.id})
        )
        self.assertEqual(response.status_code, 404)
