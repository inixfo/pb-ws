from django.core.management.base import BaseCommand
from notifications.models import NotificationTemplate, NotificationEvent

class Command(BaseCommand):
    help = 'Set up notification templates for the application'

    def handle(self, *args, **kwargs):
        # Authentication Templates
        self._create_template(
            name='auth_verification_code',
            type='sms',
            body='Your Phone Bay verification code is: {{code}}. Valid for 10 minutes.',
            events=['user_registration', 'user_login', 'password_reset']
        )

        # Order Templates
        self._create_template(
            name='order_confirmation',
            type='sms',
            body='Your order #{{order_id}} has been confirmed. Total amount: ৳{{amount}}. Track your order at {{tracking_url}}.',
            events=['order_created']
        )

        self._create_template(
            name='order_status_update',
            type='sms',
            body='Your order #{{order_id}} status has been updated to: {{status}}. Track your order at {{tracking_url}}.',
            events=['order_status_changed']
        )

        self._create_template(
            name='order_cancelled',
            type='sms',
            body='Your order #{{order_id}} has been cancelled. Refund will be processed within 5-7 business days.',
            events=['order_cancelled']
        )

        # EMI Templates
        self._create_template(
            name='emi_application_submitted',
            type='sms',
            body='Your EMI application for order #{{order_id}} has been submitted. We will review and update you shortly.',
            events=['emi_application_submitted']
        )

        self._create_template(
            name='emi_application_approved',
            type='sms',
            body='Your EMI application for order #{{order_id}} has been approved. Monthly installment: ৳{{monthly_amount}} for {{tenure}} months.',
            events=['emi_application_approved']
        )

        self._create_template(
            name='emi_application_rejected',
            type='sms',
            body='Your EMI application for order #{{order_id}} has been rejected. Reason: {{rejection_reason}}',
            events=['emi_application_rejected']
        )

        self._create_template(
            name='emi_payment_reminder',
            type='sms',
            body='Reminder: Your EMI payment of ৳{{amount}} for order #{{order_id}} is due on {{due_date}}. Please pay to avoid late fees.',
            events=['emi_payment_reminder']
        )

        self._create_template(
            name='emi_payment_confirmation',
            type='sms',
            body='Your EMI payment of ৳{{amount}} for order #{{order_id}} has been confirmed. Next payment due on {{next_due_date}}.',
            events=['emi_payment_confirmed']
        )

        self._create_template(
            name='emi_overdue_notification',
            type='sms',
            body='Your EMI payment of ৳{{amount}} for order #{{order_id}} is overdue. Please pay immediately to avoid penalties.',
            events=['emi_payment_overdue']
        )

        self.stdout.write(self.style.SUCCESS('Successfully created notification templates'))

    def _create_template(self, name, type, body, events):
        """Create a notification template and associated events."""
        template, created = NotificationTemplate.objects.get_or_create(
            name=name,
            defaults={
                'type': type,
                'body': body,
                'is_active': True
            }
        )

        if not created:
            template.body = body
            template.save()

        # Create or update associated events
        for event_type in events:
            event, _ = NotificationEvent.objects.get_or_create(
                event_type=event_type,
                defaults={'is_active': True}
            )
            
            if type == 'sms':
                event.sms_template = template
                event.save() 