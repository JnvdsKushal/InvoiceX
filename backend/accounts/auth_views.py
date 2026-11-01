from django.conf import settings
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .auth_serializers import InvoiceXTokenSerializer


COOKIE_NAME = "invoicex_refresh"
COOKIE_PATH = "/api/v1/auth/"


def set_refresh_cookie(response, token):
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="Strict",
        path=COOKIE_PATH,
    )


class LoginView(TokenObtainPairView):
    serializer_class = InvoiceXTokenSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            refresh = response.data.pop("refresh")
            set_refresh_cookie(response, refresh)

        return response


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        refresh = request.COOKIES.get(COOKIE_NAME)

        if not refresh:
            return Response(
                {"detail": "Refresh token not found."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        data = request.data.copy()
        data["refresh"] = refresh

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        response = Response(serializer.validated_data)

        rotated_refresh = response.data.pop("refresh", None)

        if rotated_refresh:
            set_refresh_cookie(response, rotated_refresh)

        return response


class MeView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        organization = user.organization

        return Response({
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
        })


class LogoutView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh = request.COOKIES.get(COOKIE_NAME)

        if refresh:
            try:
                RefreshToken(refresh).blacklist()
            except TokenError:
                pass

        response = Response(
            {"detail": "Successfully logged out."},
            status=status.HTTP_205_RESET_CONTENT,
        )

        response.delete_cookie(
            COOKIE_NAME,
            path=COOKIE_PATH,
            samesite="Strict",
        )

        return response