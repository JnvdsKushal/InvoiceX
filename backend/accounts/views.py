
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .serializers import RegisterSerializer


class RegisterView(generics.GenericAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                "message": (
                    "Registration received. Your account is pending "
                    "email verification and organization approval."
                ),
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "name": user.name,
                    "role": user.role,
                    "status": user.status,
                },
            },
            status=status.HTTP_201_CREATED,
        )
