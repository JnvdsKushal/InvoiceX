
from django.contrib import admin

from .models import Invoice


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = (
        "invoice_number",
        "supplier_organization",
        "buyer_organization",
        "amount",
        "currency",
        "status",
        "issue_date",
        "due_date",
    )

    list_filter = ("status", "currency", "issue_date")
    search_fields = (
        "invoice_number",
        "supplier_organization__name",
        "buyer_organization__name",
    )

    readonly_fields = (
        "id",
        "version",
        "created_at",
        "updated_at",
    )

    ordering = ("-created_at",)
