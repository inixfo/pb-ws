from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    """Define a model manager for User model with no username field."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        """Create and save a User with the given email and password."""
        if not email:
            raise ValueError('The given email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular User with the given email and password."""
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password, **extra_fields):
        """Create and save a SuperUser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Custom User model with email as the unique identifier."""
    
    ROLE_CHOICES = (
        ('user', 'Customer'),
        ('vendor', 'Vendor'),
        ('admin', 'Administrator'),
    )
    
    username = None
    email = models.EmailField(_('email address'), unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    phone = models.CharField(max_length=15, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    objects = UserManager()
    
    def __str__(self):
        return self.email
    
    @property
    def is_customer(self):
        return self.role == 'user'
    
    @property
    def is_vendor(self):
        return self.role == 'vendor'
    
    @property
    def is_admin(self):
        return self.role == 'admin'


class Profile(models.Model):
    """Extended profile information for users."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    
    # For vendors
    company_name = models.CharField(max_length=255, blank=True, null=True)
    business_address = models.TextField(blank=True, null=True)
    business_registration_number = models.CharField(max_length=50, blank=True, null=True)
    is_approved = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.user.email}'s Profile"


class Address(models.Model):
    """User address book."""
    
    ADDRESS_TYPE_CHOICES = (
        ('home', 'Home'),
        ('work', 'Work'),
        ('other', 'Other'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    address_type = models.CharField(max_length=10, choices=ADDRESS_TYPE_CHOICES, default='home')
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=15)
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    is_default = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.user.email}'s {self.get_address_type_display()} Address"
    
    def save(self, *args, **kwargs):
        # If this address is being set as default, unset any other default address
        if self.is_default:
            Address.objects.filter(user=self.user, is_default=True).update(is_default=False)
        super().save(*args, **kwargs)


class PaymentMethod(models.Model):
    """User payment methods."""
    
    PAYMENT_TYPE_CHOICES = (
        ('card', 'Credit/Debit Card'),
        ('bank', 'Bank Account'),
        ('mobile', 'Mobile Banking'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payment_methods')
    payment_type = models.CharField(max_length=10, choices=PAYMENT_TYPE_CHOICES)
    provider = models.CharField(max_length=100)  # Bank name, card issuer, etc.
    account_number = models.CharField(max_length=30)  # Last 4 digits for cards
    is_default = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    
    # For security, we don't store full card details
    # These fields would be handled by a payment processor
    
    def __str__(self):
        return f"{self.user.email}'s {self.get_payment_type_display()}"
    
    def save(self, *args, **kwargs):
        # If this payment method is being set as default, unset any other default
        if self.is_default:
            PaymentMethod.objects.filter(user=self.user, is_default=True).update(is_default=False)
        super().save(*args, **kwargs)
