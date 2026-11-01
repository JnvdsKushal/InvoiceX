from rest_framework import serializers
from .models import Organization


class BuyerOrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ("id", "name")
