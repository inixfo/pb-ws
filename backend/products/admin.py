from django.contrib import admin
from django.db.models import ProtectedError
from django.contrib import messages
from django.shortcuts import render, redirect
from django.urls import path
from django.http import HttpResponse
from django.template.response import TemplateResponse
from .models import Category, Brand, ProductField, Product, ProductImage, SKU, ProductVariation
from reviews.models import Review
from .utils.bulk_upload import generate_upload_template, process_upload_file


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
    
    change_list_template = 'admin/products/product_changelist.html'
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('bulk-upload/', self.admin_site.admin_view(self.bulk_upload_view), name='product_bulk_upload'),
            path('download-template/<int:category_id>/', self.admin_site.admin_view(self.download_template_view), name='product_download_template'),
        ]
        return custom_urls + urls
    
    def bulk_upload_view(self, request):
        if request.method == 'POST':
            category_id = request.POST.get('category')
            file = request.FILES.get('file')
            
            if not category_id:
                self.message_user(request, "Category is required", level=messages.ERROR)
                return redirect('..')
                
            if not file:
                self.message_user(request, "File is required", level=messages.ERROR)
                return redirect('..')
                
            try:
                # Process the uploaded file
                results = process_upload_file(file, int(category_id), None)  # None for vendor_id means admin upload
                
                # Count successes and errors
                success_count = sum(1 for r in results if r['status'] == 'success')
                error_count = len(results) - success_count
                
                if success_count > 0:
                    self.message_user(
                        request, 
                        f"Successfully imported {success_count} products with {error_count} errors.",
                        level=messages.SUCCESS
                    )
                else:
                    self.message_user(
                        request, 
                        f"No products were imported. {error_count} errors found.",
                        level=messages.ERROR
                    )
                    
                # If there are errors, show them
                if error_count > 0:
                    for result in results:
                        if result['status'] == 'error':
                            self.message_user(
                                request,
                                f"Row {result['row']}: {result['errors']}",
                                level=messages.WARNING
                            )
                
                return redirect('admin:products_product_changelist')
                
            except Exception as e:
                self.message_user(
                    request,
                    f"Error processing file: {str(e)}",
                    level=messages.ERROR
                )
                return redirect('..')
        
        # GET request - show the upload form
        categories = Category.objects.all()
        context = {
            'categories': categories,
            'title': 'Bulk Upload Products',
            'opts': self.model._meta,
            'app_label': self.model._meta.app_label,
        }
        return TemplateResponse(request, 'admin/products/bulk_upload_form.html', context)
    
    def download_template_view(self, request, category_id):
        try:
            # Generate template file
            file_format = request.GET.get('format', 'csv')
            template_file = generate_upload_template(category_id, file_format)
            
            # Get category name for filename
            category = Category.objects.get(id=category_id)
            
            # Set content type and filename
            if file_format == 'csv':
                content_type = 'text/csv'
                filename = f"{category.name}_template.csv"
            else:
                content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                filename = f"{category.name}_template.xlsx"
            
            # Create response
            response = HttpResponse(template_file, content_type=content_type)
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            return response
            
        except Exception as e:
            self.message_user(
                request,
                f"Error generating template: {str(e)}",
                level=messages.ERROR
            )
            return redirect('admin:products_product_changelist')

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
