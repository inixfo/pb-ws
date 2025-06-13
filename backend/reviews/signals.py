from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg

from .models import Review, ReviewVote
from notifications.notification_service import NotificationService


@receiver(post_save, sender=Review)
def notify_on_review_status_change(sender, instance, created, **kwargs):
    """Send notifications when a review status changes."""
    if not created and hasattr(instance, '_previous_status') and instance._previous_status != instance.status:
        # Notify user when their review is approved or rejected
        if instance.status == 'approved':
            try:
                NotificationService.send_event_notification(
                    'review_approved',
                    instance.user,
                    context_data={
                        'review': {
                            'id': instance.id,
                            'product_name': instance.product.name,
                            'rating': instance.rating,
                            'title': instance.title
                        }
                    },
                    related_object=instance
                )
            except Exception as e:
                # Log the error but don't break the save process
                print(f"Error sending review approval notification: {str(e)}")
        
        elif instance.status == 'rejected':
            try:
                NotificationService.send_event_notification(
                    'review_rejected',
                    instance.user,
                    context_data={
                        'review': {
                            'id': instance.id,
                            'product_name': instance.product.name,
                            'rating': instance.rating,
                            'title': instance.title,
                            'admin_note': instance.admin_note or 'No reason provided'
                        }
                    },
                    related_object=instance
                )
            except Exception as e:
                # Log the error but don't break the save process
                print(f"Error sending review rejection notification: {str(e)}")


@receiver(post_save, sender=Review)
def notify_vendor_on_new_review(sender, instance, created, **kwargs):
    """Notify vendor when a new review is posted for their product."""
    if created and hasattr(instance.product, 'vendor'):
        vendor = instance.product.vendor
        if vendor and hasattr(vendor, 'user'):
            try:
                NotificationService.send_event_notification(
                    'new_product_review',
                    vendor.user,
                    context_data={
                        'review': {
                            'id': instance.id,
                            'product_name': instance.product.name,
                            'rating': instance.rating,
                            'title': instance.title,
                            'status': instance.status
                        }
                    },
                    related_object=instance
                )
            except Exception as e:
                # Log the error but don't break the save process
                print(f"Error sending vendor notification: {str(e)}")


@receiver(post_save, sender=Review)
def update_product_rating(sender, instance, **kwargs):
    """Update product rating when a review is saved/updated."""
    # No need to update rating field since we use the average_rating property
    # that calculates in real-time from reviews
    pass  # The average_rating property will calculate automatically when needed


@receiver(post_delete, sender=Review)
def update_product_rating_on_delete(sender, instance, **kwargs):
    """Update product rating when a review is deleted."""
    if instance.product:
        # No need to update rating field since we use the average_rating property
        # that calculates in real-time from reviews
        pass  # The average_rating property will calculate automatically when needed 