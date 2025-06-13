from django.contrib import admin
from .models import SMSTemplate, SMSLog, PhoneVerification

@admin.register(SMSTemplate)
class SMSTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'is_active', 'created_at', 'updated_at')
    list_filter = ('type', 'is_active')
    search_fields = ('name', 'template_text')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(SMSLog)
class SMSLogAdmin(admin.ModelAdmin):
    list_display = ('phone_number', 'status', 'template', 'sent_at', 'delivered_at')
    list_filter = ('status', 'created_at')
    search_fields = ('phone_number', 'message', 'transaction_id')
    readonly_fields = ('created_at', 'sent_at', 'delivered_at')
    fieldsets = (
        (None, {
            'fields': ('phone_number', 'message', 'template', 'status')
        }),
        ('Transaction Details', {
            'fields': ('transaction_id', 'error_message')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'sent_at', 'delivered_at')
        }),
    )


@admin.register(PhoneVerification)
class PhoneVerificationAdmin(admin.ModelAdmin):
    list_display = ('phone_number', 'is_verified', 'is_expired', 'created_at')
    list_filter = ('is_verified', 'created_at')
    search_fields = ('phone_number',)
    readonly_fields = ('created_at', 'is_expired')
    fieldsets = (
        (None, {
            'fields': ('phone_number', 'verification_code', 'is_verified')
        }),
        ('Expiration', {
            'fields': ('expires_at', 'is_expired', 'created_at')
        }),
    )
