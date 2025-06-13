from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
import logging
from .models import Order

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Order)
def order_post_save(sender, instance, created, **kwargs):
    """
    Signal handler for Order post_save event.
    
    Sends SMS notifications for:
    - New order created
    - Order status updates
    - Payment status updates
    """
    # Check if SMS service is available
    try:
        from sms.services import SMSService
        sms_service = SMSService()
    except ImportError:
        logger.warning("SMS module not available. Skipping order notification.")
        return
    
    # Get previous state if available
    previous_state = getattr(instance, '_previous_state', None)
    
    # New order created
    if created:
        logger.info(f"New order created: {instance.order_id}")
        try:
            sms_service.send_order_confirmation(instance)
        except Exception as e:
            logger.error(f"Error sending order confirmation SMS: {str(e)}")
    
    # Order status changed
    elif previous_state and previous_state.status != instance.status:
        logger.info(f"Order status changed: {instance.order_id} - {previous_state.status} to {instance.status}")
        try:
            sms_service.send_order_status_update(instance)
        except Exception as e:
            logger.error(f"Error sending order status SMS: {str(e)}")
    
    # Payment status changed to paid
    elif previous_state and previous_state.payment_status != instance.payment_status and instance.payment_status == 'paid':
        logger.info(f"Payment status changed to paid: {instance.order_id}")
        try:
            sms_service.send_payment_confirmation(instance)
        except Exception as e:
            logger.error(f"Error sending payment confirmation SMS: {str(e)}")


@receiver(pre_save, sender=Order)
def order_pre_save(sender, instance, **kwargs):
    """
    Store previous state of the order for comparison after save.
    """
    if instance.pk:
        try:
            instance._previous_state = Order.objects.get(pk=instance.pk)
        except Order.DoesNotExist:
            pass 