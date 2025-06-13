from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

User = get_user_model()

@receiver(post_save, sender=User)
def create_vendor_profile(sender, instance, created, **kwargs):
    """
    Create a vendor profile when a user with role 'vendor' is created.
    
    If the user is created by an admin (in the admin interface or through API),
    the vendor profile will be automatically approved.
    """
    if created and instance.role == 'vendor':
        # Import here to avoid circular import
        from vendors.models import VendorProfile, VendorApproval, StoreSettings
        
        # Check if vendor profile already exists
        if not hasattr(instance, 'vendor_profile'):
            # Default values for required fields
            vendor_data = {
                'user': instance,
                'company_name': getattr(instance, 'company_name', f"{instance.get_full_name()}'s Store"),
                'business_email': getattr(instance, 'business_email', instance.email),
                'business_phone': getattr(instance, 'business_phone', instance.phone or ''),
                'business_address': getattr(instance, 'business_address', ''),
                'city': getattr(instance, 'city', ''),
                'state': getattr(instance, 'state', ''),
                'postal_code': getattr(instance, 'postal_code', ''),
                'country': getattr(instance, 'country', '')
            }
            
            # Create the vendor profile
            vendor_profile = VendorProfile.objects.create(**vendor_data)
            
            # Create default store settings
            StoreSettings.objects.create(
                vendor=vendor_profile,
                store_name=vendor_profile.company_name
            )
            
            # Determine if this vendor should be auto-approved
            # If created via admin interface or API with is_staff=True user, auto-approve
            is_auto_approve = hasattr(instance, '_created_by_admin') and instance._created_by_admin
            
            # Also check for explicit vendor_approved flag from admin create vendor form
            if hasattr(instance, 'vendor_approved') and instance.vendor_approved:
                is_auto_approve = True
            
            # Create initial approval request
            approval = VendorApproval.objects.create(
                vendor=vendor_profile,
                status='approved' if is_auto_approve else 'pending'
            )
            
            # Auto-approve if needed
            if is_auto_approve:
                vendor_profile.status = 'approved'
                vendor_profile.save() 