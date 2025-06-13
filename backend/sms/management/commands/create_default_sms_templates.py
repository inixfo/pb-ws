from django.core.management.base import BaseCommand
from django.conf import settings
from sms.models import SMSTemplate
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Creates default SMS templates if they do not exist'

    def handle(self, *args, **options):
        # Get default templates from settings
        default_templates = getattr(settings, 'DEFAULT_SMS_TEMPLATES', {})
        
        if not default_templates:
            self.stdout.write(self.style.WARNING('No default SMS templates found in settings'))
            return
        
        # Define template types and names
        template_types = [
            ('welcome', 'Welcome Message'),
            ('verification', 'Phone Verification'),
            ('order_confirmation', 'Order Confirmation'),
            ('payment_success', 'Payment Success'),
            ('order_status', 'Order Status Update'),
            ('emi_reminder', 'EMI Payment Reminder'),
        ]
        
        # Create templates if they don't exist
        created_count = 0
        exists_count = 0
        
        for template_type, template_name in template_types:
            if template_type in default_templates:
                template_text = default_templates[template_type]
                
                # Try to get existing template
                template, created = SMSTemplate.objects.get_or_create(
                    type=template_type,
                    defaults={
                        'name': template_name,
                        'template_text': template_text,
                        'is_active': True
                    }
                )
                
                if created:
                    created_count += 1
                    self.stdout.write(self.style.SUCCESS(f'Created {template_name} template'))
                else:
                    exists_count += 1
                    self.stdout.write(f'{template_name} template already exists')
        
        self.stdout.write(self.style.SUCCESS(
            f'Finished! Created {created_count} templates, {exists_count} already existed'
        )) 