from django.db import models
from django.utils import timezone
from django.conf import settings
from orders.models import Order

# Create your models here.
class Payment(models.Model):
    """Model for payment records."""
    
    PAYMENT_TYPE_CHOICES = (
        ('REGULAR', 'Regular Payment'),
        ('CARD_EMI', 'Card EMI Payment'),
        ('CARDLESS_EMI_DOWN_PAYMENT', 'Cardless EMI Down Payment'),
        ('EMI_INSTALLMENT', 'EMI Installment Payment'),
    )
    
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('CANCELED', 'Canceled'),
    )
    
    # User and order
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='payments')
    
    # Payment details
    transaction_id = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=50)
    payment_type = models.CharField(max_length=30, choices=PAYMENT_TYPE_CHOICES, default='REGULAR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    payment_details = models.JSONField(null=True, blank=True)
    
    # EMI related fields
    emi_plan = models.ForeignKey('emi.EMIPlan', on_delete=models.SET_NULL, null=True, blank=True)
    installment = models.ForeignKey('emi.EMIInstallment', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Payment #{self.id} - {self.user.get_full_name()} - {self.amount}"


class Transaction(models.Model):
    TRANSACTION_TYPE_CHOICES = [
        ('PAYMENT', 'Payment'),
        ('REFUND', 'Refund'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.transaction_type} of {self.amount}"
