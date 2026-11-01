import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from .models import LedgerOutboxEvent


class LedgerEventsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role not in ("buyer", "lender", "supplier") or user.status != "ACTIVE" or user.organization.status != "ACTIVE":
            return Response({"detail": "An active organization account is required."}, status=403)
        org = user.organization
        visible = Q(invoice__supplier_organization=org) | Q(invoice__buyer_organization=org)
        visible |= Q(financing_agreement__supplier_organization=org) | Q(financing_agreement__lender_organization=org)
        visible |= Q(invoice__financing_offers__lender_organization=org)
        rows = LedgerOutboxEvent.objects.filter(visible).select_related("actor").distinct().order_by("-created_at")[:200]
        return Response([{
            "id": str(row.id), "eventId": str(row.event_id),
            "eventType": row.event_type, "entityType": row.entity_type,
            "entityId": row.entity_id, "status": row.status,
            "sequence": row.block_index, "hash": row.block_hash,
            "previousHash": row.previous_hash,
            "actor": row.actor.name, "createdAt": row.created_at,
            "deliveredAt": row.delivered_at,
            "lastError": row.last_error if row.status == LedgerOutboxEvent.Status.FAILED else "",
        } for row in rows])


class LedgerVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role not in ("buyer", "lender", "supplier") or user.status != "ACTIVE" or user.organization.status != "ACTIVE":
            return Response({"detail": "An active organization account is required."}, status=403)
        base_url = os.getenv("LEDGER_SERVICE_URL", "http://127.0.0.1:8081").rstrip("/")
        api_key = os.getenv("LEDGER_INTERNAL_API_KEY", "")
        if len(api_key) < 32:
            return Response({"detail": "Ledger service is not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        request_obj = Request(base_url + "/internal/verify", headers={"x-internal-ledger-key": api_key})
        try:
            with urlopen(request_obj, timeout=5) as response:
                result = json.loads(response.read().decode("utf-8"))
            return Response({"available": True, "valid": bool(result.get("valid")), "totalBlocks": result.get("total_blocks", 0)})
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
            return Response({"available": False, "valid": None, "detail": "Ledger service is unavailable. Pending events remain in the outbox."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
