from django.contrib import admin
from .models import Payment, Transaction

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['order', 'user', 'transaction_id', 'amount', 'payment_method', 'status']
    list_filter = ['payment_method', 'status']
    search_fields = ['transaction_id', 'order__id', 'user__email']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['user', 'transaction_type', 'amount', 'created_at']
    list_filter = ['transaction_type']
    search_fields = ['payment__transaction_id', 'user__email']
    readonly_fields = ['created_at']
