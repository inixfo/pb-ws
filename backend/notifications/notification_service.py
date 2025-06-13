import logging
from django.utils import timezone
from .models import NotificationEvent
from .services import SMSService
from .email_service import EmailService

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for sending notifications through multiple channels."""
    
    @classmethod
    def send_event_notification(cls, event_type, user=None, context_data=None, 
                               email=None, phone_number=None, related_object=None):
        """
        Send notifications based on an event type through all configured channels.
        
        Args:
            event_type (str): The type of event (e.g., 'order_created')
            user (User, optional): The user to notify
            context_data (dict, optional): Context data for the template
            email (str, optional): Override the user's email
            phone_number (str, optional): Override the user's phone number
            related_object (Model, optional): The related object (order, emi, etc.)
            
        Returns:
            dict: Dictionary with results for each notification type
        """
        results = {}
        
        try:
            # Get event configuration
            try:
                event = NotificationEvent.objects.get(event_type=event_type, is_active=True)
            except NotificationEvent.DoesNotExist:
                logger.warning(f"No notification event configured for: {event_type}")
                return {'error': f"Event not configured: {event_type}"}
            
            # Prepare context
            context = context_data or {}
            
            # Add user data to context if not already present
            if user and 'user' not in context:
                context['user'] = {
                    'name': user.get_full_name() if hasattr(user, 'get_full_name') else getattr(user, 'email', 'User'),
                    'email': getattr(user, 'email', ''),
                    'phone': getattr(user, 'phone', '')
                }
            
            # Send email notification if configured
            if event.email_template:
                email_result = EmailService.send_event_notification(
                    event_type, user, email, context, related_object
                )
                if email_result:
                    results['email'] = {
                        'status': email_result.status,
                        'id': email_result.id
                    }
            
            # Send SMS notification if configured
            if event.sms_template:
                sms_results = SMSService.send_event_notification(
                    event_type, user, context, related_object
                )
                if sms_results:
                    results['sms'] = {
                        'status': sms_results.status if hasattr(sms_results, 'status') else 'unknown',
                        'id': sms_results.id if hasattr(sms_results, 'id') else None
                    }
            
            # Log successful notification
            if results:
                channels = ', '.join(results.keys())
                logger.info(f"Sent {event_type} notification via {channels}")
            else:
                logger.warning(f"No notifications sent for {event_type} - no channels configured")
            
            return results
            
        except Exception as e:
            logger.exception(f"Failed to send notifications for event {event_type}: {str(e)}")
            return {'error': str(e)}
    
    @classmethod
    def notify_order_created(cls, order, user=None):
        """Send notification for order creation."""
        context = {
            'order': {
                'id': order.id,
                'order_number': order.order_number,
                'total': float(order.total_amount),
                'date': order.created_at.strftime('%Y-%m-%d %H:%M'),
                'status': order.status,
                'items_count': order.items.count() if hasattr(order, 'items') else 0
            }
        }
        return cls.send_event_notification('order_created', user or order.user, context, related_object=order)
    
    @classmethod
    def notify_order_status_change(cls, order, old_status=None):
        """Send notification for order status change."""
        context = {
            'order': {
                'id': order.id,
                'order_number': order.order_number,
                'status': order.status,
                'old_status': old_status or 'unknown',
                'date': timezone.now().strftime('%Y-%m-%d %H:%M')
            }
        }
        return cls.send_event_notification('order_status_change', order.user, context, related_object=order)
    
    @classmethod
    def notify_emi_created(cls, emi_record, user=None):
        """Send notification for EMI creation."""
        context = {
            'emi': {
                'id': emi_record.id,
                'amount': float(emi_record.total_amount),
                'tenure': emi_record.tenure,
                'monthly_amount': float(emi_record.monthly_amount),
                'status': emi_record.status,
                'date': emi_record.created_at.strftime('%Y-%m-%d %H:%M')
            }
        }
        return cls.send_event_notification('emi_created', user or emi_record.user, context, related_object=emi_record)
    
    @classmethod
    def notify_emi_status_change(cls, emi_record, new_status):
        """Send notification for EMI status change."""
        event_type = f"emi_{new_status.lower()}"  # e.g., emi_approved, emi_rejected
        
        context = {
            'emi': {
                'id': emi_record.id,
                'amount': float(emi_record.total_amount),
                'tenure': emi_record.tenure,
                'monthly_amount': float(emi_record.monthly_amount),
                'status': new_status,
                'date': timezone.now().strftime('%Y-%m-%d %H:%M')
            }
        }
        return cls.send_event_notification(event_type, emi_record.user, context, related_object=emi_record)
    
    @classmethod
    def notify_vendor_status_change(cls, vendor_profile, new_status):
        """Send notification for vendor approval status change."""
        event_type = f"vendor_{new_status.lower()}"  # e.g., vendor_approved, vendor_rejected
        
        context = {
            'vendor': {
                'id': vendor_profile.id,
                'name': vendor_profile.store_name,
                'status': new_status,
                'date': timezone.now().strftime('%Y-%m-%d %H:%M')
            }
        }
        return cls.send_event_notification(event_type, vendor_profile.user, context, related_object=vendor_profile) 