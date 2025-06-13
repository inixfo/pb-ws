from django.contrib import admin
from django.db.models import ProtectedError
from django.contrib import messages
from .models import Category, Brand, ProductField, Product, ProductImage, SKU, ProductVariation
from reviews.models import Review


class ProductFieldInline(admin.TabularInline):
    model = ProductField
    extra = 1


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'is_active')
    list_filter = ('is_active', 'parent')
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductFieldInline]


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(ProductField)
class ProductFieldAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'field_type', 'group', 'is_required', 'is_filter', 'display_order')
    list_filter = ('category', 'field_type', 'group', 'is_required', 'is_filter')
    search_fields = ('name', 'category__name')
    ordering = ('category', 'group', 'display_order', 'name')


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ('image', 'alt_text', 'is_primary', 'display_order')


class ReviewInline(admin.TabularInline):
    model = Review
    extra = 0
    readonly_fields = ('user', 'rating', 'title', 'comment', 'status', 'created_at')
    can_delete = False


class SKUInline(admin.TabularInline):
    model = SKU
    extra = 1
    readonly_fields = ('created_at', 'updated_at')


class ProductVariationInline(admin.TabularInline):
    model = ProductVariation
    extra = 1
    fields = ('name', 'price', 'stock_quantity', 'sku', 'is_default', 'is_active')
    show_change_link = True


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'default_sku', 'category', 'brand', 'base_price', 'min_price', 'max_price', 'stock_quantity', 'is_available', 'is_approved', 'vendor',
        'is_trending', 'is_special_offer', 'is_best_seller', 'is_todays_deal'
    )
    list_filter = (
        'category', 'brand', 'is_available', 'is_approved', 'emi_available', 'vendor',
        'is_trending', 'is_special_offer', 'is_best_seller', 'is_todays_deal', 'created_at'
    )
    search_fields = ('name', 'description', 'vendor__email', 'default_sku')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('created_at', 'updated_at')
    inlines = [ProductVariationInline, ProductImageInline, ReviewInline, SKUInline]
    fieldsets = (
        (None, {
            'fields': ('name', 'slug', 'category', 'brand', 'description')
        }),
        ('Pricing', {
            'fields': ('base_price', 'sale_price')
        }),
        ('SKU & Stock', {
            'fields': ('default_sku', 'stock_quantity', 'is_available')
        }),
        ('EMI Options', {
            'fields': ('emi_available', 'emi_plans')
        }),
        ('Specifications', {
            'fields': ('specifications',)
        }),
        ('Status', {
            'fields': ('vendor', 'is_approved')
        }),
        ('Promotional', {
            'fields': ('is_trending', 'is_special_offer', 'is_best_seller', 'is_todays_deal'),
            'classes': ('collapse',)
        })
    )

    def delete_model(self, request, obj):
        """Override delete_model to handle ProtectedError."""
        try:
            obj.delete()
        except ProtectedError as e:
            self.message_user(request, str(e.args[0]), messages.ERROR)
    
    def delete_queryset(self, request, queryset):
        """Override delete_queryset to handle ProtectedError."""
        for obj in queryset:
            try:
                obj.delete()
            except ProtectedError as e:
                self.message_user(request, f"Could not delete {obj.name}: {str(e.args[0])}", messages.ERROR)


@admin.register(ProductVariation)
class ProductVariationAdmin(admin.ModelAdmin):
    list_display = ('product', 'name', 'price', 'stock_quantity', 'sku', 'is_default', 'is_active')
    list_filter = ('product__category', 'is_default', 'is_active')
    search_fields = ('name', 'sku', 'product__name')
    raw_id_fields = ('product',)


@admin.register(SKU)
class SKUAdmin(admin.ModelAdmin):
    list_display = ('code', 'product', 'stock_quantity', 'is_active')
    list_filter = ('is_active', 'product__category')
    search_fields = ('code', 'product__name')
    raw_id_fields = ('product',)
