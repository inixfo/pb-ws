from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User, Profile, Address, PaymentMethod


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User admin."""
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'phone')}),
        (_('Role'), {'fields': ('role', 'is_verified')}),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser',
                                       'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'role'),
        }),
    )
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_verified', 'is_staff')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'role', 'is_verified')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    """Profile admin."""
    
    list_display = ('user', 'company_name', 'is_approved')
    list_filter = ('is_approved',)
    search_fields = ('user__email', 'company_name')


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    """Address admin."""
    
    list_display = ('user', 'address_type', 'city', 'state', 'is_default')
    list_filter = ('address_type', 'is_default', 'city', 'state')
    search_fields = ('user__email', 'full_name', 'city', 'state')


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    """PaymentMethod admin."""
    
    list_display = ('user', 'payment_type', 'provider', 'is_default', 'is_verified')
    list_filter = ('payment_type', 'is_default', 'is_verified', 'provider')
    search_fields = ('user__email', 'provider')
