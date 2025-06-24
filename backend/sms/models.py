from django.db import models
from django.utils import timezone
from django.conf import settings
from django.db.models.signals import post_migrate
from django.dispatch import receiver

class SMSTemplate(models.Model):
    """SMS template model for different notification types"""
    
    TYPE_CHOICES = (
        ('welcome', 'Welcome Message'),
        ('verification', 'Phone Verification'),
        ('order_confirmation', 'Order Confirmation'),
        ('order_created', 'Order Created'),
        ('payment_success', 'Payment Success'),
        ('order_status', 'Order Status Update'),
        ('emi_reminder', 'EMI Payment Reminder'),
        ('emi_application_submitted', 'EMI Application Submitted'),
    )
    
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    template_text = models.TextField(help_text="Use {variables} for dynamic content")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"


class SMSLog(models.Model):
    """Log of SMS messages sent"""
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
    )
    
    phone_number = models.CharField(max_length=15)
    message = models.TextField()
    template = models.ForeignKey(SMSTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True, null=True)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"SMS to {self.phone_number} ({self.status})"
    
    def mark_as_sent(self, transaction_id=None):
        self.status = 'sent'
        self.sent_at = timezone.now()
        self.transaction_id = transaction_id
        self.save()
    
    def mark_as_delivered(self):
        self.status = 'delivered'
        self.delivered_at = timezone.now()
        self.save()
    
    def mark_as_failed(self, error_message=None):
        self.status = 'failed'
        self.error_message = error_message
        self.save()


class PhoneVerification(models.Model):
    """Phone verification codes for user registration/account verification"""
    
    phone_number = models.CharField(max_length=15)
    verification_code = models.CharField(max_length=6)
    is_verified = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Verification for {self.phone_number}"
    
    @property
    def is_expired(self):
        return timezone.now() > self.expires_at


@receiver(post_migrate)
def create_default_sms_templates(sender, **kwargs):
    """Create default SMS templates if they don't exist"""
    if sender.name != 'sms':
        return
        
    default_templates = {
        'welcome': 'Welcome to Phone Bay! Thank you for registering with us.',
        'verification': 'Your Phone Bay verification code is {code}. Valid for 10 minutes.',
        'order_confirmation': 'Your order #{order_id} has been confirmed. Thank you for shopping with Phone Bay!',
        'order_created': 'Thank you for your order! Your order #{order_id} has been received and is being processed.',
        'payment_success': 'Payment of {amount} received for order #{order_id}. Thank you!',
        'order_status': 'Your order #{order_id} status has been updated to: {status}',
        'emi_reminder': 'Reminder: Your EMI payment of {amount} for order #{order_id} is due on {due_date}.',
        'emi_application_submitted': 'Your EMI application for order #{order_id} has been submitted. We will process it shortly.'
    }
    
    for template_type, template_text in default_templates.items():
        # Skip if template of this type already exists
        if SMSTemplate.objects.filter(type=template_type).exists():
            continue
            
        # Create the template
        template_name = template_type.replace('_', ' ').title()
        SMSTemplate.objects.create(
            name=f"{template_name} Template",
            type=template_type,
            template_text=template_text,
            is_active=True
        )
        print(f"Created default SMS template for: {template_name}")
