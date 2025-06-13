from rest_framework import serializers
from .models import ShippingZone, ShippingMethod, ShippingRate


class ShippingZoneSerializer(serializers.ModelSerializer):
    """Serializer for shipping zones."""
    
    class Meta:
        model = ShippingZone
        fields = [
            'id', 'name', 'description', 'is_active',
            'countries', 'states', 'cities', 'postal_codes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ShippingMethodSerializer(serializers.ModelSerializer):
    """Serializer for shipping methods."""
    
    class Meta:
        model = ShippingMethod
        fields = [
            'id', 'name', 'method_type', 'description', 'is_active',
            'min_delivery_time', 'max_delivery_time', 'handling_time',
            'requires_signature', 'includes_tracking', 'international_shipping',
            'max_weight', 'max_dimensions', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ShippingRateSerializer(serializers.ModelSerializer):
    """Serializer for shipping rates."""
    
    zone_name = serializers.CharField(source='zone.name', read_only=True)
    method_name = serializers.CharField(source='method.name', read_only=True)
    
    class Meta:
        model = ShippingRate
        fields = [
            'id', 'zone', 'zone_name', 'method', 'method_name',
            'rate_type', 'is_active', 'base_rate', 'per_kg_rate',
            'per_item_rate', 'free_shipping_threshold', 'conditions',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, data):
        """Validate shipping rate data."""
        if data['rate_type'] == 'weight' and data.get('per_kg_rate', 0) <= 0:
            raise serializers.ValidationError({
                'per_kg_rate': 'Per kg rate must be greater than 0 for weight-based shipping.'
            })
        
        if data['rate_type'] == 'item' and data.get('per_item_rate', 0) <= 0:
            raise serializers.ValidationError({
                'per_item_rate': 'Per item rate must be greater than 0 for item-based shipping.'
            })
        
        return data


class ShippingCalculatorSerializer(serializers.Serializer):
    """Serializer for calculating shipping costs."""
    
    zone_id = serializers.IntegerField()
    method_id = serializers.IntegerField()
    order_total = serializers.DecimalField(max_digits=10, decimal_places=2)
    weight = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    items_count = serializers.IntegerField(required=False)
    dimensions = serializers.DictField(required=False)
    
    def validate(self, data):
        """Validate shipping calculator data."""
        try:
            zone = ShippingZone.objects.get(id=data['zone_id'], is_active=True)
            method = ShippingMethod.objects.get(id=data['method_id'], is_active=True)
            
            # Get the shipping rate
            rate = ShippingRate.objects.get(
                zone=zone,
                method=method,
                is_active=True
            )
            
            # Add validated objects to the data
            data['zone'] = zone
            data['method'] = method
            data['rate'] = rate
            
        except (ShippingZone.DoesNotExist, ShippingMethod.DoesNotExist):
            raise serializers.ValidationError('Invalid shipping zone or method.')
        except ShippingRate.DoesNotExist:
            raise serializers.ValidationError('No active shipping rate found for this zone and method.')
        
        return data
    
    def calculate(self):
        """Calculate shipping cost using the validated data."""
        data = self.validated_data
        rate = data['rate']
        
        return rate.calculate_shipping_cost(
            order_total=data['order_total'],
            weight=data.get('weight'),
            items_count=data.get('items_count'),
            dimensions=data.get('dimensions')
        ) 