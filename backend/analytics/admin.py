from django.contrib import admin
from .models import PageView, ProductView, SearchQuery, CartEvent, SalesMetric


@admin.register(PageView)
class PageViewAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'session_id', 'page_type', 'timestamp']
    list_filter = ['page_type', 'timestamp']
    search_fields = ['session_id', 'page_url', 'search_query']
    date_hierarchy = 'timestamp'


@admin.register(ProductView)
class ProductViewAdmin(admin.ModelAdmin):
    list_display = ['id', 'product', 'user', 'session_id', 'view_duration', 'timestamp']
    list_filter = ['timestamp', 'device_type']
    search_fields = ['session_id', 'product__name']
    date_hierarchy = 'timestamp'


@admin.register(SearchQuery)
class SearchQueryAdmin(admin.ModelAdmin):
    list_display = ['id', 'query', 'user', 'results_count', 'timestamp']
    list_filter = ['timestamp', 'results_count']
    search_fields = ['query', 'session_id']
    date_hierarchy = 'timestamp'


@admin.register(CartEvent)
class CartEventAdmin(admin.ModelAdmin):
    list_display = ['id', 'event_type', 'product', 'user', 'quantity', 'timestamp']
    list_filter = ['event_type', 'timestamp']
    search_fields = ['session_id', 'product__name']
    date_hierarchy = 'timestamp'


@admin.register(SalesMetric)
class SalesMetricAdmin(admin.ModelAdmin):
    list_display = ['id', 'period_type', 'period_start', 'period_end', 'category', 'vendor', 'total_sales']
    list_filter = ['period_type', 'period_start']
    search_fields = ['category__name', 'vendor__company_name']
    date_hierarchy = 'period_start'
