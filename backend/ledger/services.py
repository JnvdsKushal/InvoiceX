from .models import LedgerOutboxEvent


def queue_ledger_event(*, event_type, entity_type, entity_id, actor, payload, invoice=None, financing_agreement=None):
    """Persist an event in the same DB transaction as its business change."""
    return LedgerOutboxEvent.objects.create(
        event_type=event_type,
        entity_type=entity_type,
        entity_id=str(entity_id),
        actor=actor,
        invoice=invoice,
        financing_agreement=financing_agreement,
        payload=payload or {},
    )
