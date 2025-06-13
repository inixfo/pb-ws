from django.core.management.base import BaseCommand
from django.conf import settings
from sms.models import SMSTemplate


class Command(BaseCommand):
    help = 'Create default SMS templates if they do not exist'

    def handle(self, *args, **options):
        default_templates = getattr(settings, 'DEFAULT_SMS_TEMPLATES', {})
        created_count = 0
        
        for template_type, template_text in default_templates.items():
            # Check if template exists
            if SMSTemplate.objects.filter(type=template_type).exists():
                self.stdout.write(self.style.WARNING(
                    f"Template for '{template_type}' already exists. Skipping."
                ))
                continue
                
            # Create the template
            template_name = template_type.replace('_', ' ').title()
            SMSTemplate.objects.create(
                name=f"{template_name} Template",
                type=template_type,
                template_text=template_text,
                is_active=True
            )
            
            created_count += 1
            self.stdout.write(self.style.SUCCESS(
                f"Created default SMS template for: {template_name}"
            ))
        
        if created_count > 0:
            self.stdout.write(self.style.SUCCESS(
                f"Successfully created {created_count} SMS templates"
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                "All templates already exist. No new templates created."
            )) 