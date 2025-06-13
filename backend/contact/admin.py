from django.contrib import admin
from .models import ContactInfo, ContactSubmission, Newsletter

@admin.register(ContactInfo)
class ContactInfoAdmin(admin.ModelAdmin):
    list_display = ('email', 'phone', 'is_active')
    list_filter = ('is_active',)
    fieldsets = (
        (None, {
            'fields': ('address', 'phone', 'email', 'support_hours')
        }),
        ('Social Media', {
            'fields': ('facebook_url', 'twitter_url', 'instagram_url', 'linkedin_url'),
            'classes': ('collapse',)
        }),
        ('Maps', {
            'fields': ('google_maps_embed',),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )


@admin.register(ContactSubmission)
class ContactSubmissionAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('name', 'email', 'subject', 'message')
    readonly_fields = ('created_at', 'updated_at', 'ip_address')
    fieldsets = (
        (None, {
            'fields': ('name', 'email', 'phone', 'subject', 'message')
        }),
        ('Admin', {
            'fields': ('status', 'admin_notes')
        }),
        ('Metadata', {
            'fields': ('ip_address', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        # Submissions should only be created through the API
        return False


@admin.register(Newsletter)
class NewsletterAdmin(admin.ModelAdmin):
    list_display = ('email', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('email',)
    readonly_fields = ('created_at', 'updated_at', 'ip_address')
    fieldsets = (
        (None, {
            'fields': ('email', 'is_active')
        }),
        ('Metadata', {
            'fields': ('ip_address', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_active', 'mark_inactive']
    
    def mark_active(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, f"{queryset.count()} subscriptions marked as active")
    mark_active.short_description = "Mark selected subscriptions as active"
    
    def mark_inactive(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f"{queryset.count()} subscriptions marked as inactive")
    mark_inactive.short_description = "Mark selected subscriptions as inactive"
