
from django import forms
from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from .models import User


class InvoiceXUserCreationForm(UserCreationForm):
    class Meta:
        model = User
        fields = ("email", "name", "organization", "role", "status")


class InvoiceXUserChangeForm(UserChangeForm):
    class Meta:
        model = User
        fields = (
            "email",
            "name",
            "organization",
            "role",
            "status",
            "is_active",
            "is_staff",
            "is_superuser",
            "groups",
            "user_permissions",
        )
