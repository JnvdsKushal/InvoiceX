from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class InvoiceXTokenSerializer(TokenObtainPairSerializer):
    username_field = User.USERNAME_FIELD

    def validate(self, attrs):
        data = super().validate(attrs)

        user = self.user
        organization = user.organization

        # Check account approval
        if not user.is_active or user.status != "ACTIVE":
            raise serializers.ValidationError(
                "Your account is pending approval or inactive."
            )

        # Check organization approval
        if organization.status != "ACTIVE":
            raise serializers.ValidationError(
                "Your organization has not been approved yet."
            )

        data["user"] = {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "status": user.status,
            "organization": {
                "id": str(organization.id),
                "name": organization.name,
                "status": organization.status,
            },
        }

        return data