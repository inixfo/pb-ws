from django.db import models
import os
from django.conf import settings

# Create your models here.

class SiteSettings(models.Model):
    """Model to store site-wide settings like logos, contact info, etc."""
    
    # Logos
    header_logo = models.ImageField(upload_to='website/logos/', blank=True, null=True, 
                                   help_text="Logo displayed in the site header (recommended size: 141x40px)")
    footer_logo = models.ImageField(upload_to='website/logos/', blank=True, null=True,
                                   help_text="Logo displayed in the site footer (recommended size: 96x40px)")
    favicon = models.ImageField(upload_to='website/logos/', blank=True, null=True,
                               help_text="Site favicon (recommended size: 32x32px)")
    
    # Site info
    site_name = models.CharField(max_length=100, default="Phone Bay")
    site_description = models.TextField(blank=True)
    
    # Contact info
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    
    # Social media
    facebook_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Site Settings"
        verbose_name_plural = "Site Settings"
    
    def __str__(self):
        return "Site Settings"
    
    def save(self, *args, **kwargs):
        """Ensure upload directories exist before saving."""
        # Make sure the upload directory exists
        logo_dir = os.path.join(settings.MEDIA_ROOT, 'website', 'logos')
        os.makedirs(logo_dir, exist_ok=True)
        
        print(f"SiteSettings save: Ensuring directory exists: {logo_dir}")
        
        super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        """Get the site settings, creating a default instance if none exists."""
        settings = cls.objects.first()
        if not settings:
            settings = cls.objects.create()
        return settings
