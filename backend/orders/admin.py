from django.contrib import admin
from .models import Cart, CartItem, Order, OrderItem
from emi.models import EMIRecord


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'total_items', 'total_price', 'created_at', 'updated_at')
    search_fields = ('user__email',)
    inlines = [CartItemInline]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'price', 'has_emi')


class EMIRecordInline(admin.StackedInline):
    model = EMIRecord
    extra = 0
    readonly_fields = ('created_at', 'updated_at')
    fields = (
        'emi_plan', 'status', 'principal_amount', 
        'monthly_installment', 'total_payable', 'tenure_months',
        'down_payment_paid', 'installments_paid', 'amount_paid', 'remaining_amount',
        'start_date', 'expected_end_date', 'completed_date',
        'created_at', 'updated_at'
    )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'user', 'status', 'payment_status', 'total', 'has_emi', 'created_at')
    list_filter = ('status', 'payment_status', 'payment_method', 'has_emi', 'created_at')
    search_fields = ('order_id', 'user__email', 'shipping_phone')
    readonly_fields = ('order_id', 'created_at', 'updated_at')
    inlines = [OrderItemInline, EMIRecordInline]
    fieldsets = (
        (None, {
            'fields': ('order_id', 'user', 'status', 'payment_status', 'payment_method')
        }),
        ('Shipping Information', {
            'fields': ('shipping_address', 'shipping_city', 'shipping_state', 'shipping_postal_code', 'shipping_phone')
        }),
        ('Price Information', {
            'fields': ('subtotal', 'shipping_cost', 'tax', 'total')
        }),
        ('EMI Information', {
            'fields': ('has_emi',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
