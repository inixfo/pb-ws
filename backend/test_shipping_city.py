#!/usr/bin/env python
import os
import sys
import json
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'phone_bay.settings')
django.setup()

from shipping.services import debug_city_matching, get_available_shipping_methods, get_available_shipping_rates
from shipping.models import ShippingZone

def test_city_matching(city):
    """Test matching a city to shipping zones."""
    print(f"\n===== Testing city matching for: '{city}' =====\n")
    
    # Get debug info
    result = debug_city_matching(city)
    
    print(f"City queried: {result['city_queried']}")
    print(f"City normalized: {result['city_normalized']}")
    
    print("\nDirect matches:")
    if result['direct_matches']:
        for zone in result['direct_matches']:
            print(f"- Zone: {zone['name']} (ID: {zone['id']})")
            print(f"  Cities in zone: {', '.join(zone['cities'])}")
    else:
        print("No direct matches found")
    
    print("\nLowercase matches:")
    if result['lowercase_matches']:
        for zone in result['lowercase_matches']:
            print(f"- Zone: {zone['name']} (ID: {zone['id']})")
            print(f"  Cities in zone: {', '.join(zone['cities'])}")
    else:
        print("No lowercase matches found")
    
    print("\nManual matches:")
    if result['manual_matches']:
        for match in result['manual_matches']:
            print(f"- Zone: {match['name']} (ID: {match['id']})")
            print(f"  Matched city in zone: {match['city_in_zone']}")
    else:
        print("No manual matches found")
    
    # Test getting available shipping methods
    methods = get_available_shipping_methods(country="BD", city=city)
    print(f"\nAvailable shipping methods for {city}:")
    if methods:
        for method in methods:
            print(f"- {method.name} (ID: {method.id})")
    else:
        print("No shipping methods available")
    
    # Test getting available shipping rates
    rates = get_available_shipping_rates(country="BD", city=city)
    print(f"\nAvailable shipping rates for {city}:")
    if rates:
        for rate in rates:
            zone_name = rate.zone.name if rate.zone else "Unknown Zone"
            method_name = rate.method.name if rate.method else "Unknown Method"
            threshold = rate.free_shipping_threshold
            threshold_text = f"Free over ৳{threshold}" if threshold else "No free shipping threshold"
            
            print(f"- {method_name} in {zone_name}")
            print(f"  Base rate: ৳{rate.base_rate}, {threshold_text}")
    else:
        print("No shipping rates available")

def main():
    if len(sys.argv) < 2:
        print("Usage: python test_shipping_city.py <city_name>")
        print("Example: python test_shipping_city.py dhaka")
        return
    
    city_name = sys.argv[1]
    test_city_matching(city_name)
    
    print("\n\n===== Available shipping zones =====\n")
    zones = ShippingZone.objects.filter(is_active=True)
    for zone in zones:
        print(f"- {zone.name} (ID: {zone.id})")
        print(f"  Cities: {', '.join(zone.cities) if zone.cities else 'None'}")
        print(f"  Postal codes: {', '.join(zone.postal_codes[:5]) if zone.postal_codes else 'None'}{' (and more...)' if zone.postal_codes and len(zone.postal_codes) > 5 else ''}")
        print("")

if __name__ == "__main__":
    main() 