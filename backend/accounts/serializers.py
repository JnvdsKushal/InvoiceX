
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from organizations.models import Organization

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    firstName = serializers.CharField(max_length=150)
    lastName = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    organizationName = serializers.CharField(max_length=255)
    organizationType = serializers.ChoiceField(
        choices=["MSME", "BUYER", "LENDER"]
    )
    password = serializers.CharField(
        write_only=True,
        min_length=10,
        trim_whitespace=False,
    )

    def validate_email(self, value):
        value = value.strip().lower()

        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value

    @transaction.atomic
    def create(self, validated_data):
        first_name = validated_data.pop("firstName").strip()
        last_name = validated_data.pop("lastName").strip()
        organization_name = validated_data.pop("organizationName").strip()
        organization_type = validated_data.pop("organizationType")
        password = validated_data.pop("password")
        email = validated_data.pop("email")

        role_mapping = {
            "MSME": "supplier",
            "BUYER": "buyer",
            "LENDER": "lender",
        }

        organization = Organization.objects.create(
            name=organization_name,
            type=organization_type,
            status="PENDING",
        )

        user = User(
            email=email,
            name=f"{first_name} {last_name}".strip(),
            organization=organization,
            role=role_mapping[organization_type],
            status="PENDING",
            is_active=False,
        )
        user.set_password(password)
        user.save()

        return user
