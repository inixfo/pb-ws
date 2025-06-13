from django.db import models
from django.contrib.auth import get_user_model
from django.utils.text import slugify

User = get_user_model()


class VendorProfile(models.Model):
    """Vendor profile model."""
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('suspended', 'Suspended'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='vendor_profile')
    company_name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    business_email = models.EmailField()
    business_phone = models.CharField(max_length=20)
    tax_id = models.CharField(max_length=50, blank=True, null=True)
    business_address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
    
    # Verification and status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_featured = models.BooleanField(default=False)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    
    # Documents
    business_certificate = models.FileField(upload_to='vendor_documents/certificates/', blank=True, null=True)
    id_proof = models.FileField(upload_to='vendor_documents/id_proofs/', blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.company_name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.company_name)
        super().save(*args, **kwargs)


class StoreSettings(models.Model):
    """Vendor store settings model."""
    
    vendor = models.OneToOneField(VendorProfile, on_delete=models.CASCADE, related_name='store_settings')
    store_name = models.CharField(max_length=255)
    store_description = models.TextField(blank=True, null=True)
    logo = models.ImageField(upload_to='vendor_logos/', blank=True, null=True)
    banner = models.ImageField(upload_to='vendor_banners/', blank=True, null=True)
    
    # Contact info
    support_email = models.EmailField(blank=True, null=True)
    support_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Social links
    website = models.URLField(blank=True, null=True)
    facebook = models.URLField(blank=True, null=True)
    instagram = models.URLField(blank=True, null=True)
    twitter = models.URLField(blank=True, null=True)
    
    # Store settings
    enable_emi = models.BooleanField(default=True)
    enable_cod = models.BooleanField(default=True)
    auto_approve_reviews = models.BooleanField(default=False)
    
    # Commission settings (to be set by admin)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=10.0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.store_name} Settings"


class VendorApproval(models.Model):
    """Vendor approval request model."""
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='approval_requests')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True, null=True)
    admin_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='vendor_approvals')
    
    # Additional documents
    additional_document1 = models.FileField(upload_to='vendor_documents/additional/', blank=True, null=True)
    additional_document2 = models.FileField(upload_to='vendor_documents/additional/', blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Approval Request for {self.vendor.company_name}"


class VendorBankAccount(models.Model):
    """Vendor bank account model for payments."""
    
    vendor = models.OneToOneField(VendorProfile, on_delete=models.CASCADE, related_name='bank_account')
    account_name = models.CharField(max_length=255)
    account_number = models.CharField(max_length=50)
    bank_name = models.CharField(max_length=255)
    branch_name = models.CharField(max_length=255)
    routing_number = models.CharField(max_length=50, blank=True, null=True)
    swift_code = models.CharField(max_length=50, blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.vendor.company_name}'s Bank Account"
