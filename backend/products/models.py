from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid
import os
import json
import random
import string
from django.conf import settings
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile

User = get_user_model()


def product_image_path(instance, filename):
    """Generate file path for product images."""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('product_images', str(instance.product.id), filename)


def generate_sku():
    """Generate a random SKU code."""
    # Format: PB-XXXX-YYYY where X is letter and Y is number
    letters = ''.join(random.choices(string.ascii_uppercase, k=4))
    numbers = ''.join(random.choices(string.digits, k=4))
    return f"PB-{letters}-{numbers}"


class Category(models.Model):
    """Product category model."""
    
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, blank=True, null=True, related_name='children')
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='category_images/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Brand(models.Model):
    """Product brand model."""
    
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    logo = models.ImageField(upload_to='brand_logos/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class ProductField(models.Model):
    """Dynamic product field model for category-specific specifications."""
    
    FIELD_TYPE_CHOICES = (
        ('text', 'Text'),
        ('number', 'Number'),
        ('boolean', 'Boolean'),
        ('select', 'Select'),
        ('multi_select', 'Multiple Select'),
    )
    
    FIELD_GROUP_CHOICES = (
        ('general', 'General'),
        ('specifications', 'Specifications'),
        ('dimensions', 'Dimensions'),
        ('display', 'Display'),
        ('features', 'Features'),
        ('connectivity', 'Connectivity'),
        ('hardware', 'Hardware'),
        ('camera', 'Camera'),
        ('sensors', 'Sensors'),
        ('box', 'Box Contents'),
        ('compartments', 'Compartments'),
        ('convenience', 'Convenience'),
        ('pricing', 'Pricing Factors'),  # New group for price-affecting fields
        ('other', 'Other'),
    )
    
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='fields')
    name = models.CharField(max_length=100)
    field_type = models.CharField(max_length=20, choices=FIELD_TYPE_CHOICES)
    group = models.CharField(max_length=20, choices=FIELD_GROUP_CHOICES, default='other')
    options = models.JSONField(blank=True, null=True, help_text="Options for select fields as JSON array")
    is_required = models.BooleanField(default=False)
    is_filter = models.BooleanField(default=False, help_text="Whether this field can be used as a filter")
    affects_price = models.BooleanField(default=False, help_text="Whether this field affects the product price")
    price_modifier_key = models.CharField(max_length=100, blank=True, null=True, 
                                        help_text="Key to use for price modifiers (e.g., 'storage_capacity', 'screen_size')")
    display_order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['category', 'group', 'display_order', 'name']
        unique_together = ['category', 'name']
    
    def __str__(self):
        return f"{self.category.name} - {self.name}"
    
    def save(self, *args, **kwargs):
        # Auto-generate price_modifier_key if not provided
        if self.affects_price and not self.price_modifier_key:
            # Convert field name to snake_case
            self.price_modifier_key = self.name.lower().replace(' ', '_')
        super().save(*args, **kwargs)


class SKU(models.Model):
    """Stock Keeping Unit model."""
    
    code = models.CharField(max_length=20, unique=True)
    product = models.ForeignKey('Product', on_delete=models.CASCADE, related_name='skus')
    attributes = models.JSONField(default=dict, blank=True, help_text="Product variant attributes (color, size, etc.)")
    price_adjustment = models.DecimalField(max_digits=10, decimal_places=2, default=0, 
                                          help_text="Price adjustment for this variant")
    stock_quantity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "SKU"
        verbose_name_plural = "SKUs"
        ordering = ['product', 'code']
    
    def __str__(self):
        return self.code
    
    def save(self, *args, **kwargs):
        # Generate SKU code if not provided
        if not self.code:
            self.code = generate_sku()
            
            # Ensure uniqueness
            while SKU.objects.filter(code=self.code).exists():
                self.code = generate_sku()
                
        super().save(*args, **kwargs)


class PriceModifier(models.Model):
    """Model for category-specific price modifiers."""
    
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='price_modifiers')
    name = models.CharField(max_length=100)  # e.g., "Storage Capacity", "Screen Size"
    specification_key = models.CharField(max_length=100)  # e.g., "storage_capacity", "screen_size"
    specification_value = models.CharField(max_length=100)  # e.g., "256GB", "55inch"
    modifier_type = models.CharField(
        max_length=20,
        choices=[
            ('fixed', 'Fixed Amount'),
            ('percentage', 'Percentage'),
            ('multiplier', 'Multiplier')
        ],
        default='fixed'
    )
    value = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Amount to add/subtract (fixed), percentage to adjust, or multiplier"
    )
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['category', 'name', 'specification_value']
        unique_together = ['category', 'specification_key', 'specification_value']
        
    def __str__(self):
        return f"{self.category.name} - {self.name}: {self.specification_value}"
    
    def apply_modifier(self, base_price):
        """Apply this modifier to a base price."""
        if not self.is_active:
            return base_price
            
        if self.modifier_type == 'fixed':
            return base_price + self.value
        elif self.modifier_type == 'percentage':
            return base_price + (base_price * self.value / 100)
        elif self.modifier_type == 'multiplier':
            return base_price * self.value
        return base_price


class ProductVariation(models.Model):
    """Model for product variations with specific prices."""
    
    product = models.ForeignKey(
        'Product',
        on_delete=models.CASCADE,  # Delete variation when product is deleted
        related_name='variations'
    )
    name = models.CharField(max_length=255, help_text="Variation name (e.g. '8GB+128GB', '55-inch QLED')")
    price = models.DecimalField(max_digits=12, decimal_places=2)
    stock_quantity = models.PositiveIntegerField(default=0)
    sku = models.CharField(max_length=20, unique=True, blank=True, null=True)
    is_default = models.BooleanField(default=False, help_text="Whether this is the default variation")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['product', '-is_default', 'price']
        unique_together = ['product', 'name']
    
    def __str__(self):
        return f"{self.product.name} - {self.name}"
    
    def save(self, *args, **kwargs):
        # Generate SKU if not provided
        if not self.sku:
            self.sku = generate_sku()
            while ProductVariation.objects.filter(sku=self.sku).exists():
                self.sku = generate_sku()
        
        # If this is marked as default, unmark other variations
        if self.is_default:
            ProductVariation.objects.filter(
                product=self.product, 
                is_default=True
            ).exclude(id=self.id).update(is_default=False)
            
        super().save(*args, **kwargs)


class Product(models.Model):
    """Product model."""
    
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='products')
    description = models.TextField()
    base_price = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        help_text="Base price for the product. If variations exist, this will be the minimum price."
    )
    sale_price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    
    # SKU (Stock Keeping Unit)
    default_sku = models.CharField(max_length=20, blank=True, null=True, unique=True, 
                                  help_text="Main SKU for the product. If not provided, one will be generated.")
    
    # EMI options
    emi_available = models.BooleanField(default=False)
    emi_plans = models.ManyToManyField('emi.EMIPlan', blank=True, related_name='products')
    
    # Stock and availability
    stock_quantity = models.PositiveIntegerField(default=0)
    is_available = models.BooleanField(default=True)
    
    # Vendor and approval
    vendor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products', limit_choices_to={'role': 'vendor'})
    is_approved = models.BooleanField(default=False)
    
    # Dynamic specifications stored as JSON
    specifications = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # New fields for promotional product types
    is_trending = models.BooleanField(default=False)
    is_special_offer = models.BooleanField(default=False)
    is_best_seller = models.BooleanField(default=False)
    is_todays_deal = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    def delete(self, *args, **kwargs):
        """Override delete to prevent deletion if product has orders."""
        from orders.models import OrderItem
        
        # Check if product has any orders
        if OrderItem.objects.filter(product=self).exists():
            raise models.ProtectedError(
                "Cannot delete product because it has orders. Consider marking it as unavailable instead.",
                self
            )
        
        # If no orders, proceed with deletion
        super().delete(*args, **kwargs)
    
    def save(self, *args, **kwargs):
        # Generate default SKU if not provided
        if not self.default_sku:
            self.default_sku = generate_sku()
            while Product.objects.filter(default_sku=self.default_sku).exists():
                self.default_sku = generate_sku()
        
        super().save(*args, **kwargs)
    
    @property
    def price(self):
        """Get the current price - either from default variation or base price."""
        default_variation = self.variations.filter(is_default=True, is_active=True).first()
        if default_variation:
            return default_variation.price
        return self.base_price
    
    @property
    def has_variations(self):
        """Check if the product has any active variations."""
        return self.variations.filter(is_active=True).exists()
    
    @property
    def available_variations(self):
        """Get all active variations."""
        return self.variations.filter(is_active=True)
    
    @property
    def min_price(self):
        """Get the minimum price among all variations or base price."""
        min_variation_price = self.variations.filter(is_active=True).order_by('price').values_list('price', flat=True).first()
        return min_variation_price if min_variation_price else self.base_price
    
    @property
    def max_price(self):
        """Get the maximum price among all variations or base price."""
        max_variation_price = self.variations.filter(is_active=True).order_by('-price').values_list('price', flat=True).first()
        return max_variation_price if max_variation_price else self.base_price
    
    @property
    def average_rating(self):
        """Calculate the average rating for this product."""
        from reviews.models import Review
        reviews = Review.objects.filter(product=self, status='approved')
        if reviews:
            return sum(review.rating for review in reviews) / len(reviews)
        return 0
    
    @average_rating.setter
    def average_rating(self, value):
        """Setter to allow annotations with the same name as the property"""
        # This is just a dummy setter to prevent the error when Django tries to set this attribute
        # from an annotation. We don't actually store this value.
        pass
    
    @property
    def total_reviews(self):
        """Get the total number of reviews for this product."""
        from reviews.models import Review
        return Review.objects.filter(product=self, status='approved').count()
    
    @total_reviews.setter
    def total_reviews(self, value):
        """Setter to allow annotations with the same name as the property"""
        # This is just a dummy setter to prevent the error when Django tries to set this attribute
        # from an annotation. We don't actually store this value.
        pass
    
    def get_specification(self, field_name):
        """Get a specific specification value by field name."""
        return self.specifications.get(field_name)
    
    def calculate_final_price(self):
        """Calculate final price based on specifications."""
        final_price = self.base_price
        
        if not self.specifications:
            return final_price
            
        # Get all active price modifiers for this category
        modifiers = PriceModifier.objects.filter(
            category=self.category,
            is_active=True
        )
        
        # Apply modifiers based on specifications
        for modifier in modifiers:
            spec_value = self.specifications.get(modifier.specification_key)
            if spec_value and str(spec_value) == str(modifier.specification_value):
                final_price = modifier.apply_modifier(final_price)
        
        return final_price


class ProductImage(models.Model):
    """Product image model."""
    
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,  # Delete image when product is deleted
        related_name='images'
    )
    image = models.ImageField(upload_to=product_image_path)
    alt_text = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)
    
    # Thumbnail versions for responsive images
    thumbnail_small = models.ImageField(upload_to=product_image_path, blank=True, null=True)
    thumbnail_medium = models.ImageField(upload_to=product_image_path, blank=True, null=True)
    
    class Meta:
        ordering = ['display_order']
    
    def __str__(self):
        return f"Image for {self.product.name}"
    
    def save(self, *args, **kwargs):
        # If this image is being set as primary, unset any other primary image
        if self.is_primary:
            ProductImage.objects.filter(product=self.product, is_primary=True).update(is_primary=False)
        
        # Generate responsive image versions if this is a new image
        if self.pk is None and self.image:
            self.create_thumbnails()
            
        super().save(*args, **kwargs)
    
    def create_thumbnails(self):
        """Create compressed and resized versions of the image"""
        if not self.image:
            return
            
        # Open the original image
        img = Image.open(self.image)
        img_format = img.format  # Store original format (JPEG, PNG, etc.)
        
        # Create small thumbnail (300px width)
        small_size = (300, 0)  # 0 height means maintain aspect ratio
        small_img = self.resize_and_compress(img, small_size, img_format)
        small_name = f"small_{os.path.basename(self.image.name)}"
        self.thumbnail_small.save(small_name, small_img, save=False)
        
        # Create medium thumbnail (600px width)
        medium_size = (600, 0)  # 0 height means maintain aspect ratio
        medium_img = self.resize_and_compress(img, medium_size, img_format)
        medium_name = f"medium_{os.path.basename(self.image.name)}"
        self.thumbnail_medium.save(medium_name, medium_img, save=False)
        
        # Compress the original image if it's too large (> 1MB)
        if self.image.size > 1024 * 1024:
            # Maintain original size but compress
            original_size = img.size
            compressed_img = self.resize_and_compress(img, original_size, img_format, quality=85)
            # Replace the original image with the compressed version
            self.image.save(self.image.name, compressed_img, save=False)
    
    def resize_and_compress(self, img, size, img_format, quality=90):
        """Resize and compress an image"""
        # Make a copy to avoid modifying the original
        img_copy = img.copy()
        
        # Calculate new height to maintain aspect ratio if height is 0
        if size[1] == 0:
            width_percent = size[0] / float(img_copy.size[0])
            new_height = int(float(img_copy.size[1]) * float(width_percent))
            size = (size[0], new_height)
            
        # Resize the image
        img_copy = img_copy.resize(size, Image.LANCZOS)
        
        # Save to BytesIO buffer
        buffer = BytesIO()
        
        # Convert to RGB if RGBA (remove alpha channel for JPEG)
        if img_copy.mode == 'RGBA' and img_format == 'JPEG':
            img_copy = img_copy.convert('RGB')
            
        # Save with appropriate format and compression
        if img_format == 'JPEG':
            img_copy.save(buffer, format='JPEG', quality=quality, optimize=True)
        elif img_format == 'PNG':
            img_copy.save(buffer, format='PNG', optimize=True)
        else:
            # Default to JPEG for other formats
            if img_copy.mode == 'RGBA':
                img_copy = img_copy.convert('RGB')
            img_copy.save(buffer, format='JPEG', quality=quality, optimize=True)
            
        buffer.seek(0)
        return ContentFile(buffer.read())
    
    def delete(self, *args, **kwargs):
        # Delete the actual image files when the model instance is deleted
        if self.image:
            storage = self.image.storage
            if storage.exists(self.image.name):
                storage.delete(self.image.name)
                
        if self.thumbnail_small:
            storage = self.thumbnail_small.storage
            if storage.exists(self.thumbnail_small.name):
                storage.delete(self.thumbnail_small.name)
                
        if self.thumbnail_medium:
            storage = self.thumbnail_medium.storage
            if storage.exists(self.thumbnail_medium.name):
                storage.delete(self.thumbnail_medium.name)
                
        super().delete(*args, **kwargs)
