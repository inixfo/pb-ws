#!/usr/bin/env python
"""
Script to create missing notification templates and events.
Run this script with: python manage.py shell < create_notification_templates.py
"""

import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from notifications.models import NotificationTemplate, NotificationEvent
from sms.models import SMSTemplate

def create_notification_templates():
    """Create notification templates if they don't exist"""
    print("Creating notification templates...")
    
    # Default SMS templates for notifications
    default_sms_templates = {
        'order_created': {
            'name': 'Order Created SMS',
            'body': 'Thank you for your order! Your order #{{order_id}} has been received and is being processed.',
            'type': 'sms'
        },
        'emi_application_submitted': {
            'name': 'EMI Application Submitted SMS',
            'body': 'Your EMI application for order #{{order_id}} has been submitted. We will process it shortly.',
            'type': 'sms'
        }
    }
    
    # Create default templates
    for template_key, template_data in default_sms_templates.items():
        template, created = NotificationTemplate.objects.get_or_create(
            name=template_data['name'],
            defaults={
                'type': template_data['type'],
                'body': template_data['body'],
                'is_active': True
            }
        )
        
        if created:
            print(f"Created notification template: {template.name}")
        else:
            print(f"Template already exists: {template.name}")

def create_sms_templates():
    """Create SMS templates if they don't exist"""
    print("Creating SMS templates...")
    
    default_templates = {
        'order_created': 'Thank you for your order! Your order #{order_id} has been received and is being processed.',
        'emi_application_submitted': 'Your EMI application for order #{order_id} has been submitted. We will process it shortly.'
    }
    
    for template_type, template_text in default_templates.items():
        # Skip if template of this type already exists
        if SMSTemplate.objects.filter(type=template_type).exists():
            print(f"SMS template already exists: {template_type}")
            continue
            
        # Create the template
        template_name = template_type.replace('_', ' ').title()
        SMSTemplate.objects.create(
            name=f"{template_name} Template",
            type=template_type,
            template_text=template_text,
            is_active=True
        )
        print(f"Created SMS template: {template_name}")

def create_notification_events():
    """Create notification events if they don't exist"""
    print("Creating notification events...")
    
    # Create default notification events
    default_events = {
        'order_created': {
            'name': 'Order Created Notification',
            'event_type': 'order_created',
            'sms_template_name': 'Order Created SMS'
        },
        'emi_application_submitted': {
            'name': 'EMI Application Submitted Notification',
            'event_type': 'emi_application_submitted',
            'sms_template_name': 'EMI Application Submitted SMS'
        }
    }
    
    for event_key, event_data in default_events.items():
        # Find the template
        sms_template = None
        if event_data.get('sms_template_name'):
            try:
                sms_template = NotificationTemplate.objects.get(
                    name=event_data['sms_template_name'],
                    type='sms'
                )
            except NotificationTemplate.DoesNotExist:
                print(f"Warning: SMS template not found: {event_data['sms_template_name']}")
                pass
        
        # Create the event
        event, created = NotificationEvent.objects.get_or_create(
            event_type=event_data['event_type'],
            defaults={
                'name': event_data['name'],
                'sms_template': sms_template,
                'is_active': True
            }
        )
        
        if created:
            print(f"Created notification event: {event.name}")
        else:
            # Update the event with the template if it exists
            if sms_template and not event.sms_template:
                event.sms_template = sms_template
                event.save()
                print(f"Updated notification event: {event.name} with SMS template")
            else:
                print(f"Event already exists: {event.name}")

if __name__ == "__main__":
    print("Creating missing notification templates and events...")
    create_notification_templates()
    create_sms_templates()
    create_notification_events()
    print("Done!") 