
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .forms import InvoiceXUserChangeForm, InvoiceXUserCreationForm
from .models import User


@admin.register(User)
class InvoiceXUserAdmin(UserAdmin):
    form = InvoiceXUserChangeForm
    add_form = InvoiceXUserCreationForm

    list_display = (
        "email",
        "name",
        "organization",
        "role",
        "status",
        "is_staff",
    )
    list_filter = ("role", "status", "is_staff")
    search_fields = ("email", "name")
    ordering = ("email",)
    readonly_fields = ("id", "created_at", "last_login", "date_joined")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Profile", {"fields": ("name", "organization", "role", "status")}),
        ("Permissions", {
            "fields": (
                "is_active",
                "is_staff",
                "is_superuser",
                "groups",
                "user_permissions",
            )
        }),
        ("Dates", {"fields": ("last_login", "date_joined", "created_at", "id")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "email",
                "name",
                "organization",
                "role",
                "status",
                "password1",
                "password2",
            ),
        }),
    )
