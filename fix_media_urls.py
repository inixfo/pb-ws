#!/usr/bin/env python
import os
import sys
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
from adminpanel.models import SiteSettings

def main():
    """Fix media URLs and ensure site settings are properly configured."""
    print("Checking SiteSettings configuration...")
    
    # Check if SiteSettings exists
    settings_count = SiteSettings.objects.count()
    print(f"Found {settings_count} SiteSettings instances")
    
    if settings_count == 0:
        # Create a new SiteSettings instance
        print("Creating new SiteSettings instance...")
        SiteSettings.objects.create(
            site_name="Phone Bay",
            site_description="Your one-stop shop for mobile phones and accessories"
        )
        print("SiteSettings instance created successfully!")
    elif settings_count > 1:
        # Keep only the first instance
        print("Multiple SiteSettings instances found. Keeping only the first one...")
        first_settings = SiteSettings.objects.first()
        SiteSettings.objects.exclude(id=first_settings.id).delete()
        print("Cleaned up extra SiteSettings instances!")
    
    # Get the current settings
    site_settings = SiteSettings.objects.first()
    print("\nCurrent site settings:")
    print(f"Site name: {site_settings.site_name}")
    print(f"Header logo: {site_settings.header_logo}")
    print(f"Footer logo: {site_settings.footer_logo}")
    print(f"Favicon: {site_settings.favicon}")
    
    # Verify media directories exist
    logos_dir = os.path.join(settings.MEDIA_ROOT, 'website', 'logos')
    if not os.path.exists(logos_dir):
        print(f"Creating logos directory: {logos_dir}")
        os.makedirs(logos_dir, exist_ok=True)
    
    # Print media configuration
    print("\nMedia configuration:")
    print(f"MEDIA_URL: {settings.MEDIA_URL}")
    print(f"MEDIA_ROOT: {settings.MEDIA_ROOT}")
    print(f"BASE_DIR: {settings.BASE_DIR}")
    
    # Print frontend URLs
    print("\nFrontend configuration:")
    print(f"FRONTEND_BASE_URL: {settings.FRONTEND_BASE_URL if hasattr(settings, 'FRONTEND_BASE_URL') else 'Not set'}")
    print(f"BACKEND_BASE_URL: {settings.BACKEND_BASE_URL if hasattr(settings, 'BACKEND_BASE_URL') else 'Not set'}")
    
    print("\nFix completed!")
    print("\nTo ensure logos are displayed correctly:")
    print("1. Make sure the MEDIA_URL is correctly set in Django settings")
    print("2. Make sure the BASE_URL in frontend config.js points to the correct domain")
    print("3. Check that the logo files are uploaded to the correct directory")
    print("4. Verify that the web server is configured to serve media files")

if __name__ == "__main__":
    main() 