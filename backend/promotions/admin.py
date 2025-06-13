from django.contrib import admin
from .models import (
    PromoCode, PromoCodeUsage, HeaderPromoBanner, HeroSlide, 
    NewArrivalsBanner, SaleBanner, CatalogTopBanner, CatalogBottomBanner
)


@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_type', 'discount_value', 'is_active', 'is_valid', 'valid_until', 'usage_count', 'usage_limit')
    list_filter = ('is_active', 'discount_type', 'created_at')
    search_fields = ('code', 'description')
    readonly_fields = ('usage_count', 'created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('code', 'description', 'is_active')
        }),
        ('Discount Details', {
            'fields': ('discount_type', 'discount_value', 'min_purchase_amount', 'max_discount_amount')
        }),
        ('Validity', {
            'fields': ('valid_from', 'valid_until')
        }),
        ('Usage', {
            'fields': ('usage_limit', 'usage_count', 'is_one_time_use')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PromoCodeUsage)
class PromoCodeUsageAdmin(admin.ModelAdmin):
    list_display = ('promo_code', 'user', 'order', 'used_at', 'discount_amount')
    list_filter = ('used_at',)
    search_fields = ('promo_code__code', 'user__email')
    readonly_fields = ('used_at',)


@admin.register(HeaderPromoBanner)
class HeaderPromoBannerAdmin(admin.ModelAdmin):
    list_display = ('title', 'subtitle', 'is_active', 'priority')
    list_filter = ('is_active',)
    search_fields = ('title', 'subtitle')


@admin.register(HeroSlide)
class HeroSlideAdmin(admin.ModelAdmin):
    list_display = ('title', 'subtitle', 'button_text', 'is_active', 'priority')
    list_filter = ('is_active',)
    search_fields = ('title', 'subtitle')


@admin.register(NewArrivalsBanner)
class NewArrivalsBannerAdmin(admin.ModelAdmin):
    list_display = ('title', 'subtitle', 'price_text', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('title', 'subtitle')


@admin.register(SaleBanner)
class SaleBannerAdmin(admin.ModelAdmin):
    list_display = ('title', 'percentage', 'promo_code', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('title', 'subtitle', 'promo_code')


@admin.register(CatalogTopBanner)
class CatalogTopBannerAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'priority')
    list_filter = ('is_active',)
    search_fields = ('title', 'subtitle')
    fieldsets = (
        (None, {
            'fields': ('title', 'subtitle', 'image', 'price_text', 'button_link')
        }),
        ('Appearance', {
            'fields': ('bg_color_start', 'bg_color_end')
        }),
        ('Status', {
            'fields': ('is_active', 'priority')
        }),
    )


@admin.register(CatalogBottomBanner)
class CatalogBottomBannerAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'priority')
    list_filter = ('is_active',)
    search_fields = ('title', 'subtitle')
    fieldsets = (
        (None, {
            'fields': ('title', 'subtitle', 'image', 'brand_icon')
        }),
        ('Button', {
            'fields': ('button_text', 'button_link')
        }),
        ('Appearance', {
            'fields': ('bg_color_start', 'bg_color_end')
        }),
        ('Status', {
            'fields': ('is_active', 'priority')
        }),
    )
