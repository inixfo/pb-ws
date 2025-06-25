from rest_framework import serializers
from .models import SiteSettings

class SiteSettingsSerializer(serializers.ModelSerializer):
    """Serializer for the SiteSettings model."""
    
    class Meta:
        model = SiteSettings
        fields = [
            'header_logo', 'footer_logo', 'favicon',
            'site_name', 'site_description',
            'contact_email', 'contact_phone', 'address',
            'facebook_url', 'twitter_url', 'instagram_url', 'linkedin_url'
        ] 