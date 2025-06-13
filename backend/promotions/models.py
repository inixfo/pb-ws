from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()


class PromoCode(models.Model):
    """Model for promotional codes and discounts."""
    
    DISCOUNT_TYPE_CHOICES = (
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
    )
    
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    discount_type = models.CharField(max_length=10, choices=DISCOUNT_TYPE_CHOICES, default='percentage')
    discount_value = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(0)]
    )
    
    # Optional minimum purchase amount
    min_purchase_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(0)],
        default=0
    )
    
    # Optional maximum discount amount (for percentage discounts)
    max_discount_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(0)],
        blank=True, 
        null=True
    )
    
    # Validity period
    valid_from = models.DateTimeField(default=timezone.now)
    valid_until = models.DateTimeField(blank=True, null=True)
    
    # Usage limits
    usage_limit = models.PositiveIntegerField(default=0, help_text="0 means unlimited")
    usage_count = models.PositiveIntegerField(default=0, editable=False)
    
    # User restrictions
    is_one_time_use = models.BooleanField(default=False, help_text="Can be used only once per user")
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Promo Code"
        verbose_name_plural = "Promo Codes"
        ordering = ['-created_at']
    
    def __str__(self):
        return self.code
    
    @property
    def is_expired(self):
        """Check if the promo code has expired."""
        if not self.valid_until:
            return False
        return timezone.now() > self.valid_until
    
    @property
    def is_valid(self):
        """Check if the promo code is valid (active and not expired)."""
        if not self.is_active:
            return False
        if self.is_expired:
            return False
        if self.usage_limit > 0 and self.usage_count >= self.usage_limit:
            return False
        return True
    
    def calculate_discount(self, cart_total):
        """Calculate the discount amount based on cart total."""
        if not self.is_valid:
            return 0
        
        if cart_total < self.min_purchase_amount:
            return 0
        
        if self.discount_type == 'percentage':
            discount = cart_total * (self.discount_value / 100)
            if self.max_discount_amount is not None:
                discount = min(discount, self.max_discount_amount)
        else:  # fixed amount
            discount = min(self.discount_value, cart_total)
        
        return discount
    
    def use(self):
        """Mark the promo code as used once."""
        self.usage_count += 1
        self.save(update_fields=['usage_count'])


class PromoCodeUsage(models.Model):
    """Model to track promo code usage by users."""
    
    promo_code = models.ForeignKey(PromoCode, on_delete=models.CASCADE, related_name='usages')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='promo_code_usages')
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='promo_code_usages', null=True, blank=True)
    used_at = models.DateTimeField(auto_now_add=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        verbose_name = "Promo Code Usage"
        verbose_name_plural = "Promo Code Usages"
        unique_together = ['promo_code', 'user', 'order']
    
    def __str__(self):
        return f"{self.user.email} used {self.promo_code.code} on {self.used_at}"


class HeaderPromoBanner(models.Model):
    """Model for the promotional banner in the header."""
    title = models.CharField(max_length=50, help_text="The main text of the banner, e.g., 'Super Sale 20%'")
    subtitle = models.CharField(max_length=100, help_text="The subtitle of the banner, e.g., 'Only this month'")
    icon = models.ImageField(upload_to='promotions/icons/', help_text="Icon to display in the banner", null=True, blank=True)
    bg_color = models.CharField(max_length=50, default="#333d4cb2", help_text="Background color for the icon circle")
    is_active = models.BooleanField(default=True)
    priority = models.PositiveIntegerField(default=1, help_text="Priority order (lowest number shows first)")
    
    class Meta:
        verbose_name = "Header Promo Banner"
        verbose_name_plural = "Header Promo Banners"
        ordering = ['priority']
    
    def __str__(self):
        return self.title


class HeroSlide(models.Model):
    """Model for hero slider slides."""
    title = models.CharField(max_length=100)
    subtitle = models.CharField(max_length=200)
    image = models.ImageField(upload_to='promotions/hero/')
    bg_color = models.CharField(max_length=50, default="bg-blue-100", help_text="Background color class")
    button_text = models.CharField(max_length=50, default="Shop now")
    button_link = models.CharField(max_length=200, default="#")
    is_active = models.BooleanField(default=True)
    priority = models.PositiveIntegerField(default=1, help_text="Priority order (lowest number shows first)")
    
    class Meta:
        verbose_name = "Hero Slide"
        verbose_name_plural = "Hero Slides"
        ordering = ['priority']
    
    def __str__(self):
        return self.title


class NewArrivalsBanner(models.Model):
    """Model for the New Arrivals featured banner."""
    title = models.CharField(max_length=100, default="MacBook")
    subtitle = models.CharField(max_length=200, default="Be Pro Anywhere")
    image = models.ImageField(upload_to='promotions/new_arrivals/')
    bg_image = models.ImageField(upload_to='promotions/backgrounds/', null=True, blank=True)
    price_text = models.CharField(max_length=50, default="From ৳1,199")
    button_link = models.CharField(max_length=200, default="#")
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "New Arrivals Banner"
        verbose_name_plural = "New Arrivals Banners"
    
    def __str__(self):
        return self.title


class SaleBanner(models.Model):
    """Model for the sale banner on the homepage."""
    percentage = models.PositiveIntegerField(default=20, validators=[MaxValueValidator(100)])
    title = models.CharField(max_length=100, default="Seasonal weekly sale 2024")
    subtitle = models.CharField(max_length=200, default="Use code")
    promo_code = models.CharField(max_length=50, default="Sale 2024")
    image = models.ImageField(upload_to='promotions/sales/')
    bg_color_start = models.CharField(max_length=50, default="rgb(172, 203, 238)")
    bg_color_end = models.CharField(max_length=50, default="rgb(231, 240, 253)")
    dark_bg_color_start = models.CharField(max_length=50, default="rgb(27, 39, 58)")
    dark_bg_color_end = models.CharField(max_length=50, default="rgb(31, 38, 50)")
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Sale Banner"
        verbose_name_plural = "Sale Banners"
    
    def __str__(self):
        return f"{self.percentage}% OFF - {self.title}"


class CatalogTopBanner(models.Model):
    """Model for the top promotional banner in the catalog page."""
    title = models.CharField(max_length=100, default="iPhone 14")
    subtitle = models.CharField(max_length=200, default="Apple iPhone 14 128GB Blue")
    image = models.ImageField(upload_to='promotions/catalog/')
    price_text = models.CharField(max_length=50, default="From ৳899")
    button_link = models.CharField(max_length=200, default="#")
    bg_color_start = models.CharField(max_length=50, default="rgb(172, 203, 238)")
    bg_color_end = models.CharField(max_length=50, default="rgb(231, 240, 253)")
    is_active = models.BooleanField(default=True)
    priority = models.PositiveIntegerField(default=1, help_text="Priority order (lowest number shows first)")
    
    class Meta:
        verbose_name = "Catalog Top Banner"
        verbose_name_plural = "Catalog Top Banners"
        ordering = ['priority']
    
    def __str__(self):
        return self.title


class CatalogBottomBanner(models.Model):
    """Model for the bottom promotional banner in the catalog page."""
    title = models.CharField(max_length=100, default="iPad Pro M1")
    subtitle = models.CharField(max_length=200, default="Deal of the week")
    image = models.ImageField(upload_to='promotions/catalog/')
    brand_icon = models.ImageField(upload_to='promotions/icons/', null=True, blank=True)
    button_text = models.CharField(max_length=50, default="Shop now")
    button_link = models.CharField(max_length=200, default="#")
    bg_color_start = models.CharField(max_length=50, default="rgb(253, 203, 241)")
    bg_color_end = models.CharField(max_length=50, default="rgb(255, 236, 250)")
    is_active = models.BooleanField(default=True)
    priority = models.PositiveIntegerField(default=1, help_text="Priority order (lowest number shows first)")
    
    class Meta:
        verbose_name = "Catalog Bottom Banner"
        verbose_name_plural = "Catalog Bottom Banners"
        ordering = ['priority']
    
    def __str__(self):
        return self.title
