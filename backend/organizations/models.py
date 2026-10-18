
import uuid

from django.db import models


class Organization(models.Model):
    class OrganizationType(models.TextChoices):
        MSME = "MSME", "MSME"
        BUYER = "BUYER", "Buyer"
        LENDER = "LENDER", "Lender"
        PLATFORM = "PLATFORM", "Platform"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        PENDING = "PENDING", "Pending"
        SUSPENDED = "SUSPENDED", "Suspended"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    name = models.CharField(max_length=200)
    type = models.CharField(
        max_length=20,
        choices=OrganizationType.choices,
    )
    registration_identifier = models.CharField(
        max_length=100,
        blank=True,
        null=True,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.type})"
