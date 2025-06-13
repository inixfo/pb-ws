from django.contrib import admin
from .models import VendorProfile, StoreSettings, VendorApproval, VendorBankAccount


class StoreSettingsInline(admin.StackedInline):
    model = StoreSettings
    extra = 0


class VendorApprovalInline(admin.TabularInline):
    model = VendorApproval
    extra = 0
    readonly_fields = ('created_at', 'updated_at')


class VendorBankAccountInline(admin.StackedInline):
    model = VendorBankAccount
    extra = 0


@admin.register(VendorProfile)
class VendorProfileAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'user', 'status', 'is_featured', 'rating', 'created_at')
    list_filter = ('status', 'is_featured', 'created_at')
    search_fields = ('company_name', 'user__email', 'business_email', 'business_phone')
    readonly_fields = ('slug', 'created_at', 'updated_at')
    inlines = [StoreSettingsInline, VendorApprovalInline, VendorBankAccountInline]
    fieldsets = (
        (None, {
            'fields': ('user', 'company_name', 'slug', 'status', 'is_featured', 'rating')
        }),
        ('Business Information', {
            'fields': ('business_email', 'business_phone', 'tax_id')
        }),
        ('Address', {
            'fields': ('business_address', 'city', 'state', 'postal_code', 'country')
        }),
        ('Documents', {
            'fields': ('business_certificate', 'id_proof')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(VendorApproval)
class VendorApprovalAdmin(admin.ModelAdmin):
    list_display = ('vendor', 'status', 'admin_user', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('vendor__company_name', 'admin_notes')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('vendor', 'status', 'admin_user', 'admin_notes')
        }),
        ('Documents', {
            'fields': ('additional_document1', 'additional_document2')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
