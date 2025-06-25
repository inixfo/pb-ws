import os
from django.core.management.base import BaseCommand
from django.conf import settings as django_settings
from adminpanel.models import SiteSettings

class Command(BaseCommand):
    help = 'Fix site settings by ensuring a default SiteSettings object exists'

    def handle(self, *args, **options):
        # Check if SiteSettings exists
        settings_count = SiteSettings.objects.count()
        
        if settings_count == 0:
            # Create default SiteSettings
            self.stdout.write(self.style.WARNING('No SiteSettings found. Creating default...'))
            settings = SiteSettings.objects.create(
                site_name="Phone Bay",
                site_description="Your one-stop shop for electronics",
            )
            self.stdout.write(self.style.SUCCESS(f'Created default SiteSettings with ID {settings.id}'))
        elif settings_count > 1:
            # Keep only the first SiteSettings object
            self.stdout.write(self.style.WARNING(f'Found {settings_count} SiteSettings objects. Keeping only the first one...'))
            settings = SiteSettings.objects.all().order_by('id').first()
            SiteSettings.objects.exclude(id=settings.id).delete()
            self.stdout.write(self.style.SUCCESS(f'Kept SiteSettings with ID {settings.id} and deleted the rest'))
        else:
            # Just get the existing SiteSettings
            settings = SiteSettings.objects.first()
            self.stdout.write(self.style.SUCCESS(f'Found existing SiteSettings with ID {settings.id}'))
        
        # Ensure the settings has a site name
        if not settings.site_name:
            settings.site_name = "Phone Bay"
            settings.save(update_fields=['site_name'])
            self.stdout.write(self.style.SUCCESS('Updated site_name to "Phone Bay"'))
        
        # Print current settings
        self.stdout.write(self.style.SUCCESS(f'Current settings:'))
        self.stdout.write(f'  site_name: {settings.site_name}')
        self.stdout.write(f'  header_logo: {settings.header_logo}')
        self.stdout.write(f'  footer_logo: {settings.footer_logo}')
        self.stdout.write(f'  favicon: {settings.favicon}')
        
        # Verify media settings
        self.stdout.write(self.style.SUCCESS(f'\nMedia settings:'))
        self.stdout.write(f'  MEDIA_URL: {django_settings.MEDIA_URL}')
        self.stdout.write(f'  MEDIA_ROOT: {django_settings.MEDIA_ROOT}')
        
        # Check if MEDIA_ROOT exists
        if not os.path.exists(django_settings.MEDIA_ROOT):
            self.stdout.write(self.style.WARNING(f'MEDIA_ROOT directory does not exist: {django_settings.MEDIA_ROOT}'))
            try:
                os.makedirs(django_settings.MEDIA_ROOT)
                self.stdout.write(self.style.SUCCESS(f'Created MEDIA_ROOT directory: {django_settings.MEDIA_ROOT}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed to create MEDIA_ROOT directory: {e}'))
        else:
            self.stdout.write(self.style.SUCCESS(f'MEDIA_ROOT directory exists: {django_settings.MEDIA_ROOT}'))
        
        # Check website/logos directory
        logos_dir = os.path.join(django_settings.MEDIA_ROOT, 'website', 'logos')
        if not os.path.exists(logos_dir):
            self.stdout.write(self.style.WARNING(f'Logos directory does not exist: {logos_dir}'))
            try:
                os.makedirs(logos_dir)
                self.stdout.write(self.style.SUCCESS(f'Created logos directory: {logos_dir}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed to create logos directory: {e}'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Logos directory exists: {logos_dir}'))
            
        self.stdout.write(self.style.SUCCESS('Site settings check complete')) 