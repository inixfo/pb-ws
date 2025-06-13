import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Sum, F, Q

from .models import Order
from notifications.notification_service import NotificationService

logger = logging.getLogger(__name__)


@shared_task
def process_abandoned_carts():
    """Process abandoned carts and send reminder notifications."""
    # Find carts that have been abandoned (created but not completed) for more than 24 hours
    cutoff_time = timezone.now() - timedelta(hours=24)
    
    abandoned_orders = Order.objects.filter(
        status='created',
        created_at__lt=cutoff_time
    ).select_related('user')
    
    sent_count = 0
    for order in abandoned_orders:
        try:
            # Send reminder notification
            context = {
                'order': {
                    'id': order.id,
                    'order_number': order.order_number,
                    'total': float(order.total_amount),
                    'items_count': order.items.count(),
                    'created_at': order.created_at.strftime('%Y-%m-%d %H:%M')
                },
                'cart_url': f"/cart?order_id={order.id}"
            }
            
            result = NotificationService.send_event_notification(
                'cart_abandoned', 
                order.user, 
                context_data=context,
                related_object=order
            )
            
            if result and not result.get('error'):
                sent_count += 1
                # Update order to indicate reminder was sent
                order.data = order.data or {}
                order.data['reminder_sent'] = True
                order.data['reminder_sent_at'] = timezone.now().isoformat()
                order.save(update_fields=['data'])
                
        except Exception as e:
            logger.exception(f"Failed to process abandoned cart {order.id}: {str(e)}")
    
    return f"Processed {sent_count} abandoned carts"


@shared_task
def update_order_statuses():
    """Update order statuses based on time elapsed."""
    # Orders in 'shipped' status for more than 7 days should be marked as 'delivered'
    delivery_cutoff = timezone.now() - timedelta(days=7)
    
    shipped_orders = Order.objects.filter(
        status='shipped',
        updated_at__lt=delivery_cutoff
    )
    
    updated_count = 0
    for order in shipped_orders:
        try:
            old_status = order.status
            order.status = 'delivered'
            order.save(update_fields=['status', 'updated_at'])
            
            # Send notification
            NotificationService.notify_order_status_change(order, old_status)
            updated_count += 1
            
        except Exception as e:
            logger.exception(f"Failed to update status for order {order.id}: {str(e)}")
    
    return f"Updated {updated_count} orders from shipped to delivered"


@shared_task
def generate_orders_report():
    """Generate a daily orders report."""
    yesterday = timezone.now().date() - timedelta(days=1)
    start_of_yesterday = timezone.datetime.combine(yesterday, timezone.datetime.min.time())
    end_of_yesterday = timezone.datetime.combine(yesterday, timezone.datetime.max.time())
    
    # Get orders from yesterday
    orders = Order.objects.filter(
        created_at__gte=start_of_yesterday,
        created_at__lte=end_of_yesterday
    )
    
    # Calculate totals
    total_orders = orders.count()
    total_amount = orders.aggregate(total=Sum('total_amount'))['total'] or 0
    
    # Status breakdown
    status_counts = orders.values('status').annotate(count=Count('id'))
    status_breakdown = {status['status']: status['count'] for status in status_counts}
    
    # Payment method breakdown
    payment_counts = orders.values('payment_method').annotate(count=Count('id'))
    payment_breakdown = {payment['payment_method']: payment['count'] for payment in payment_counts}
    
    # Log the report
    logger.info(f"Orders Report for {yesterday}:")
    logger.info(f"Total Orders: {total_orders}")
    logger.info(f"Total Amount: {total_amount}")
    logger.info(f"Status Breakdown: {status_breakdown}")
    logger.info(f"Payment Method Breakdown: {payment_breakdown}")
    
    return f"Generated orders report for {yesterday}" 