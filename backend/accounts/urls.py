from django.urls import path
from .auth_views import (
    LoginView,
    RefreshView,
    MeView,
    LogoutView,
)

from .views import RegisterView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", RefreshView.as_view(), name="token-refresh"),
    path("me/", MeView.as_view(), name="current-user"),
    path("logout/", LogoutView.as_view(), name="logout"),
]