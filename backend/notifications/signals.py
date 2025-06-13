from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from django.utils import timezone
from django.apps import apps

from .notification_service import NotificationService


# Check if models exist before connecting signals
def is_model_registered(app_label, model_name):
    """Check if a model is registered in Django."""
    try:
        return apps.is_installed(app_label) and apps.get_model(app_label, model_name) is not None
    except LookupError:
        return False


# Connect signals only if the models exist
if is_model_registered('orders', 'Order'):
    @receiver(post_save, sender='orders.Order')
    def order_notification_handler(sender, instance, created, **kwargs):
        """Send notifications for order events."""
        if created:
            # New order created
            NotificationService.notify_order_created(instance)
        else:
            # Check if status changed (requires previous status to be stored)
            if hasattr(instance, '_previous_status') and instance._previous_status != instance.status:
                NotificationService.notify_order_status_change(instance, instance._previous_status)


if is_model_registered('payments', 'EMIRecord'):
    @receiver(post_save, sender='payments.EMIRecord')
    def emi_notification_handler(sender, instance, created, **kwargs):
        """Send notifications for EMI events."""
        if created:
            # New EMI application created
            NotificationService.notify_emi_created(instance)
        else:
            # Check if status changed (requires previous status to be stored)
            if hasattr(instance, '_previous_status') and instance._previous_status != instance.status:
                NotificationService.notify_emi_status_change(instance, instance.status)


if is_model_registered('vendors', 'VendorApproval'):
    @receiver(post_save, sender='vendors.VendorApproval')
    def vendor_approval_notification_handler(sender, instance, created, **kwargs):
        """Send notifications for vendor approval events."""
        if not created and hasattr(instance, '_previous_status') and instance._previous_status != instance.status:
            if instance.status == 'approved':
                NotificationService.notify_vendor_status_change(instance.vendor_profile, 'approved')
            elif instance.status == 'rejected':
                NotificationService.notify_vendor_status_change(instance.vendor_profile, 'rejected')


# To use these signals, you need to store previous state before saving
# Example pre_save handler for Order model:
# 
# @receiver(pre_save, sender='orders.Order')
# def store_previous_order_status(sender, instance, **kwargs):
#     if instance.pk:
#         try:
#             instance._previous_status = sender.objects.get(pk=instance.pk).status
#         except sender.DoesNotExist:
#             pass 