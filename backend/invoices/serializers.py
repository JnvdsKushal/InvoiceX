
from rest_framework import serializers

from organizations.models import Organization
from .models import Invoice


class InvoiceSerializer(serializers.ModelSerializer):
    organizationId = serializers.UUIDField(
        source="supplier_organization_id",
        read_only=True,
    )
    buyerOrganizationId = serializers.UUIDField(
        source="buyer_organization_id",
    )
    invoiceNumber = serializers.CharField(
        source="invoice_number",
    )
    issueDate = serializers.DateField(source="issue_date")
    dueDate = serializers.DateField(source="due_date")
    purchaseOrderReference = serializers.CharField(
        source="purchase_order_reference",
        required=False,
        allow_null=True,
        allow_blank=True,
    )
    createdAt = serializers.DateTimeField(
        source="created_at",
        read_only=True,
    )
    updatedAt = serializers.DateTimeField(
        source="updated_at",
        read_only=True,
    )
    documentIds = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = (
            "id",
            "organizationId",
            "buyerOrganizationId",
            "invoiceNumber",
            "issueDate",
            "dueDate",
            "amount",
            "currency",
            "status",
            "documentIds",
            "purchaseOrderReference",
            "description",
            "createdAt",
            "updatedAt",
            "version",
        )
        read_only_fields = ("id", "status", "version")

    def get_documentIds(self, obj):
        return [str(document_id) for document_id in obj.documents.values_list("id", flat=True)]

    def validate_buyerOrganizationId(self, buyer_id):
        request = self.context.get("request")
        if request is None:
            return buyer_id

        supplier_id = request.user.organization_id

        if str(buyer_id) == str(supplier_id):
            raise serializers.ValidationError(
                "Supplier and buyer must be different organizations."
            )

        if not Organization.objects.filter(
            id=buyer_id,
            type=Organization.OrganizationType.BUYER,
            status=Organization.Status.ACTIVE,
        ).exists():
            raise serializers.ValidationError(
                "Select an active buyer organization."
            )

        return buyer_id

    def validate(self, attrs):
        issue_date = attrs.get(
            "issue_date",
            getattr(self.instance, "issue_date", None),
        )
        due_date = attrs.get(
            "due_date",
            getattr(self.instance, "due_date", None),
        )

        if issue_date and due_date and due_date < issue_date:
            raise serializers.ValidationError({
                "dueDate": "Due date cannot be before issue date."
            })

        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["supplier_organization"] = (
            request.user.organization
        )
        return super().create(validated_data)
