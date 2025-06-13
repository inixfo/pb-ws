from decimal import Decimal
from django.db.models import Q
from .models import ShippingRate, ShippingZone, ShippingMethod


class ShippingService:
    """Service for calculating shipping costs."""
    
    # Default free shipping threshold (can be overridden by settings)
    DEFAULT_FREE_SHIPPING_THRESHOLD = Decimal('5000.00')
    
    @classmethod
    def calculate_shipping_cost(cls, cart_total, shipping_zone=None, shipping_method=None):
        """Calculate shipping cost based on cart total, zone, and method."""
        # If cart total exceeds free shipping threshold, shipping is free
        if cart_total >= cls.get_free_shipping_threshold():
            return Decimal('0.00')
        
        # If no specific zone or method is provided, use default shipping cost
        if not shipping_zone or not shipping_method:
            return cls.get_default_shipping_cost()
        
        # Try to find a specific shipping rate
        try:
            rate = ShippingRate.objects.get(
                zone=shipping_zone,
                method=shipping_method,
                is_active=True
            )
            
            # Check if this rate has its own free shipping threshold
            if rate.free_shipping_threshold and cart_total >= rate.free_shipping_threshold:
                return Decimal('0.00')
            
            # Calculate shipping cost based on rate type
            if rate.rate_type == 'flat':
                return rate.base_rate
            elif rate.rate_type == 'price':
                # Price-based shipping (percentage of cart total)
                percentage = rate.conditions.get('percentage', 0)
                return (cart_total * Decimal(percentage) / 100) + rate.base_rate
            else:
                # Default to base rate for other rate types
                return rate.base_rate
            
        except ShippingRate.DoesNotExist:
            # Fall back to default shipping cost
            return cls.get_default_shipping_cost()
    
    @classmethod
    def get_free_shipping_threshold(cls):
        """Get the free shipping threshold."""
        # This could be loaded from settings or database
        return cls.DEFAULT_FREE_SHIPPING_THRESHOLD
    
    @classmethod
    def get_default_shipping_cost(cls):
        """Get the default shipping cost."""
        # This could be loaded from settings or database
        return Decimal('120.00')  # Default shipping cost
    
    @classmethod
    def get_remaining_for_free_shipping(cls, cart_total):
        """Calculate how much more needs to be spent for free shipping."""
        threshold = cls.get_free_shipping_threshold()
        if cart_total >= threshold:
            return Decimal('0.00')
        return threshold - cart_total

def debug_city_matching(city):
    """
    Debug function to check which shipping zones match a given city.
    """
    if not city:
        return {
            'error': 'City parameter is required'
        }
    
    # Normalize the city name (lowercase)
    city_lower = city.lower().strip()
    
    # Find zones that match this city
    direct_match_zones = ShippingZone.objects.filter(
        Q(cities__contains=[city]) & Q(is_active=True)
    )
    
    lowercase_match_zones = ShippingZone.objects.filter(
        Q(cities__contains=[city_lower]) & Q(is_active=True)
    )
    
    # Get all zones to check manual matching
    all_zones = ShippingZone.objects.filter(is_active=True)
    manual_matches = []
    
    for zone in all_zones:
        cities = zone.cities
        if not cities:
            continue
        
        for zone_city in cities:
            if zone_city.lower() == city_lower:
                manual_matches.append({
                    'id': zone.id,
                    'name': zone.name,
                    'city_in_zone': zone_city
                })
    
    # Create debug response
    response = {
        'city_queried': city,
        'city_normalized': city_lower,
        'direct_matches': [
            {'id': zone.id, 'name': zone.name, 'cities': zone.cities}
            for zone in direct_match_zones
        ],
        'lowercase_matches': [
            {'id': zone.id, 'name': zone.name, 'cities': zone.cities}
            for zone in lowercase_match_zones
        ],
        'manual_matches': manual_matches,
        'all_zones': [
            {'id': zone.id, 'name': zone.name, 'cities': zone.cities}
            for zone in all_zones
        ]
    }
    
    return response

def get_available_shipping_methods(country=None, state=None, city=None, postal_code=None):
    """
    Get available shipping methods for a location.
    """
    # Find matching zones
    zones_query = Q(is_active=True)
    
    if country:
        zones_query &= Q(countries__contains=[country])
    
    if state:
        zones_query &= (Q(states__contains=[state]) | Q(states=[]))
    
    if city:
        # Try both exact match and lowercase match
        city_lower = city.lower().strip()
        cities_query = Q()
        
        # Check for city in the cities array
        for zone in ShippingZone.objects.filter(zones_query):
            if zone.cities:
                for zone_city in zone.cities:
                    if zone_city.lower() == city_lower:
                        cities_query |= Q(id=zone.id)
        
        # If we found matches using manual comparison
        if cities_query:
            zones_query &= cities_query
        else:
            # Fall back to contains lookup
            zones_query &= (Q(cities__contains=[city]) | Q(cities__contains=[city_lower]) | Q(cities=[]))
    
    if postal_code:
        zones_query &= (Q(postal_codes__contains=[postal_code]) | Q(postal_codes=[]))
    
    zones = ShippingZone.objects.filter(zones_query)
    
    # Get unique methods from rates for matching zones
    rates = ShippingRate.objects.filter(zone__in=zones, is_active=True)
    method_ids = rates.values_list('method_id', flat=True).distinct()
    
    # Get the methods
    methods = ShippingMethod.objects.filter(id__in=method_ids, is_active=True)
    
    return methods

def get_available_shipping_rates(country=None, state=None, city=None, postal_code=None):
    """
    Get available shipping rates for a location.
    """
    # Find matching zones using the same logic as get_available_shipping_methods
    zones_query = Q(is_active=True)
    
    if country:
        zones_query &= Q(countries__contains=[country])
    
    if state:
        zones_query &= (Q(states__contains=[state]) | Q(states=[]))
    
    if city:
        # Try both exact match and lowercase match
        city_lower = city.lower().strip()
        cities_query = Q()
        
        # Check for city in the cities array
        for zone in ShippingZone.objects.filter(zones_query):
            if zone.cities:
                for zone_city in zone.cities:
                    if zone_city.lower() == city_lower:
                        cities_query |= Q(id=zone.id)
        
        # If we found matches using manual comparison
        if cities_query:
            zones_query &= cities_query
        else:
            # Fall back to contains lookup
            zones_query &= (Q(cities__contains=[city]) | Q(cities__contains=[city_lower]) | Q(cities=[]))
    
    if postal_code:
        zones_query &= (Q(postal_codes__contains=[postal_code]) | Q(postal_codes=[]))
    
    zones = ShippingZone.objects.filter(zones_query)
    
    # Get rates for matching zones
    rates = ShippingRate.objects.filter(zone__in=zones, is_active=True)
    
    return rates 