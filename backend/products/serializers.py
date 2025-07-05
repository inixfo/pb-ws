from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Category, Brand, ProductField, Product, ProductImage, SKU, ProductVariation
from users.serializers import UserSerializer
from django.conf import settings
import json
from reviews.models import Review
from reviews.serializers import ReviewSerializer
from django.utils.text import slugify
from emi.serializers import EMIPlanSerializer

User = get_user_model()


class ProductMinimalSerializer(serializers.ModelSerializer):
    """Minimal serializer for Product model (used in analytics, reviews, etc.)."""
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'price', 'sale_price', 'rating']


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model."""
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'parent', 'description', 'image']


class BrandSerializer(serializers.ModelSerializer):
    """Serializer for Brand model."""
    
    categories = serializers.SerializerMethodField()
    
    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug', 'description', 'logo', 'categories']
    
    def get_categories(self, obj):
        """Get the categories associated with this brand."""
        # Check if we should include categories based on query params
        request = self.context.get('request')
        if request and request.query_params.get('with_categories') == 'true':
            return CategorySerializer(obj.categories.all(), many=True, context=self.context).data
        return None


class ProductFieldSerializer(serializers.ModelSerializer):
    """Serializer for ProductField model."""
    
    class Meta:
        model = ProductField
        fields = [
            'id', 'category', 'name', 'field_type', 'group',
            'options', 'is_required', 'is_filter', 'display_order'
        ]


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for ProductImage model."""
    
    image = serializers.SerializerMethodField()
    thumbnail_small = serializers.SerializerMethodField()
    thumbnail_medium = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'thumbnail_small', 'thumbnail_medium', 'alt_text', 'is_primary', 'display_order']
    
    def get_image(self, obj):
        """Return absolute URL for image."""
        if not obj.image:
            return None
            
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.image.url)
        
        # Fallback to constructing URL manually
        domain = settings.ALLOWED_HOSTS[0] if settings.ALLOWED_HOSTS else 'localhost:8000'
        protocol = 'https' if not settings.DEBUG else 'http'
        return f"{protocol}://{domain}{obj.image.url}"
        
    def get_thumbnail_small(self, obj):
        """Return URL for small thumbnail (virtual field)."""
        if not obj.image:
            return None
            
        # Use the same URL but add query parameters for resizing
        image_url = self.get_image(obj)
        if image_url:
            return f"{image_url}?size=small&width=300"
        return None
        
    def get_thumbnail_medium(self, obj):
        """Return URL for medium thumbnail (virtual field)."""
        if not obj.image:
            return None
            
        # Use the same URL but add query parameters for resizing
        image_url = self.get_image(obj)
        if image_url:
            return f"{image_url}?size=medium&width=600"
        return None


class SKUSerializer(serializers.ModelSerializer):
    """Serializer for SKU model."""
    
    class Meta:
        model = SKU
        fields = ['id', 'code', 'attributes', 'price_adjustment', 'stock_quantity', 'is_active']


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model (used by admin panel and other generic views)."""
    
    category_name = serializers.SerializerMethodField()
    brand_name = serializers.SerializerMethodField()
    vendor_email = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category', 'category_name', 
            'brand', 'brand_name', 'vendor', 'vendor_email',
            'description', 'price', 'sale_price',
            'emi_available', 'emi_plans',
            'stock_quantity', 'is_available', 'is_approved',
            'primary_image', 'created_at', 'updated_at',
            'is_trending', 'is_special_offer', 'is_best_seller', 'is_todays_deal'
        ]
    
    def get_category_name(self, obj):
        return obj.category.name if obj.category else None
    
    def get_brand_name(self, obj):
        return obj.brand.name if obj.brand else None
    
    def get_vendor_email(self, obj):
        return obj.vendor.email if obj.vendor else None
    
    def get_primary_image(self, obj):
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(primary_image.image.url)
            
            # Fallback to constructing URL manually
            domain = settings.ALLOWED_HOSTS[0] if settings.ALLOWED_HOSTS else 'localhost:8000'
            protocol = 'https' if not settings.DEBUG else 'http'
            return f"{protocol}://{domain}{primary_image.image.url}"
        return None


class ProductListSerializer(serializers.ModelSerializer):
    """Serializer for Product model in list view."""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    primary_image = serializers.SerializerMethodField()
    average_rating = serializers.FloatField(read_only=True, default=0)
    review_count = serializers.IntegerField(read_only=True, default=0)
    price = serializers.SerializerMethodField()
    
    # --- NEW: EMI fields so that checkout can calculate EMI details correctly ---
    emi_available = serializers.BooleanField(read_only=True)
    emi_plans = EMIPlanSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category_name', 'brand_name', 'base_price', 
            'sale_price', 'price', 'primary_image', 'average_rating', 'review_count',
            'emi_available', 'emi_plans',
            'is_trending', 'is_special_offer', 'is_best_seller', 'is_todays_deal'
        ]
    
    def get_price(self, obj):
        """Get the current price - either from default variation or base price."""
        try:
            # Check if product has variations
            default_variation = obj.variations.filter(is_default=True, is_active=True).first()
            if default_variation:
                return float(default_variation.price)
            return float(obj.base_price)
        except Exception as e:
            print(f"Error getting price for product {obj.id}: {str(e)}")
            return float(obj.base_price)
    
    def get_primary_image(self, obj):
        """Get the primary image for a product."""
        try:
            primary_image = obj.images.filter(is_primary=True).first()
            if primary_image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(primary_image.image.url)
                return primary_image.image.url
            
            # If no primary image, try to get the first image
            first_image = obj.images.first()
            if first_image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(first_image.image.url)
                return first_image.image.url
            
            # Default placeholder image
            return '/static/images/product-placeholder.jpg'
        except Exception as e:
            print(f"Error getting primary image for product {obj.id}: {str(e)}")
            return '/static/images/product-placeholder.jpg'


class ProductVariationSerializer(serializers.ModelSerializer):
    """Serializer for ProductVariation model."""
    
    is_available = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductVariation
        fields = [
            'id', 'name', 'price', 'stock_quantity', 'sku',
            'is_default', 'is_active', 'is_available'
        ]
    
    def get_is_available(self, obj):
        return obj.is_active and obj.stock_quantity > 0


class ProductDetailSerializer(serializers.ModelSerializer):
    """Serializer for Product model in detail view."""
    
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    reviews = serializers.SerializerMethodField()
    skus = SKUSerializer(many=True, read_only=True)
    average_rating = serializers.FloatField(read_only=True, default=0)
    total_reviews = serializers.IntegerField(read_only=True, default=0)
    specifications_display = serializers.SerializerMethodField()
    variations = ProductVariationSerializer(many=True, read_only=True)
    price = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category', 'brand', 'description',
            'base_price', 'sale_price', 'price', 'default_sku', 'emi_available',
            'stock_quantity', 'is_available', 'specifications',
            'specifications_display', 'created_at', 'updated_at',
            'images', 'reviews', 'skus', 'average_rating', 'total_reviews',
            'is_trending', 'is_special_offer', 'is_best_seller', 'is_todays_deal',
            'variations'
        ]
    
    def get_price(self, obj):
        """Get the current price - either from default variation or base price."""
        try:
            # Check if product has variations
            default_variation = obj.variations.filter(is_default=True, is_active=True).first()
            if default_variation:
                return float(default_variation.price)
            return float(obj.base_price)
        except Exception as e:
            print(f"Error getting price for product {obj.id}: {str(e)}")
            return float(obj.base_price)
    
    def get_specifications_display(self, obj):
        """Get specifications with labels and metadata."""
        try:
            result = {}
            if not obj.category or not obj.specifications:
                return result
                
            # Get fields for this category
            fields = ProductField.objects.filter(category=obj.category)
            field_dict = {field.name: field for field in fields}
            
            # Group specs by field group
            for name, value in obj.specifications.items():
                if name in field_dict:
                    field = field_dict[name]
                    group = field.group
                    
                    if group not in result:
                        result[group] = []
                    
                    result[group].append({
                        'name': name,
                        'value': value,
                        'field_type': field.field_type,
                        'display_order': field.display_order
                    })
            
            # Sort each group by display_order
            for group in result:
                result[group] = sorted(result[group], key=lambda x: x.get('display_order', 0))
            
            return result
        except Exception as e:
            print(f"Error processing specifications for product {obj.id}: {str(e)}")
            return {}
    
    def get_reviews(self, obj):
        """Get approved reviews for the product."""
        try:
            from reviews.models import Review
            from reviews.serializers import ReviewSerializer
            
            reviews = Review.objects.filter(product=obj, status='approved')
            serializer = ReviewSerializer(reviews, many=True, context=self.context)
            return serializer.data
        except Exception as e:
            print(f"Error getting reviews for product {obj.id}: {str(e)}")
            return []


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating products."""
    
    images = ProductImageSerializer(many=True, required=False)
    skus = SKUSerializer(many=True, required=False)
    price = serializers.DecimalField(source='base_price', max_digits=12, decimal_places=2)
    
    # Handle potential field name mismatches from frontend
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    brand = serializers.PrimaryKeyRelatedField(queryset=Brand.objects.all())
    
    class Meta:
        model = Product
        fields = [
            'name', 'category', 'brand', 'description',
            'price', 'sale_price', 'default_sku',
            'emi_available', 'emi_plans',
            'stock_quantity', 'is_available',
            'specifications', 'images', 'skus',
            'is_trending', 'is_special_offer', 'is_best_seller', 'is_todays_deal'
        ]
    
    def validate_specifications(self, value):
        """Validate specifications against the category's fields."""
        category_id = self.initial_data.get('category')
        
        if not category_id:
            return value
        
        try:
            category = Category.objects.get(id=category_id)
        except Category.DoesNotExist:
            raise serializers.ValidationError("Invalid category")
        
        # Get all required fields for this category
        required_fields = ProductField.objects.filter(
            category=category,
            is_required=True
        ).values_list('name', flat=True)
        
        # Check if all required fields are provided
        for field_name in required_fields:
            if field_name not in value:
                raise serializers.ValidationError(f"Required field '{field_name}' is missing")
        
        # Validate field values against field types
        fields = ProductField.objects.filter(category=category)
        field_dict = {field.name: field for field in fields}
        
        for field_name, field_value in value.items():
            if field_name in field_dict:
                field = field_dict[field_name]
                
                # Type validation
                if field.field_type == 'boolean' and not isinstance(field_value, bool):
                    raise serializers.ValidationError(f"Field '{field_name}' must be a boolean")
                
                elif field.field_type == 'number' and not isinstance(field_value, (int, float)):
                    raise serializers.ValidationError(f"Field '{field_name}' must be a number")
                
                elif field.field_type == 'select' and field.options:
                    options = field.options
                    if isinstance(options, str):
                        try:
                            options = json.loads(options)
                        except:
                            options = []
                    
                    if field_value not in options:
                        raise serializers.ValidationError(f"Field '{field_name}' must be one of: {', '.join(options)}")
                
                elif field.field_type == 'multi_select' and field.options:
                    options = field.options
                    if isinstance(options, str):
                        try:
                            options = json.loads(options)
                        except:
                            options = []
                    
                    if not isinstance(field_value, list):
                        raise serializers.ValidationError(f"Field '{field_name}' must be a list")
                    
                    for value in field_value:
                        if value not in options:
                            raise serializers.ValidationError(f"All values in '{field_name}' must be from: {', '.join(options)}")
        
        return value
    
    def create(self, validated_data):
        """Create a new product with related objects."""
        images_data = validated_data.pop('images', [])
        skus_data = validated_data.pop('skus', [])
        
        # Extract emi_plans to set after product creation
        emi_plans = validated_data.pop('emi_plans', [])
        
        # Handle potential variations from the frontend
        request_data = self.context.get('request').data
        variations = request_data.get('variations')
        has_variations = request_data.get('has_variations') == 'true'
        
        # Create product without emi_plans initially
        product = Product.objects.create(**validated_data)
        
        # Set emi_plans if provided
        if emi_plans:
            product.emi_plans.set(emi_plans)
        
        # Create images
        for image_data in images_data:
            ProductImage.objects.create(product=product, **image_data)
        
        # Handle primary image if provided in form data
        primary_image = request_data.get('primary_image')
        if primary_image and not isinstance(primary_image, str):
            ProductImage.objects.create(
                product=product,
                image=primary_image,
                is_primary=True,
                alt_text=f"{product.name} - Primary Image"
            )
        
        # Handle additional images if provided in form data
        additional_images = request_data.getlist('additional_images')
        if additional_images:
            for img in additional_images:
                if not isinstance(img, str):  # Check if it's a file and not a string path
                    ProductImage.objects.create(
                        product=product,
                        image=img,
                        is_primary=False,
                        alt_text=f"{product.name} - Additional Image"
                    )
        
        # Create SKUs from skus_data (if provided)
        for sku_data in skus_data:
            SKU.objects.create(product=product, **sku_data)
        
        # Handle variations if they exist
        if has_variations and variations:
            try:
                # Variations might be a JSON string if from FormData
                if isinstance(variations, str):
                    variations_data = json.loads(variations)
                else:
                    variations_data = variations
                
                # First, create all variations
                for variation_data in variations_data:
                    # Create a ProductVariation for each variation
                    ProductVariation.objects.create(
                        product=product,
                        name=variation_data.get('name', ''),
                        price=float(variation_data.get('price', 0)),
                        stock_quantity=int(variation_data.get('stock_quantity', 0)),
                        sku=variation_data.get('sku'),
                        is_default=bool(variation_data.get('is_default', False)),
                        is_active=bool(variation_data.get('is_active', True))
                    )
                
                # Also create corresponding SKUs for compatibility
                for variation_data in variations_data:
                    # Create a SKU for each variation
                    variation_name = variation_data.get('name', '')
                    SKU.objects.create(
                        product=product,
                        code=variation_data.get('sku') or f"{product.slug}-{slugify(variation_name)}",
                        attributes={'variation_name': variation_name},
                        price_adjustment=float(variation_data.get('price', 0)) - product.base_price,
                        stock_quantity=int(variation_data.get('stock_quantity', 0)),
                        is_active=bool(variation_data.get('is_active', True))
                    )
            except Exception as e:
                print(f"Error creating variations: {e}")
                # Log detailed error for debugging
                import traceback
                traceback.print_exc()
        
        return product
    
    def update(self, instance, validated_data):
        """Update a product with related objects."""
        images_data = validated_data.pop('images', None)
        skus_data = validated_data.pop('skus', None)
        
        # Extract emi_plans to set after updating product
        emi_plans = validated_data.pop('emi_plans', None)
        
        # Handle potential variations from the frontend
        request_data = self.context.get('request').data
        variations = request_data.get('variations')
        has_variations = request_data.get('has_variations') == 'true'
        
        # Update product fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Set emi_plans if provided
        if emi_plans is not None:
            instance.emi_plans.set(emi_plans)
        
        # Handle primary image if provided in form data
        primary_image = request_data.get('primary_image')
        if primary_image and not isinstance(primary_image, str):
            # Delete existing primary images
            instance.images.filter(is_primary=True).delete()
            
            # Create new primary image
            ProductImage.objects.create(
                product=instance,
                image=primary_image,
                is_primary=True,
                alt_text=f"{instance.name} - Primary Image"
            )
        
        # Handle additional images if provided in form data
        additional_images = request_data.getlist('additional_images')
        if additional_images:
            # Only delete non-primary images if we're uploading new ones
            instance.images.filter(is_primary=False).delete()
            
            for img in additional_images:
                if not isinstance(img, str):  # Check if it's a file and not a string path
                    ProductImage.objects.create(
                        product=instance,
                        image=img,
                        is_primary=False,
                        alt_text=f"{instance.name} - Additional Image"
                    )
        
        # Update images if explicitly provided in the serializer
        if images_data is not None:
            # Clear existing images
            instance.images.all().delete()
            
            # Create new images
            for image_data in images_data:
                ProductImage.objects.create(product=instance, **image_data)
        
        # Update variations and SKUs
        if has_variations and variations:
            # Clear existing variations
            instance.variations.all().delete()
            
            # Clear existing SKUs
            instance.skus.all().delete()
            
            try:
                # Variations might be a JSON string if from FormData
                if isinstance(variations, str):
                    variations_data = json.loads(variations)
                else:
                    variations_data = variations
                
                # First, create all variations
                for variation_data in variations_data:
                    # Create a ProductVariation for each variation
                    ProductVariation.objects.create(
                        product=instance,
                        name=variation_data.get('name', ''),
                        price=float(variation_data.get('price', 0)),
                        stock_quantity=int(variation_data.get('stock_quantity', 0)),
                        sku=variation_data.get('sku'),
                        is_default=bool(variation_data.get('is_default', False)),
                        is_active=bool(variation_data.get('is_active', True))
                    )
                
                # Also create corresponding SKUs for compatibility
                for variation_data in variations_data:
                    # Create a SKU for each variation
                    variation_name = variation_data.get('name', '')
                    SKU.objects.create(
                        product=instance,
                        code=variation_data.get('sku') or f"{instance.slug}-{slugify(variation_name)}",
                        attributes={'variation_name': variation_name},
                        price_adjustment=float(variation_data.get('price', 0)) - instance.base_price,
                        stock_quantity=int(variation_data.get('stock_quantity', 0)),
                        is_active=bool(variation_data.get('is_active', True))
                    )
            except Exception as e:
                print(f"Error updating variations: {e}")
                # Log detailed error for debugging
                import traceback
                traceback.print_exc()
        elif skus_data is not None:
            # If specific SKUs are provided but no variations
            # Clear existing SKUs
            instance.skus.all().delete()
            
            # Create new SKUs
            for sku_data in skus_data:
                SKU.objects.create(product=instance, **sku_data)
        
        return instance 