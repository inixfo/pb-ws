import requests
import logging
from django.conf import settings
from django.utils import timezone
from django.template import Template, Context
from django.contrib.contenttypes.models import ContentType
from .models import Notification, SMSProvider, NotificationTemplate, NotificationEvent
import uuid

logger = logging.getLogger(__name__)


class SMSService:
    """Service for sending SMS notifications."""
    
    @staticmethod
    def get_active_provider():
        """Get the active SMS provider."""
        return SMSProvider.objects.filter(is_active=True).first()
    
    @staticmethod
    def send_sms(recipient, message, user=None, related_object=None, template=None):
        """Send an SMS using the configured provider."""
        provider = SMSService.get_active_provider()
        if not provider:
            logger.error("No active SMS provider found")
            return None
        
        try:
            if provider.provider_type == 'ssl_wireless':
                return SMSService._send_ssl_wireless_sms(provider, recipient, message)
            # Add other provider implementations here
            
            # Create notification record
            notification = Notification.objects.create(
                recipient=recipient,
                type='sms',
                body=message,
                user=user,
                template=template,
                status='sent',
                content_type=ContentType.objects.get_for_model(related_object) if related_object else None,
                object_id=related_object.id if related_object else None
            )
            
            return notification
            
        except Exception as e:
            logger.exception(f"Failed to send SMS: {str(e)}")
            return None
    
    @staticmethod
    def _send_ssl_wireless_sms(provider, recipient, message):
        """Send SMS using SSL Wireless API."""
        try:
            # Generate unique CSMS ID
            csms_id = str(uuid.uuid4())[:20]
            
            # Prepare request data
            data = {
                'api_token': provider.api_token,
                'sid': provider.sid,
                'msisdn': recipient,
                'sms': message,
                'csm_id': csms_id
            }
            
            # Make API request
            response = requests.post(
                f"{provider.api_url}/api/v3/send-sms",
                json=data,
                headers={'Content-Type': 'application/json'}
            )
            
            # Parse response
            result = response.json()
            
            if result.get('status') == 'SUCCESS':
                return {
                    'status': 'sent',
                    'reference_id': result.get('sms_info', [{}])[0].get('reference_id'),
                    'csms_id': csms_id
                }
            else:
                logger.error(f"SSL Wireless API error: {result.get('error_message')}")
                return {
                    'status': 'failed',
                    'error': result.get('error_message')
                }
                
        except Exception as e:
            logger.exception(f"SSL Wireless API error: {str(e)}")
            return {
                'status': 'failed',
                'error': str(e)
            }
    
    @staticmethod
    def send_event_notification(event_type, user, context_data=None, related_object=None):
        """Send an event-based notification."""
        try:
            # Get notification template for the event
            event_templates = []
            
            # Try to find from sms_events relationship first (forward relationship)
            from .models import NotificationEvent
            try:
                event = NotificationEvent.objects.get(event_type=event_type, is_active=True)
                if event.sms_template:
                    event_templates.append(event.sms_template)
            except NotificationEvent.DoesNotExist:
                pass
            
            # If no template found, try to find by name match as fallback
            if not event_templates:
                from .models import NotificationTemplate
                template = NotificationTemplate.objects.filter(
                    name__icontains=event_type,
                    type='sms',
                    is_active=True
                ).first()
                
                if template:
                    event_templates.append(template)
            
            if not event_templates:
                logger.error(f"No SMS template found for event: {event_type}")
                return None
            
            # Use the first template found
            template = event_templates[0]
            
            # Render template with context
            message = template.render_body(context_data or {})
            
            # Send SMS
            if hasattr(user, 'phone_number') and user.phone_number:
                return SMSService.send_sms(
                    recipient=user.phone_number,
                    message=message,
                    user=user,
                    related_object=related_object,
                    template=template
                )
            else:
                logger.warning(f"Cannot send SMS to user {user.id}: No phone number available")
                return None
            
        except Exception as e:
            logger.exception(f"Failed to send event notification: {str(e)}")
            return None

    @staticmethod
    def test_sms_provider(provider_id=None):
        """Test SMS provider configuration."""
        try:
            provider = SMSProvider.objects.get(id=provider_id) if provider_id else SMSService.get_active_provider()
            if not provider:
                return {'status': 'error', 'message': 'No active SMS provider found'}
            
            # Test message
            test_message = "This is a test message from Phone Bay. If you receive this, your SMS configuration is working correctly."
            test_number = settings.TEST_SMS_NUMBER  # Add this to your settings
            
            if provider.provider_type == 'ssl_wireless':
                result = SMSService._send_ssl_wireless_sms(provider, test_number, test_message)
            else:
                return {'status': 'error', 'message': 'Provider type not supported for testing'}
            
            return {
                'status': 'success' if result.get('status') == 'sent' else 'error',
                'message': 'Test SMS sent successfully' if result.get('status') == 'sent' else result.get('error', 'Unknown error'),
                'details': result
            }
            
        except Exception as e:
            logger.exception(f"Failed to test SMS provider: {str(e)}")
            return {'status': 'error', 'message': str(e)}

    @classmethod
    def send_template_sms(cls, phone_number, template_name, context_data, user=None, related_object=None):
        """
        Send an SMS using a template.
        
        Args:
            phone_number (str): The recipient's phone number
            template_name (str): The name of the template to use
            context_data (dict): Context data for the template
            user (User, optional): The user to associate with this notification
            related_object (Model, optional): The related object (order, emi, etc.)
            
        Returns:
            Notification: The created notification object
        """
        try:
            template = NotificationTemplate.objects.get(name=template_name, type='sms', is_active=True)
            # Render template with context
            django_template = Template(template.body)
            context = Context(context_data)
            message = django_template.render(context)
            
            # Send SMS
            notification = cls.send_sms(phone_number, message, user, related_object, template)
            notification.template = template
            notification.save()
            return notification
            
        except NotificationTemplate.DoesNotExist:
            logger.error(f"SMS template not found: {template_name}")
            return cls._create_notification(
                phone_number, f"Template '{template_name}' not found", user, 'failed', 
                f"Template not found: {template_name}", related_object
            )
        except Exception as e:
            logger.exception(f"Failed to send template SMS to {phone_number}: {str(e)}")
            return cls._create_notification(
                phone_number, "", user, 'failed', 
                f"Error rendering template: {str(e)}", related_object
            )
    
    @staticmethod
    def _create_notification(recipient, body, user, status, error=None, related_object=None):
        """Create a notification record."""
        notification = Notification(
            user=user,
            type='sms',
            body=body,
            recipient=recipient,
            status=status,
            error_message=error
        )
        
        # Add related object if provided
        if related_object:
            notification.content_type = ContentType.objects.get_for_model(related_object)
            notification.object_id = related_object.id
        
        notification.save()
        return notification
    
    @staticmethod
    def _send_twilio_sms(provider, phone_number, message, notification):
        """Send SMS using Twilio."""
        try:
            # This would be a real implementation using the Twilio SDK
            # For now, simulate success
            notification.status = 'sent'
            notification.sent_at = timezone.now()
            notification.provider_message_id = f"twilio-{notification.id}"
            notification.save()
        except Exception as e:
            raise Exception(f"Twilio SMS error: {str(e)}")
    
    @staticmethod
    def _send_nexmo_sms(provider, phone_number, message, notification):
        """Send SMS using Nexmo/Vonage."""
        try:
            # This would be a real implementation using the Nexmo SDK
            # For now, simulate success
            notification.status = 'sent'
            notification.sent_at = timezone.now()
            notification.provider_message_id = f"nexmo-{notification.id}"
            notification.save()
        except Exception as e:
            raise Exception(f"Nexmo SMS error: {str(e)}")
    
    @staticmethod
    def _send_messagebird_sms(provider, phone_number, message, notification):
        """Send SMS using MessageBird."""
        try:
            # This would be a real implementation using the MessageBird SDK
            # For now, simulate success
            notification.status = 'sent'
            notification.sent_at = timezone.now()
            notification.provider_message_id = f"messagebird-{notification.id}"
            notification.save()
        except Exception as e:
            raise Exception(f"MessageBird SMS error: {str(e)}")
    
    @staticmethod
    def _send_custom_sms(provider, phone_number, message, notification):
        """Send SMS using a custom API."""
        try:
            # This would be a real implementation using custom API settings
            # For now, simulate success
            notification.status = 'sent'
            notification.sent_at = timezone.now()
            notification.provider_message_id = f"custom-{notification.id}"
            notification.save()
        except Exception as e:
            raise Exception(f"Custom SMS API error: {str(e)}") 