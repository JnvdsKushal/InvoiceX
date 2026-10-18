from django.db import connection
from django.http import JsonResponse
from django.views.decorators.http import require_GET


@require_GET
def health(request):
    database_status = "ok"

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except Exception:
        database_status = "unavailable"

    status_code = 200 if database_status == "ok" else 503

    return JsonResponse(
        {
            "status": "ok" if database_status == "ok" else "degraded",
            "database": database_status,
        },
        status=status_code,
    )