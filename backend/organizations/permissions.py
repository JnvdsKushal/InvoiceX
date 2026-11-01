
from rest_framework.permissions import BasePermission


class IsPlatformAdmin(BasePermission):
    """
    Allow only authenticated InvoiceX platform administrators.
    """

    message = "Only platform administrators can access this resource."

    def has_permission(self, request, view):
        user = request.user

        return bool(
            user
            and user.is_authenticated
            and user.is_active
            and user.is_staff
            and user.is_superuser
            and user.role == "admin"
        )
