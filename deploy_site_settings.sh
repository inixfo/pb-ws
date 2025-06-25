#!/bin/bash
# Script to deploy SiteSettings functionality to the server

# Create models.py content
cat > adminpanel_models.py << 'EOF'
from django.db import models

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
    
    @classmethod
    def get_settings(cls):
        """Get the site settings, creating a default instance if none exists."""
        settings = cls.objects.first()
        if not settings:
            settings = cls.objects.create()
        return settings
EOF

# Create admin.py content
cat > adminpanel_admin.py << 'EOF'
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
EOF

# Create serializers.py content
cat > adminpanel_serializers.py << 'EOF'
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
EOF

# Create views.py content with the SiteSettingsView
cat > adminpanel_views.py << 'EOF'
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import SiteSettings
from .serializers import SiteSettingsSerializer

class SiteSettingsView(APIView):
    """API view to get site settings."""
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get site settings."""
        settings = SiteSettings.get_settings()
        serializer = SiteSettingsSerializer(settings)
        return Response(serializer.data)
EOF

# Create urls.py content with the SiteSettingsView endpoint
cat > adminpanel_urls.py << 'EOF'
from django.urls import path
from .views import SiteSettingsView

app_name = 'adminpanel'

urlpatterns = [
    path('settings/', SiteSettingsView.as_view(), name='site-settings'),
]
EOF

# Create migration file
cat > adminpanel_migration.py << 'EOF'
# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('adminpanel', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='SiteSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('header_logo', models.ImageField(blank=True, help_text='Logo displayed in the site header (recommended size: 141x40px)', null=True, upload_to='website/logos/')),
                ('footer_logo', models.ImageField(blank=True, help_text='Logo displayed in the site footer (recommended size: 96x40px)', null=True, upload_to='website/logos/')),
                ('favicon', models.ImageField(blank=True, help_text='Site favicon (recommended size: 32x32px)', null=True, upload_to='website/logos/')),
                ('site_name', models.CharField(default='Phone Bay', max_length=100)),
                ('site_description', models.TextField(blank=True)),
                ('contact_email', models.EmailField(blank=True, max_length=254)),
                ('contact_phone', models.CharField(blank=True, max_length=20)),
                ('address', models.TextField(blank=True)),
                ('facebook_url', models.URLField(blank=True)),
                ('twitter_url', models.URLField(blank=True)),
                ('instagram_url', models.URLField(blank=True)),
                ('linkedin_url', models.URLField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Site Settings',
                'verbose_name_plural': 'Site Settings',
            },
        ),
    ]
EOF

# Create instructions for deployment
cat > deployment_instructions.txt << 'EOF'
To deploy the SiteSettings functionality:

1. Copy the model file:
   cp adminpanel_models.py /app/adminpanel/models.py

2. Copy the admin file:
   cp adminpanel_admin.py /app/adminpanel/admin.py

3. Copy the serializers file:
   cp adminpanel_serializers.py /app/adminpanel/serializers.py

4. Copy the views file:
   cp adminpanel_views.py /app/adminpanel/views.py

5. Copy the URLs file:
   cp adminpanel_urls.py /app/adminpanel/urls.py

6. Create migration directory if it doesn't exist:
   mkdir -p /app/adminpanel/migrations

7. Copy the migration file:
   cp adminpanel_migration.py /app/adminpanel/migrations/0002_sitesettings.py

8. Apply migrations:
   python manage.py migrate adminpanel

9. Create a default SiteSettings instance:
   python manage.py shell -c "from adminpanel.models import SiteSettings; SiteSettings.objects.get_or_create(site_name='Phone Bay', site_description='Your one-stop electronics shop')"

10. Restart the server:
    # If using Docker:
    docker-compose restart backend
    # If using systemd:
    systemctl restart your-service-name
EOF

echo "Deployment files created. Follow the instructions in deployment_instructions.txt" 