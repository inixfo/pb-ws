from django.apps import AppConfig
from django.db.models.signals import post_migrate


class SmsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'sms'
    verbose_name = 'SMS Management'
    
    def ready(self):
        # Import the signal handlers
        from . import models
        
        # Ensure templates are created on app ready as well
        post_migrate.connect(models.create_default_sms_templates, sender=self)
        
        # Create default SMS templates directly
        try:
            from django.conf import settings
            from .models import SMSTemplate
            
            # Only run this when not in migration mode
            import sys
            if 'makemigrations' not in sys.argv and 'migrate' not in sys.argv:
                default_templates = getattr(settings, 'DEFAULT_SMS_TEMPLATES', {})
                
                for template_type, template_text in default_templates.items():
                    # Skip if template of this type already exists
                    if SMSTemplate.objects.filter(type=template_type).exists():
                        continue
                        
                    # Create the template
                    template_name = template_type.replace('_', ' ').title()
                    SMSTemplate.objects.create(
                        name=f"{template_name} Template",
                        type=template_type,
                        template_text=template_text,
                        is_active=True
                    )
                    print(f"Created default SMS template for: {template_name}")
        except Exception as e:
            # Don't crash app initialization if DB is not ready
            print(f"Error creating default SMS templates: {e}")
