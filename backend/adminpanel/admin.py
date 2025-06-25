from django.contrib import admin
from .models import SiteSettings

@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    """Admin interface for SiteSettings model."""
    
    fieldsets = (
        ('Logos', {
            'fields': ('header_logo', 'footer_logo', 'favicon'),
            'description': 'Upload logos for different parts of the site'
        }),
        ('Site Information', {
            'fields': ('site_name', 'site_description'),
        }),
        ('Contact Information', {
            'fields': ('contact_email', 'contact_phone', 'address'),
        }),
        ('Social Media', {
            'fields': ('facebook_url', 'twitter_url', 'instagram_url', 'linkedin_url'),
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    def has_add_permission(self, request):
        """Prevent creating multiple SiteSettings instances."""
        # Only allow adding if no SiteSettings exist yet
        return not SiteSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deleting the SiteSettings instance."""
        # Don't allow deletion of SiteSettings
        return False
