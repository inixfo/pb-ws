from rest_framework import serializers
from .models import PromoCode, PromoCodeUsage, HeaderPromoBanner, HeroSlide, NewArrivalsBanner, SaleBanner, CatalogTopBanner, CatalogBottomBanner


class PromoCodeSerializer(serializers.ModelSerializer):
    """Serializer for PromoCode model."""
    
    class Meta:
        model = PromoCode
        fields = [
            'id', 'code', 'description', 'discount_type', 'discount_value',
            'min_purchase_amount', 'max_discount_amount', 'valid_from', 'valid_until',
            'usage_limit', 'usage_count', 'is_one_time_use', 'is_active',
            'is_valid', 'is_expired', 'created_at', 'updated_at'
        ]
        read_only_fields = ['usage_count', 'is_valid', 'is_expired', 'created_at', 'updated_at']


class PromoCodeValidateSerializer(serializers.Serializer):
    """Serializer for validating a promo code."""
    
    code = serializers.CharField(max_length=50)
    cart_total = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    
    def validate_code(self, value):
        """Validate that the promo code exists and is active."""
        try:
            promo_code = PromoCode.objects.get(code=value, is_active=True)
        except PromoCode.DoesNotExist:
            raise serializers.ValidationError("Invalid promo code")
        
        if promo_code.is_expired:
            raise serializers.ValidationError("This promo code has expired")
        
        if promo_code.usage_limit > 0 and promo_code.usage_count >= promo_code.usage_limit:
            raise serializers.ValidationError("This promo code has reached its usage limit")
        
        return value


class PromoCodeApplySerializer(serializers.Serializer):
    """Serializer for applying a promo code to a cart."""
    
    code = serializers.CharField(max_length=50)
    
    def validate_code(self, value):
        """Validate that the promo code exists and is active."""
        try:
            promo_code = PromoCode.objects.get(code=value, is_active=True)
        except PromoCode.DoesNotExist:
            raise serializers.ValidationError("Invalid promo code")
        
        if promo_code.is_expired:
            raise serializers.ValidationError("This promo code has expired")
        
        if promo_code.usage_limit > 0 and promo_code.usage_count >= promo_code.usage_limit:
            raise serializers.ValidationError("This promo code has reached its usage limit")
        
        # Check if user has already used this one-time code
        user = self.context.get('request').user
        if user.is_authenticated and promo_code.is_one_time_use:
            if PromoCodeUsage.objects.filter(promo_code=promo_code, user=user).exists():
                raise serializers.ValidationError("You have already used this promo code")
        
        return value


class HeaderPromoBannerSerializer(serializers.ModelSerializer):
    """Serializer for header promotional banners."""
    
    class Meta:
        model = HeaderPromoBanner
        fields = ['id', 'title', 'subtitle', 'icon', 'bg_color', 'is_active', 'priority']


class HeroSlideSerializer(serializers.ModelSerializer):
    """Serializer for hero slider slides."""
    
    class Meta:
        model = HeroSlide
        fields = ['id', 'title', 'subtitle', 'image', 'bg_color', 'button_text', 'button_link', 'is_active', 'priority']


class NewArrivalsBannerSerializer(serializers.ModelSerializer):
    """Serializer for new arrivals banner."""
    
    class Meta:
        model = NewArrivalsBanner
        fields = ['id', 'title', 'subtitle', 'image', 'bg_image', 'price_text', 'button_link', 'is_active']


class SaleBannerSerializer(serializers.ModelSerializer):
    """Serializer for sale banner."""
    
    class Meta:
        model = SaleBanner
        fields = [
            'id', 'percentage', 'title', 'subtitle', 'promo_code', 'image',
            'bg_color_start', 'bg_color_end', 'dark_bg_color_start', 'dark_bg_color_end', 'is_active'
        ]


class CatalogTopBannerSerializer(serializers.ModelSerializer):
    """Serializer for catalog top banner."""
    
    class Meta:
        model = CatalogTopBanner
        fields = [
            'id', 'title', 'subtitle', 'image', 'price_text',
            'button_link', 'bg_color_start', 'bg_color_end', 'is_active', 'priority'
        ]


class CatalogBottomBannerSerializer(serializers.ModelSerializer):
    """Serializer for catalog bottom banner."""
    
    class Meta:
        model = CatalogBottomBanner
        fields = [
            'id', 'title', 'subtitle', 'image', 'brand_icon',
            'button_text', 'button_link',
            'bg_color_start', 'bg_color_end', 'is_active', 'priority'
        ] 