import logging
from celery import shared_task
from django.utils import timezone
from django.db.models import Q
from datetime import timedelta

from .models import Notification
from .notification_service import NotificationService
from emi.models import EMIPayment, EMIInstallment
from products.models import Product
from .services import SMSService

logger = logging.getLogger(__name__)


@shared_task
def send_emi_payment_reminders():
    """Send reminders for upcoming EMI payments."""
    # Get installments due in the next 3 days
    today = timezone.now().date()
    due_date = today + timedelta(days=3)
    
    upcoming_installments = EMIInstallment.objects.filter(
        status__in=['pending', 'due'],
        due_date__lte=due_date,
        due_date__gte=today
    ).select_related('emi_record__user', 'emi_record__order')
    
    sent_count = 0
    for installment in upcoming_installments:
        try:
            # Send reminder SMS
            SMSService.send_event_notification(
                event_type='emi_payment_reminder',
                user=installment.emi_record.user,
                context_data={
                    'order_id': installment.emi_record.order.id,
                    'amount': str(installment.amount),
                    'due_date': installment.due_date.strftime('%Y-%m-%d')
                },
                related_object=installment
            )
            sent_count += 1
        except Exception as e:
            logger.exception(f"Failed to send EMI reminder for installment {installment.id}: {str(e)}")
    
    return f"Sent {sent_count} EMI payment reminders"


@shared_task
def send_emi_overdue_notifications():
    """Send notifications for overdue EMI payments."""
    # Get overdue installments
    today = timezone.now().date()
    
    overdue_installments = EMIInstallment.objects.filter(
        status='overdue',
        due_date__lt=today
    ).select_related('emi_record__user', 'emi_record__order')
    
    sent_count = 0
    for installment in overdue_installments:
        try:
            # Send overdue notification SMS
            SMSService.send_event_notification(
                event_type='emi_payment_overdue',
                user=installment.emi_record.user,
                context_data={
                    'order_id': installment.emi_record.order.id,
                    'amount': str(installment.amount)
                },
                related_object=installment
            )
            sent_count += 1
        except Exception as e:
            logger.exception(f"Failed to send EMI overdue notification for installment {installment.id}: {str(e)}")
    
    return f"Sent {sent_count} EMI overdue notifications"


@shared_task
def send_low_stock_alerts():
    """Send alerts for products with low stock."""
    low_stock_threshold = 10  # Consider this configurable in the future
    
    low_stock_products = Product.objects.filter(
        stock_quantity__lte=low_stock_threshold,
        is_available=True
    ).select_related('vendor')
    
    sent_count = 0
    for product in low_stock_products:
        try:
            # Skip if this product already has a recent low stock alert
            recent_alert = Notification.objects.filter(
                content_type__model='product',
                object_id=product.id,
                type__in=['email', 'sms'],
                created_at__gte=timezone.now() - timedelta(days=3)  # Don't alert more than once every 3 days
            ).exists()
            
            if recent_alert:
                continue
            
            # Send low stock notification to vendor
            context = {
                'product': {
                    'id': product.id,
                    'name': product.name,
                    'stock': product.stock_quantity,
                    'threshold': low_stock_threshold
                }
            }
            
            result = NotificationService.send_event_notification(
                'low_stock', 
                product.vendor, 
                context_data=context,
                related_object=product
            )
            
            if result and not result.get('error'):
                sent_count += 1
                
        except Exception as e:
            logger.exception(f"Failed to send low stock alert for product {product.id}: {str(e)}")
    
    return f"Sent {sent_count} low stock alerts"


@shared_task
def clean_old_notifications():
    """Clean up old notifications."""
    # Keep notifications for 90 days
    cutoff_date = timezone.now() - timedelta(days=90)
    
    # Delete old notifications
    result = Notification.objects.filter(created_at__lt=cutoff_date).delete()
    
    return f"Cleaned up {result[0]} old notifications"


@shared_task
def retry_failed_notifications():
    """Retry failed notifications."""
    # Get failed notifications from the last 24 hours
    cutoff_date = timezone.now() - timedelta(days=1)
    failed_notifications = Notification.objects.filter(
        status='failed',
        created_at__gte=cutoff_date
    )
    
    retried_count = 0
    success_count = 0
    
    for notification in failed_notifications:
        try:
            # For email notifications
            if notification.type == 'email':
                from .email_service import EmailService
                
                result = EmailService.send_email(
                    notification.recipient,
                    notification.subject,
                    notification.body,
                    notification.user,
                    notification.content_object,
                    notification.template
                )
                
                if result and result.status == 'sent':
                    success_count += 1
            
            # For SMS notifications
            elif notification.type == 'sms':
                from .services import SMSService
                
                result = SMSService.send_sms(
                    notification.recipient,
                    notification.body,
                    notification.user,
                    notification.content_object,
                    notification.template
                )
                
                if result and result.status == 'sent':
                    success_count += 1
            
            retried_count += 1
            
        except Exception as e:
            logger.exception(f"Failed to retry notification {notification.id}: {str(e)}")
    
    return f"Retried {retried_count} notifications, {success_count} successful" 