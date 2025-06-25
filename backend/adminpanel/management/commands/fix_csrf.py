import os
from django.core.management.base import BaseCommand
from django.conf import settings
from adminpanel.models import SiteSettings

class Command(BaseCommand):
    help = 'Fix CSRF issues and ensure SiteSettings is properly configured'

    def handle(self, *args, **options):
        """Ensure SiteSettings is properly configured and fix any issues."""
        self.stdout.write(self.style.SUCCESS("Checking SiteSettings configuration..."))
        
        # Check if SiteSettings exists
        settings_count = SiteSettings.objects.count()
        self.stdout.write(f"Found {settings_count} SiteSettings instances")
        
        if settings_count == 0:
            # Create a new SiteSettings instance
            self.stdout.write("Creating new SiteSettings instance...")
            SiteSettings.objects.create(
                site_name="Phone Bay",
                site_description="Your one-stop shop for mobile phones and accessories"
            )
            self.stdout.write(self.style.SUCCESS("SiteSettings instance created successfully!"))
        elif settings_count > 1:
            # Keep only the first instance
            self.stdout.write("Multiple SiteSettings instances found. Keeping only the first one...")
            first_settings = SiteSettings.objects.first()
            SiteSettings.objects.exclude(id=first_settings.id).delete()
            self.stdout.write(self.style.SUCCESS("Cleaned up extra SiteSettings instances!"))
        
        # Verify media directories exist
        logos_dir = os.path.join(settings.MEDIA_ROOT, 'website', 'logos')
        if not os.path.exists(logos_dir):
            self.stdout.write(f"Creating logos directory: {logos_dir}")
            os.makedirs(logos_dir, exist_ok=True)
        
        # Check CSRF settings
        self.stdout.write("\nCSRF Configuration:")
        self.stdout.write(f"CSRF_COOKIE_SECURE: {settings.CSRF_COOKIE_SECURE if hasattr(settings, 'CSRF_COOKIE_SECURE') else 'Not set'}")
        self.stdout.write(f"CSRF_COOKIE_HTTPONLY: {settings.CSRF_COOKIE_HTTPONLY if hasattr(settings, 'CSRF_COOKIE_HTTPONLY') else 'Not set'}")
        self.stdout.write(f"CSRF_USE_SESSIONS: {settings.CSRF_USE_SESSIONS if hasattr(settings, 'CSRF_USE_SESSIONS') else 'Not set'}")
        
        self.stdout.write(self.style.SUCCESS("\nFix completed successfully!"))
        self.stdout.write("\nTo resolve CSRF issues:")
        self.stdout.write("1. Clear your browser cookies and cache")
        self.stdout.write("2. Try using a private/incognito window")
        self.stdout.write("3. Ensure you're not using browser extensions that might block cookies")
        self.stdout.write("4. Check that your browser accepts third-party cookies") 