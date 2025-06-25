#!/usr/bin/env python
import os
import sys
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Import models after Django setup
from adminpanel.models import SiteSettings
from django.conf import settings

def main():
    """Ensure SiteSettings is properly configured and fix any issues."""
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
    
    # Verify media directories exist
    logos_dir = os.path.join(settings.MEDIA_ROOT, 'website', 'logos')
    if not os.path.exists(logos_dir):
        print(f"Creating logos directory: {logos_dir}")
        os.makedirs(logos_dir, exist_ok=True)
    
    # Check CSRF settings
    print("\nCSRF Configuration:")
    print(f"CSRF_COOKIE_SECURE: {settings.CSRF_COOKIE_SECURE if hasattr(settings, 'CSRF_COOKIE_SECURE') else 'Not set'}")
    print(f"CSRF_COOKIE_HTTPONLY: {settings.CSRF_COOKIE_HTTPONLY if hasattr(settings, 'CSRF_COOKIE_HTTPONLY') else 'Not set'}")
    print(f"CSRF_USE_SESSIONS: {settings.CSRF_USE_SESSIONS if hasattr(settings, 'CSRF_USE_SESSIONS') else 'Not set'}")
    
    print("\nFix completed successfully!")
    print("\nTo resolve CSRF issues:")
    print("1. Clear your browser cookies and cache")
    print("2. Try using a private/incognito window")
    print("3. Ensure you're not using browser extensions that might block cookies")
    print("4. Check that your browser accepts third-party cookies")

if __name__ == "__main__":
    main() 