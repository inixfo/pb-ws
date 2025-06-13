from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from users.serializers import UserMinimalSerializer
from products.serializers import ProductMinimalSerializer
from .models import PageView, ProductView, SearchQuery, CartEvent, SalesMetric


class PageViewSerializer(serializers.ModelSerializer):
    """Serializer for page view data."""
    
    user = UserMinimalSerializer(read_only=True)
    content_type_name = serializers.SerializerMethodField()
    
    class Meta:
        model = PageView
        fields = [
            'id', 'user', 'session_id', 'ip_address', 'user_agent',
            'page_type', 'page_url', 'referrer_url', 'content_type',
            'content_type_name', 'object_id', 'search_query', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']
    
    def get_content_type_name(self, obj):
        """Get the name of the content type."""
        if obj.content_type:
            return obj.content_type.model
        return None


class ProductViewSerializer(serializers.ModelSerializer):
    """Serializer for product view data."""
    
    user = UserMinimalSerializer(read_only=True)
    product = ProductMinimalSerializer(read_only=True)
    
    class Meta:
        model = ProductView
        fields = [
            'id', 'product', 'user', 'session_id', 'view_duration',
            'source', 'ip_address', 'user_agent', 'device_type', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class SearchQuerySerializer(serializers.ModelSerializer):
    """Serializer for search query data."""
    
    user = UserMinimalSerializer(read_only=True)
    clicked_product = ProductMinimalSerializer(read_only=True)
    
    class Meta:
        model = SearchQuery
        fields = [
            'id', 'query', 'user', 'session_id', 'results_count',
            'category_filter', 'price_filter_min', 'price_filter_max',
            'clicked_product', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class CartEventSerializer(serializers.ModelSerializer):
    """Serializer for cart event data."""
    
    user = UserMinimalSerializer(read_only=True)
    product = ProductMinimalSerializer(read_only=True)
    
    class Meta:
        model = CartEvent
        fields = [
            'id', 'user', 'session_id', 'event_type', 'product',
            'quantity', 'cart_total', 'cart_items_count', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class SalesMetricSerializer(serializers.ModelSerializer):
    """Serializer for sales metrics."""
    
    top_selling_product = ProductMinimalSerializer(read_only=True)
    
    class Meta:
        model = SalesMetric
        fields = [
            'id', 'period_type', 'period_start', 'period_end',
            'category', 'vendor', 'total_sales', 'total_orders',
            'average_order_value', 'total_products_sold',
            'top_selling_product', 'new_customers', 'returning_customers',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at'] 