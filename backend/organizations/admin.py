
from django.contrib import admin

from .models import Organization


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "type",
        "status",
        "registration_identifier",
        "created_at",
    )
    list_filter = ("type", "status")
    search_fields = ("name", "registration_identifier")
    readonly_fields = ("id", "created_at")
