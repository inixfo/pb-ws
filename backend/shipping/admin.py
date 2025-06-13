from django.contrib import admin
from .models import ShippingZone, ShippingMethod, ShippingRate


@admin.register(ShippingZone)
class ShippingZoneAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'is_active')
        }),
        ('Coverage', {
            'fields': ('countries', 'states', 'cities', 'postal_codes'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(ShippingMethod)
class ShippingMethodAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'method_type', 'min_delivery_time', 'max_delivery_time',
        'is_active', 'international_shipping'
    )
    list_filter = (
        'is_active', 'method_type', 'international_shipping',
        'requires_signature', 'includes_tracking'
    )
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('name', 'method_type', 'description', 'is_active')
        }),
        ('Delivery Details', {
            'fields': (
                'min_delivery_time', 'max_delivery_time', 'handling_time',
                'requires_signature', 'includes_tracking', 'international_shipping'
            )
        }),
        ('Restrictions', {
            'fields': ('max_weight', 'max_dimensions'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(ShippingRate)
class ShippingRateAdmin(admin.ModelAdmin):
    list_display = (
        'zone', 'method', 'rate_type', 'base_rate',
        'is_active', 'free_shipping_threshold'
    )
    list_filter = ('is_active', 'rate_type', 'zone', 'method')
    search_fields = ('zone__name', 'method__name')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('zone', 'method', 'rate_type', 'is_active')
        }),
        ('Rates', {
            'fields': (
                'base_rate', 'per_kg_rate', 'per_item_rate',
                'free_shipping_threshold'
            )
        }),
        ('Advanced', {
            'fields': ('conditions',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
