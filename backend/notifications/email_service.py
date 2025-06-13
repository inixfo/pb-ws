import logging
import html
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template import Template, Context
from django.contrib.contenttypes.models import ContentType

from .models import Notification, NotificationTemplate, NotificationEvent

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending email notifications."""
    
    @classmethod
    def send_email(cls, recipient, subject, body, user=None, related_object=None, template=None):
        """
        Send an email notification.
        
        Args:
            recipient (str): Email address to send to
            subject (str): Email subject
            body (str): Email body (can be HTML)
            user (User, optional): The user to associate with the notification
            related_object (Model, optional): The related object
            template (NotificationTemplate, optional): The template used
            
        Returns:
            Notification: The created notification object
        """
        try:
            # Create notification record
            notification = Notification(
                user=user,
                template=template,
                type='email',
                subject=subject,
                body=body,
                recipient=recipient,
                status='pending',
            )
            
            # Associate with related object if provided
            if related_object:
                content_type = ContentType.objects.get_for_model(related_object)
                notification.content_type = content_type
                notification.object_id = related_object.id
            
            notification.save()
            
            # Actually send the email
            try:
                html_content = body
                text_content = html.unescape(body.replace('<br>', '\n').replace('</p>', '\n').replace('<p>', ''))
                
                for tag in ['<div>', '</div>', '<span>', '</span>', '<strong>', '</strong>', '<em>', '</em>', '<a.*?>', '</a>']:
                    text_content = text_content.replace(tag, '')
                
                # Create message
                msg = EmailMultiAlternatives(
                    subject,
                    text_content,
                    settings.DEFAULT_FROM_EMAIL,
                    [recipient]
                )
                msg.attach_alternative(html_content, "text/html")
                msg.send()
                
                # Update notification status
                notification.status = 'sent'
                notification.sent_at = timezone.now()
                notification.save()
                
            except Exception as e:
                logger.exception(f"Failed to send email to {recipient}: {str(e)}")
                notification.status = 'failed'
                notification.error_message = str(e)
                notification.save()
            
            return notification
            
        except Exception as e:
            logger.exception(f"Failed to create email notification: {str(e)}")
            return None
    
    @classmethod
    def send_event_notification(cls, event_type, user, email=None, context=None, related_object=None):
        """
        Send an email notification based on an event type.
        
        Args:
            event_type (str): The type of event (e.g., 'order_created')
            user (User): The user to notify
            email (str, optional): Override the user's email
            context (dict, optional): Context data for the template
            related_object (Model, optional): The related object
            
        Returns:
            Notification: The created notification object
        """
        try:
            # Get event configuration
            try:
                event = NotificationEvent.objects.get(event_type=event_type, is_active=True)
                template = event.email_template
                
                if not template:
                    logger.warning(f"No email template configured for event: {event_type}")
                    return None
                
            except NotificationEvent.DoesNotExist:
                logger.warning(f"No notification event configured for: {event_type}")
                return None
            
            # Get recipient email
            recipient = email or getattr(user, 'email', None)
            if not recipient:
                logger.error(f"No email address found for user {user.id}")
                return None
            
            # Parse template
            ctx = Context(context or {})
            subject_template = Template(template.subject or '')
            body_template = Template(template.body)
            
            subject = subject_template.render(ctx)
            body = body_template.render(ctx)
            
            # Send email
            return cls.send_email(recipient, subject, body, user, related_object, template)
            
        except Exception as e:
            logger.exception(f"Failed to send email notification for event {event_type}: {str(e)}")
            return None 