
from rest_framework import serializers

from .models import Organization


class AdminOrganizationSerializer(serializers.ModelSerializer):
    user_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Organization
        fields = [
            "id",
            "name",
            "type",
            "registration_identifier",
            "status",
            "created_at",
            "user_count",
        ]
        read_only_fields = fields
