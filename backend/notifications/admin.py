from django.contrib import admin
from django.utils.html import format_html
from django.urls import path
from django.http import JsonResponse
from .models import Notification, NotificationTemplate, NotificationEvent, SMSProvider
from .services import SMSService


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin interface for notifications."""
    list_display = ['id', 'type', 'recipient', 'subject', 'status', 'user', 'sent_at', 'created_at']
    list_filter = ['type', 'status', 'created_at', 'sent_at']
    search_fields = ['recipient', 'subject', 'body', 'user__email']
    readonly_fields = ['sent_at', 'delivered_at', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Notification Details', {
            'fields': ('type', 'template', 'subject', 'body', 'recipient', 'status')
        }),
        ('Related Objects', {
            'fields': ('user', 'content_type', 'object_id')
        }),
        ('Tracking', {
            'fields': ('sent_at', 'delivered_at', 'error_message', 'provider_message_id')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    """Admin interface for notification templates."""
    list_display = ['name', 'type', 'subject', 'is_active', 'created_at']
    list_filter = ['type', 'is_active', 'created_at']
    search_fields = ['name', 'subject', 'body']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Template Details', {
            'fields': ('name', 'type', 'subject', 'is_active')
        }),
        ('Content', {
            'fields': ('body',),
            'description': 'Use {{variable}} syntax for placeholders (e.g., {{user.name}})'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(NotificationEvent)
class NotificationEventAdmin(admin.ModelAdmin):
    """Admin interface for notification events."""
    list_display = ['name', 'event_type', 'is_active', 'has_email', 'has_sms', 'has_push']
    list_filter = ['event_type', 'is_active', 'created_at']
    search_fields = ['name', 'event_type']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Event Details', {
            'fields': ('name', 'event_type', 'is_active')
        }),
        ('Templates', {
            'fields': ('email_template', 'sms_template', 'push_template')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def has_email(self, obj):
        """Check if event has email template."""
        return bool(obj.email_template)
    has_email.boolean = True
    has_email.short_description = 'Email'
    
    def has_sms(self, obj):
        """Check if event has SMS template."""
        return bool(obj.sms_template)
    has_sms.boolean = True
    has_sms.short_description = 'SMS'
    
    def has_push(self, obj):
        """Check if event has push template."""
        return bool(obj.push_template)
    has_push.boolean = True
    has_push.short_description = 'Push'


@admin.register(SMSProvider)
class SMSProviderAdmin(admin.ModelAdmin):
    """Admin interface for SMS providers."""
    list_display = ('name', 'provider_type', 'is_active', 'created_at', 'test_provider')
    list_filter = ('provider_type', 'is_active')
    search_fields = ('name', 'sid')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'provider_type', 'is_active')
        }),
        ('SSL Wireless Configuration', {
            'fields': ('api_token', 'sid', 'api_url'),
            'classes': ('collapse',),
            'description': 'For SSL Wireless, only the API token is required. SID and API URL are optional.'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:provider_id>/test/',
                self.admin_site.admin_view(self.test_provider_view),
                name='sms-provider-test',
            ),
        ]
        return custom_urls + urls
    
    def test_provider(self, obj):
        """Add a test button to the list view."""
        return format_html(
            '<a class="button" href="{}">Test Provider</a>',
            f'admin:sms-provider-test {obj.id}'
        )
    test_provider.short_description = 'Test Provider'
    
    def test_provider_view(self, request, provider_id):
        """Handle the test provider action."""
        try:
            result = SMSService.test_sms_provider(provider_id)
            return JsonResponse(result)
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            })
