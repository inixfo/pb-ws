from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from products.models import Product, Category

User = get_user_model()


class PageView(models.Model):
    """Model for tracking page views."""
    
    PAGE_TYPES = (
        ('home', 'Home Page'),
        ('product', 'Product Detail'),
        ('category', 'Category Page'),
        ('search', 'Search Results'),
        ('cart', 'Shopping Cart'),
        ('checkout', 'Checkout Page'),
        ('account', 'User Account'),
        ('other', 'Other Page'),
    )
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='page_views')
    session_id = models.CharField(max_length=100, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    
    page_type = models.CharField(max_length=20, choices=PAGE_TYPES)
    page_url = models.URLField()
    referrer_url = models.URLField(blank=True, null=True)
    
    # For product and category pages
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Search query for search results
    search_query = models.CharField(max_length=255, blank=True, null=True)
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['page_type', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.get_page_type_display()} view at {self.timestamp}"


class ProductView(models.Model):
    """Model for tracking product views (more detailed than PageView)."""
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='product_views')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='product_views')
    session_id = models.CharField(max_length=100, db_index=True)
    
    # View details
    view_duration = models.PositiveIntegerField(default=0, help_text="Time spent viewing in seconds")
    source = models.CharField(max_length=50, blank=True, null=True, help_text="Where the user came from")
    
    # Device info
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    device_type = models.CharField(max_length=20, blank=True, null=True)
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['product', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.product.name} viewed at {self.timestamp}"


class SearchQuery(models.Model):
    """Model for tracking search queries."""
    
    query = models.CharField(max_length=255)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='search_queries')
    session_id = models.CharField(max_length=100, db_index=True)
    
    # Search results
    results_count = models.PositiveIntegerField(default=0)
    category_filter = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    price_filter_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_filter_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # User interaction
    clicked_product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name='search_clicks')
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        verbose_name_plural = "Search queries"
        indexes = [
            models.Index(fields=['query', 'timestamp']),
        ]
    
    def __str__(self):
        return f"Search for '{self.query}' at {self.timestamp}"


class CartEvent(models.Model):
    """Model for tracking cart events."""
    
    EVENT_TYPES = (
        ('add', 'Add to Cart'),
        ('remove', 'Remove from Cart'),
        ('update', 'Update Quantity'),
        ('abandon', 'Cart Abandoned'),
        ('checkout', 'Proceed to Checkout'),
    )
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='cart_events')
    session_id = models.CharField(max_length=100, db_index=True)
    
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='cart_events')
    quantity = models.PositiveIntegerField(default=1)
    
    # Cart state
    cart_total = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cart_items_count = models.PositiveIntegerField(default=0)
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['event_type', 'timestamp']),
            models.Index(fields=['product', 'event_type']),
        ]
    
    def __str__(self):
        return f"{self.get_event_type_display()} for {self.product.name} at {self.timestamp}"


class SalesMetric(models.Model):
    """Model for aggregated sales metrics."""
    
    PERIOD_TYPES = (
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    )
    
    # Time period
    period_type = models.CharField(max_length=10, choices=PERIOD_TYPES)
    period_start = models.DateField()
    period_end = models.DateField()
    
    # Optional filters
    category = models.ForeignKey(Category, on_delete=models.CASCADE, null=True, blank=True)
    vendor = models.ForeignKey('vendors.VendorProfile', on_delete=models.CASCADE, null=True, blank=True, related_name='sales_metrics')
    
    # Metrics
    total_sales = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_orders = models.PositiveIntegerField(default=0)
    average_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Product metrics
    total_products_sold = models.PositiveIntegerField(default=0)
    top_selling_product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name='top_selling_metrics')
    
    # Customer metrics
    new_customers = models.PositiveIntegerField(default=0)
    returning_customers = models.PositiveIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('period_type', 'period_start', 'category', 'vendor')
        indexes = [
            models.Index(fields=['period_type', 'period_start']),
        ]
    
    def __str__(self):
        base = f"{self.get_period_type_display()} metrics for {self.period_start}"
        if self.category:
            return f"{base} - Category: {self.category.name}"
        elif self.vendor:
            return f"{base} - Vendor: {self.vendor.company_name}"
        return base
