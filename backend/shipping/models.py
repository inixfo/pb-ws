from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth import get_user_model

User = get_user_model()


class ShippingZone(models.Model):
    """Model for defining shipping zones (e.g., countries, regions, or cities)."""
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    
    # Countries/Regions covered by this zone
    countries = models.JSONField(
        help_text="List of country codes covered by this zone",
        default=list
    )
    
    # States/Provinces covered (if applicable)
    states = models.JSONField(
        help_text="List of state/province codes covered by this zone",
        default=list,
        blank=True
    )
    
    # Cities covered (if applicable)
    cities = models.JSONField(
        help_text="List of cities covered by this zone",
        default=list,
        blank=True
    )
    
    # ZIP/Postal code ranges
    postal_codes = models.JSONField(
        help_text="List of postal code patterns or ranges covered by this zone",
        default=list,
        blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class ShippingMethod(models.Model):
    """Model for different shipping methods (e.g., Standard, Express, Next Day)."""
    
    METHOD_TYPES = (
        ('standard', 'Standard Shipping'),
        ('express', 'Express Shipping'),
        ('next_day', 'Next Day Delivery'),
        ('same_day', 'Same Day Delivery'),
        ('pickup', 'Local Pickup'),
        ('freight', 'Freight Shipping'),
    )
    
    name = models.CharField(max_length=100)
    method_type = models.CharField(max_length=20, choices=METHOD_TYPES)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    
    # Estimated delivery time range in days
    min_delivery_time = models.PositiveIntegerField(
        help_text="Minimum delivery time in days",
        default=1
    )
    max_delivery_time = models.PositiveIntegerField(
        help_text="Maximum delivery time in days",
        default=3
    )
    
    # Handling time (processing time before shipping)
    handling_time = models.PositiveIntegerField(
        help_text="Handling/processing time in days",
        default=1
    )
    
    # Whether this method requires signature
    requires_signature = models.BooleanField(default=False)
    
    # Whether this method includes tracking
    includes_tracking = models.BooleanField(default=True)
    
    # Whether this method is available for international shipping
    international_shipping = models.BooleanField(default=False)
    
    # Restrictions
    max_weight = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Maximum weight in kg"
    )
    max_dimensions = models.JSONField(
        help_text="Maximum dimensions (L x W x H) in cm",
        null=True,
        blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.get_method_type_display()})"


class ShippingRate(models.Model):
    """Model for shipping rates based on zones and methods."""
    
    RATE_TYPES = (
        ('flat', 'Flat Rate'),
        ('weight', 'Weight Based'),
        ('price', 'Order Total Based'),
        ('item', 'Per Item'),
        ('dimension', 'Dimensional Weight'),
        ('combined', 'Combined Factors'),
    )
    
    zone = models.ForeignKey(
        ShippingZone,
        on_delete=models.CASCADE,
        related_name='rates'
    )
    method = models.ForeignKey(
        ShippingMethod,
        on_delete=models.CASCADE,
        related_name='rates'
    )
    rate_type = models.CharField(max_length=20, choices=RATE_TYPES)
    is_active = models.BooleanField(default=True)
    
    # Base rate (minimum shipping cost)
    base_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Base shipping rate"
    )
    
    # Additional rate factors
    per_kg_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Additional rate per kg"
    )
    per_item_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Additional rate per item"
    )
    
    # Free shipping threshold
    free_shipping_threshold = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Order total above which shipping is free"
    )
    
    # Rate conditions and rules stored as JSON
    conditions = models.JSONField(
        default=dict,
        blank=True,
        help_text="Conditions for applying this rate (e.g., weight ranges, price ranges)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['zone', 'method', '-created_at']
        unique_together = ['zone', 'method', 'rate_type']
    
    def __str__(self):
        return f"{self.zone.name} - {self.method.name} ({self.get_rate_type_display()})"
    
    def calculate_shipping_cost(self, order_total, weight=None, items_count=None, dimensions=None):
        """Calculate shipping cost based on various factors."""
        cost = self.base_rate
        
        if self.rate_type == 'flat':
            return cost
        
        if self.rate_type == 'weight' and weight:
            cost += self.per_kg_rate * weight
        
        if self.rate_type == 'item' and items_count:
            cost += self.per_item_rate * items_count
        
        if self.rate_type == 'price':
            # Apply any price-based rules from conditions
            price_rules = self.conditions.get('price_rules', [])
            for rule in price_rules:
                if rule['min'] <= order_total <= rule['max']:
                    cost = rule['rate']
                    break
        
        if self.rate_type == 'dimension' and dimensions:
            # Calculate dimensional weight and apply rate
            dim_weight = (dimensions['length'] * dimensions['width'] * dimensions['height']) / 5000
            cost += self.per_kg_rate * dim_weight
        
        # Check for free shipping threshold
        if self.free_shipping_threshold and order_total >= self.free_shipping_threshold:
            return 0
        
        return cost
