from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from products.models import Product
import uuid
from emi.models import EMIPlan, EMIRecord, EMIInstallment

User = get_user_model()


class Cart(models.Model):
    """Shopping cart model."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Promo code information
    promo_code = models.ForeignKey('promotions.PromoCode', on_delete=models.SET_NULL, null=True, blank=True, related_name='carts')
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    def __str__(self):
        return f"{self.user.email}'s Cart"
    
    @property
    def total_price(self):
        """Calculate total price of all items in cart."""
        return sum(item.total_price for item in self.items.all())
    
    @property
    def total_items(self):
        """Calculate total number of items in cart."""
        return sum(item.quantity for item in self.items.all())


class CartItem(models.Model):
    """Shopping cart item model."""
    
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variation = models.ForeignKey('products.ProductVariation', on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    emi_selected = models.BooleanField(default=False)
    emi_period = models.PositiveIntegerField(default=0, help_text="EMI period in months")
    emi_plan = models.ForeignKey('emi.EMIPlan', on_delete=models.SET_NULL, null=True, blank=True, help_text="Selected EMI plan")
    shipping_method = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['cart', 'product', 'variation']
    
    def __str__(self):
        return f"{self.quantity} x {self.product.name} in {self.cart}"
    
    @property
    def total_price(self):
        """Calculate total price for this item."""
        if self.variation:
            return self.variation.price * self.quantity
        unit_price = self.product.sale_price if self.product.sale_price else self.product.price
        return unit_price * self.quantity


class Order(models.Model):
    """Order model."""
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    )
    
    PAYMENT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    )
    
    PAYMENT_METHOD_CHOICES = (
        ('card', 'Credit/Debit Card'),
        ('bank', 'Bank Transfer'),
        ('cod', 'Cash on Delivery'),
        ('mobile', 'Mobile Banking'),
    )
    
    order_id = models.CharField(max_length=50, unique=True, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    
    # Address information
    shipping_address = models.TextField()
    shipping_city = models.CharField(max_length=100)
    shipping_state = models.CharField(max_length=100)
    shipping_postal_code = models.CharField(max_length=20)
    shipping_phone = models.CharField(max_length=15)
    
    # Price information
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    shipping_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Discount information
    promo_code = models.ForeignKey('promotions.PromoCode', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # EMI information
    has_emi = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Order {self.order_id}"
    
    def save(self, *args, **kwargs):
        # Generate order ID if not set
        if not self.order_id:
            self.order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    # Add compatibility properties for legacy code --------------------------
    @property
    def order_number(self):
        """Alias for order_id used in some legacy notification templates."""
        return self.order_id

    @property
    def total_amount(self):
        """Alias for total used in notifications and reports."""
        return self.total


class OrderItem(models.Model):
    """Order item model."""
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variation = models.ForeignKey('products.ProductVariation', on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=12, decimal_places=2, help_text="Price at the time of purchase")
    has_emi = models.BooleanField(default=False)
    emi_plan = models.ForeignKey('emi.EMIPlan', on_delete=models.SET_NULL, null=True, blank=True)
    
    def __str__(self):
        return f"{self.quantity} x {self.product.name} in {self.order}"
    
    @property
    def total_price(self):
        """Calculate total price for this item."""
        return self.price * self.quantity
