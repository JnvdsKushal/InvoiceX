from django.urls import path
from .views import ActiveBuyerListView

urlpatterns = [
    path(
        "buyers/",
        ActiveBuyerListView.as_view(),
        name="active-buyers",
    ),
]
