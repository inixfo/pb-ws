from rest_framework import serializers
from .models import Order


class OrderMinimalSerializer(serializers.ModelSerializer):
    """Minimal serializer for Order model (used in EMI, analytics, etc.)."""
    
    class Meta:
        model = Order
        fields = ['id', 'order_id', 'status', 'total', 'has_emi', 'created_at'] 