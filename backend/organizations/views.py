
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Organization
from .serializers import BuyerOrganizationSerializer


class ActiveBuyerListView(generics.ListAPIView):
    serializer_class = BuyerOrganizationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Organization.objects.filter(
            type=Organization.OrganizationType.BUYER,
            status=Organization.Status.ACTIVE,
        ).order_by("name")
