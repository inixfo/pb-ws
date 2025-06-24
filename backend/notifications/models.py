from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.conf import settings
from django.template import Template, Context
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


class NotificationTemplate(models.Model):
    """Model for notification templates."""
    
    TYPE_CHOICES = (
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('push', 'Push Notification'),
    )
    
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    subject = models.CharField(max_length=255, blank=True, null=True, help_text="Subject for email notifications")
    body = models.TextField(help_text="Template body with placeholders like {{name}}")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.get_type_display()}: {self.name}"
    
    def render_body(self, context_data):
        """Render the template body with the given context data."""
        try:
            template = Template(self.body)
            context = Context(context_data)
            return template.render(context)
        except Exception as e:
            logger.error(f"Failed to render template {self.name}: {str(e)}")
            return self.body  # Return raw body if rendering fails


class SMSProvider(models.Model):
    """Model for SMS provider configuration."""
    PROVIDER_CHOICES = [
        ('twilio', 'Twilio'),
        ('nexmo', 'Nexmo'),
        ('messagebird', 'MessageBird'),
        ('ssl_wireless', 'SSL Wireless'),
        ('custom', 'Custom API')
    ]

    name = models.CharField(max_length=100)
    provider_type = models.CharField(max_length=20, choices=PROVIDER_CHOICES)
    is_active = models.BooleanField(default=True)
    api_token = models.CharField(max_length=100, blank=True)
    sid = models.CharField(max_length=50, blank=True, null=True, help_text="Sender ID/Masking name (optional)")
    api_url = models.URLField(blank=True, null=True, help_text="API endpoint URL (optional)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'SMS Provider'
        verbose_name_plural = 'SMS Providers'

    def __str__(self):
        return f"{self.name} ({self.get_provider_type_display()})"


class Notification(models.Model):
    """Model for tracking notifications sent to users."""
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
    )
    
    TYPE_CHOICES = (
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('push', 'Push Notification'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    template = models.ForeignKey(NotificationTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    subject = models.CharField(max_length=255, blank=True, null=True)
    body = models.TextField()
    recipient = models.CharField(max_length=255, help_text="Email address or phone number")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    data = models.JSONField(blank=True, null=True, help_text="Additional data for the notification")
    
    # For tracking which object triggered the notification
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # For tracking delivery
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)
    provider_message_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_type_display()} to {self.recipient} ({self.get_status_display()})"


class NotificationEvent(models.Model):
    """Model for notification events that trigger notifications."""
    
    EVENT_TYPES = (
        # Order events
        ('order_created', 'Order Created'),
        ('order_status_change', 'Order Status Changed'),
        ('order_shipped', 'Order Shipped'),
        ('order_delivered', 'Order Delivered'),
        
        # EMI events
        ('emi_created', 'EMI Created'),
        ('emi_application_submitted', 'EMI Application Submitted'),
        ('emi_approved', 'EMI Approved'),
        ('emi_rejected', 'EMI Rejected'),
        ('emi_payment_due', 'EMI Payment Due'),
        ('emi_payment_received', 'EMI Payment Received'),
        ('emi_payment_late', 'EMI Payment Late'),
        
        # User events
        ('user_registered', 'User Registered'),
        ('password_reset', 'Password Reset'),
        
        # Vendor events
        ('vendor_approved', 'Vendor Approved'),
        ('vendor_rejected', 'Vendor Rejected'),
        
        # Product events
        ('product_approved', 'Product Approved'),
        ('product_rejected', 'Product Rejected'),
        ('low_stock', 'Low Stock Alert'),
    )
    
    name = models.CharField(max_length=100)
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    email_template = models.ForeignKey(
        NotificationTemplate, 
        on_delete=models.SET_NULL, 
        null=True, blank=True,
        related_name='email_events',
        limit_choices_to={'type': 'email'}
    )
    sms_template = models.ForeignKey(
        NotificationTemplate, 
        on_delete=models.SET_NULL, 
        null=True, blank=True,
        related_name='sms_events',
        limit_choices_to={'type': 'sms'}
    )
    push_template = models.ForeignKey(
        NotificationTemplate, 
        on_delete=models.SET_NULL, 
        null=True, blank=True,
        related_name='push_events',
        limit_choices_to={'type': 'push'}
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_event_type_display()})"
