import json
import os
import time
from datetime import timedelta
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from ledger.models import LedgerOutboxEvent


class Command(BaseCommand):
    help = "Deliver pending transactional outbox events to the Rust hash-linked ledger."

    def add_arguments(self, parser):
        parser.add_argument("--batch-size", type=int, default=50)
        parser.add_argument("--loop", action="store_true")
        parser.add_argument("--interval", type=int, default=5)

    def handle(self, *args, **options):
        base_url = os.getenv("LEDGER_SERVICE_URL", "http://127.0.0.1:8081").rstrip("/")
        api_key = os.getenv("LEDGER_INTERNAL_API_KEY", "")
        if len(api_key) < 32:
            raise CommandError("Set LEDGER_INTERNAL_API_KEY (at least 32 characters) in backend/.env.")
        while True:
            delivered, failed = self.dispatch_batch(base_url, api_key, options["batch_size"])
            self.stdout.write(self.style.SUCCESS(f"Ledger dispatch complete: {delivered} delivered, {failed} failed."))
            if not options["loop"]:
                break
            time.sleep(max(1, options["interval"]))

    def dispatch_batch(self, base_url, api_key, batch_size):
        delivered = failed = 0
        now = timezone.now()
        with transaction.atomic():
            events = list(
                LedgerOutboxEvent.objects.select_for_update(skip_locked=True)
                .filter(status__in=[LedgerOutboxEvent.Status.PENDING, LedgerOutboxEvent.Status.FAILED], next_attempt_at__lte=now)
                .order_by("created_at")[:max(1, batch_size)]
            )
        for event in events:
            body = {
                "event_id": str(event.event_id),
                "event_type": event.event_type,
                "entity_type": event.entity_type,
                "entity_id": event.entity_id,
                "actor_id": str(event.actor_id),
                "payload": event.payload,
            }
            request = Request(
                base_url + "/internal/events",
                data=json.dumps(body, separators=(",", ":")).encode("utf-8"),
                headers={"Content-Type": "application/json", "x-internal-ledger-key": api_key},
                method="POST",
            )
            try:
                with urlopen(request, timeout=8) as response:
                    result = json.loads(response.read().decode("utf-8"))
                block = result.get("block") or {}
                if not result.get("success") or not block.get("hash"):
                    raise ValueError("Ledger service returned an invalid acknowledgement.")
                LedgerOutboxEvent.objects.filter(pk=event.pk).update(
                    status=LedgerOutboxEvent.Status.DELIVERED,
                    block_index=block.get("index"),
                    block_hash=block["hash"],
                    delivered_at=timezone.now(),
                    last_error="",
                    attempts=event.attempts + 1,
                )
                delivered += 1
            except (HTTPError, URLError, TimeoutError, ValueError, json.JSONDecodeError) as exc:
                attempts = event.attempts + 1
                delay = min(5 * (2 ** min(attempts, 10)), 3600)
                LedgerOutboxEvent.objects.filter(pk=event.pk).update(
                    status=LedgerOutboxEvent.Status.FAILED,
                    attempts=attempts,
                    next_attempt_at=timezone.now() + timedelta(seconds=delay),
                    last_error=str(exc)[:2000],
                )
                failed += 1
        return delivered, failed
