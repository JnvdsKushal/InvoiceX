
import uuid

from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("An email address is required.")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        from organizations.models import Organization

        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("role", "admin")
        extra_fields.setdefault("status", "ACTIVE")

        if extra_fields.get("is_staff") is not True:
            raise ValueError("A superuser must have is_staff=True.")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError("A superuser must have is_superuser=True.")

        organization = extra_fields.get("organization")

        if not organization:
            organization, _ = Organization.objects.get_or_create(
                type="PLATFORM",
                defaults={
                    "name": "InvoiceX Platform",
                    "status": "ACTIVE",
                },
            )
            extra_fields["organization"] = organization

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    class Role(models.TextChoices):
        SUPPLIER = "supplier", "Supplier"
        BUYER = "buyer", "Buyer"
        LENDER = "lender", "Lender"
        ADMIN = "admin", "Admin"

    class AccountStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        PENDING = "PENDING", "Pending"
        SUSPENDED = "SUSPENDED", "Suspended"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    username = None
    first_name = None
    last_name = None

    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="users",
    )

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
    )

    status = models.CharField(
        max_length=20,
        choices=AccountStatus.choices,
        default=AccountStatus.PENDING,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    objects = UserManager()

    def __str__(self):
        return f"{self.name} ({self.email})"
