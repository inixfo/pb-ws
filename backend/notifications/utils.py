from django.contrib.auth import get_user_model
from django.utils import timezone
from django.template import Template, Context
from django.core.mail import send_mail
from django.conf import settings
from .models import Notification, NotificationTemplate, SMSProvider

User = get_user_model()


def send_notification(recipient=None, notification_type='email', title='', message='', data=None, admin_only=False):
    """
    Send a notification to a user or all admin users.
    
    Args:
        recipient: User object or None for admin notifications
        notification_type: Type of notification ('email', 'sms', 'push')
        title: Notification title or subject
        message: Notification message body
        data: Additional data for the notification as dict
        admin_only: If True, send to all admin users
    
    Returns:
        The created Notification object or list of objects
    """
    if data is None:
        data = {}
    
    notifications = []
    
    # Determine recipients
    recipients = []
    if admin_only:
        # Send to all admin users
        recipients = User.objects.filter(is_staff=True)
    elif recipient:
        # Send to specific user
        recipients = [recipient]
    else:
        # No valid recipient
        return None
    
    # Send to each recipient
    for user in recipients:
        # Create notification record
        notification = Notification.objects.create(
            user=user,
            type=notification_type,
            subject=title,
            body=message,
            recipient=user.email if notification_type == 'email' else user.phone,
            status='pending',
            data=data
        )
        
        # Send the notification based on type
        if notification_type == 'email':
            _send_email_notification(notification)
        elif notification_type == 'sms':
            _send_sms_notification(notification)
        # Push notifications would be handled here
        
        notifications.append(notification)
    
    return notifications[0] if len(notifications) == 1 else notifications


def _send_email_notification(notification):
    """Send an email notification."""
    try:
        # In a real implementation, you would use Django's email backend
        send_mail(
            subject=notification.subject,
            message=notification.body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[notification.recipient],
            fail_silently=False,
        )
        
        # Update notification status
        notification.status = 'sent'
        notification.sent_at = timezone.now()
        notification.save()
        
        return True
    except Exception as e:
        # Log the error
        notification.status = 'failed'
        notification.error_message = str(e)
        notification.save()
        
        return False


def _send_sms_notification(notification):
    """Send an SMS notification."""
    try:
        # Get active SMS provider
        provider = SMSProvider.objects.filter(is_active=True).first()
        
        if not provider:
            raise Exception("No active SMS provider configured")
        
        # In a real implementation, you would integrate with the SMS provider's API
        # For now, we'll just simulate sending an SMS
        
        # Example for Twilio integration:
        if provider.provider == 'twilio':
            # This would use the twilio library in a real implementation
            pass
        
        # Update notification status
        notification.status = 'sent'
        notification.sent_at = timezone.now()
        notification.save()
        
        return True
    except Exception as e:
        # Log the error
        notification.status = 'failed'
        notification.error_message = str(e)
        notification.save()
        
        return False


def send_notification_from_template(recipient, event_type, context_data=None, notification_types=None):
    """
    Send a notification using a template.
    
    Args:
        recipient: User object
        event_type: Event type string (must match NotificationEvent.event_type)
        context_data: Dictionary of context data for template rendering
        notification_types: List of notification types to send (default: all configured for the event)
    
    Returns:
        List of created Notification objects
    """
    from .models import NotificationEvent
    
    if context_data is None:
        context_data = {}
    
    # Get notification event configuration
    try:
        event = NotificationEvent.objects.get(event_type=event_type, is_active=True)
    except NotificationEvent.DoesNotExist:
        return []
    
    notifications = []
    
    # Determine which notification types to send
    if notification_types is None:
        notification_types = []
        if event.email_template:
            notification_types.append('email')
        if event.sms_template:
            notification_types.append('sms')
        if event.push_template:
            notification_types.append('push')
    
    # Create context for template rendering
    context = Context(context_data)
    
    # Send email notification
    if 'email' in notification_types and event.email_template:
        template = event.email_template
        subject_template = Template(template.subject or '')
        body_template = Template(template.body)
        
        subject = subject_template.render(context)
        body = body_template.render(context)
        
        notification = Notification.objects.create(
            user=recipient,
            template=template,
            type='email',
            subject=subject,
            body=body,
            recipient=recipient.email,
            status='pending'
        )
        
        _send_email_notification(notification)
        notifications.append(notification)
    
    # Send SMS notification
    if 'sms' in notification_types and event.sms_template:
        template = event.sms_template
        body_template = Template(template.body)
        body = body_template.render(context)
        
        notification = Notification.objects.create(
            user=recipient,
            template=template,
            type='sms',
            body=body,
            recipient=recipient.phone,
            status='pending'
        )
        
        _send_sms_notification(notification)
        notifications.append(notification)
    
    # Push notifications would be handled similarly
    
    return notifications 