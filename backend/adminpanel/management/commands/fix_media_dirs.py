import os
import shutil
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from adminpanel.models import SiteSettings

class Command(BaseCommand):
    help = 'Create necessary media directories and fix permissions'

    def handle(self, *args, **options):
        """Create media directories and correct permissions."""
        self.stdout.write(self.style.SUCCESS("Starting media directory setup..."))
        
        # Ensure media root exists
        media_root = settings.MEDIA_ROOT
        self.stdout.write(f"Media root: {media_root}")
        
        os.makedirs(media_root, exist_ok=True)
        self.stdout.write(self.style.SUCCESS(f"Media root directory exists or was created: {media_root}"))
        
        # Define directories to create
        required_dirs = [
            'website/logos',
            'brand_logos',
            'category_images',
            'product_images',
            'promotions'
        ]
        
        # Create all required directories
        for subdir in required_dirs:
            full_path = os.path.join(media_root, subdir)
            os.makedirs(full_path, exist_ok=True)
            self.stdout.write(self.style.SUCCESS(f"Directory exists or was created: {full_path}"))
        
        # Copy a default logo to the logos directory if it doesn't exist yet
        site_settings = SiteSettings.get_settings()
        
        if not site_settings.header_logo:
            self.stdout.write("No header logo found, will try to create a default one")
            
            # Check if there's a logo.png in media root to use as default
            source_logo = os.path.join(media_root, 'logo.png')
            target_path = os.path.join(media_root, 'website', 'logos', 'default_logo.png')
            
            if os.path.exists(source_logo):
                self.stdout.write(f"Found source logo at: {source_logo}")
                # Copy the logo to the website/logos directory
                shutil.copy(source_logo, target_path)
                self.stdout.write(self.style.SUCCESS(f"Copied default logo to: {target_path}"))
                
                # Update the site settings to use this logo
                site_settings.header_logo = 'website/logos/default_logo.png'
                site_settings.footer_logo = 'website/logos/default_logo.png'
                site_settings.save()
                self.stdout.write(self.style.SUCCESS("Updated site settings with default logo"))
            else:
                self.stdout.write(self.style.WARNING(f"No source logo found at: {source_logo}"))
        
        # Output some info about the current site settings
        self.stdout.write("\nCurrent site settings:")
        self.stdout.write(f"  Header logo: {site_settings.header_logo}")
        self.stdout.write(f"  Footer logo: {site_settings.footer_logo}")
        self.stdout.write(f"  Favicon: {site_settings.favicon}")
        
        self.stdout.write(self.style.SUCCESS("\nMedia directory setup completed successfully!")) 