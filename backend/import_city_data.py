import os
import json
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'phone_bay.settings')
django.setup()

from shipping.models import ShippingZone, ShippingMethod, ShippingRate
from decimal import Decimal

def main():
    # Load data from JSON file
    with open('city_postal_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Get Bangladesh data
    bd_data = data.get('BD', {})
    cities = bd_data.get('cities', [])
    
    if not cities:
        print("No cities found in the data!")
        return
    
    print(f"Found {len(cities)} cities to import.")
    
    # Get or create standard and express shipping methods
    standard_method, _ = ShippingMethod.objects.get_or_create(
        name="Standard Delivery",
        defaults={
            'method_type': 'standard',
            'description': 'Standard delivery (3-5 business days)',
            'min_delivery_time': 3,
            'max_delivery_time': 5,
            'is_active': True,
        }
    )
    
    express_method, _ = ShippingMethod.objects.get_or_create(
        name="Express Delivery",
        defaults={
            'method_type': 'express',
            'description': 'Express delivery within Dhaka city (1-2 business days)',
            'min_delivery_time': 1,
            'max_delivery_time': 2,
            'is_active': True,
        }
    )
    
    same_day_method, _ = ShippingMethod.objects.get_or_create(
        name="Same Day Delivery",
        defaults={
            'method_type': 'same_day',
            'description': 'Get your order on the same day (Dhaka city only)',
            'min_delivery_time': 0,
            'max_delivery_time': 1,
            'is_active': True,
        }
    )
    
    # Create shipping zones and rates for each city
    for city in cities:
        city_name = city['name']
        native_name = city.get('native_name', '')
        postal_codes = city.get('postal_codes', [])
        
        print(f"Processing {city_name}...")
        
        # Create or update shipping zone
        zone_name = f"{city_name} Zone"
        zone, created = ShippingZone.objects.update_or_create(
            name=zone_name,
            defaults={
                'description': f"Shipping zone for {city_name} ({native_name}) and surrounding areas",
                'countries': ['BD'],
                'cities': [city_name.lower(), city_name],
                'postal_codes': postal_codes,
                'is_active': True
            }
        )
        
        action = "Created" if created else "Updated"
        print(f"{action} shipping zone: {zone}")
        
        # Create or update shipping rates
        # Standard shipping rate
        delivery_time = city.get('delivery_time', {}).get('standard', {"min": 3, "max": 5})
        
        # Different free shipping thresholds and rates for each city
        if city_name == "Dhaka":
            standard_base_rate = 120
            express_base_rate = 200
            standard_threshold = 2000
            express_threshold = 5000
        elif city_name in ["Chittagong", "Sylhet", "Comilla"]:
            standard_base_rate = 150
            express_base_rate = 300
            standard_threshold = 3000
            express_threshold = 6000
        else:
            standard_base_rate = 200
            express_base_rate = 350
            standard_threshold = 4000
            express_threshold = 8000
        
        # Update the standard method with the delivery time
        standard_method.min_delivery_time = delivery_time["min"]
        standard_method.max_delivery_time = delivery_time["max"]
        standard_method.save()
        
        # Create standard shipping rate
        standard_rate, rate_created = ShippingRate.objects.update_or_create(
            zone=zone,
            method=standard_method,
            defaults={
                'rate_type': 'flat',
                'base_rate': standard_base_rate,
                'free_shipping_threshold': standard_threshold,
                'is_active': True
            }
        )
        
        rate_action = "Created" if rate_created else "Updated"
        print(f"{rate_action} standard shipping rate for {city_name}: {standard_rate}")
        
        # Create express shipping rate
        if city.get('shipping_available', True):
            express_delivery_time = city.get('delivery_time', {}).get('express', {"min": 1, "max": 2})
            
            # Update the express method with the delivery time
            express_method.min_delivery_time = express_delivery_time["min"]
            express_method.max_delivery_time = express_delivery_time["max"]
            express_method.save()
            
            express_rate, rate_created = ShippingRate.objects.update_or_create(
                zone=zone,
                method=express_method,
                defaults={
                    'rate_type': 'flat',
                    'base_rate': express_base_rate,
                    'free_shipping_threshold': express_threshold,
                    'is_active': True
                }
            )
            
            rate_action = "Created" if rate_created else "Updated"
            print(f"{rate_action} express shipping rate for {city_name}: {express_rate}")
            
            # Create same-day shipping rate (only for Dhaka)
            if city_name == "Dhaka":
                same_day_rate, rate_created = ShippingRate.objects.update_or_create(
                    zone=zone,
                    method=same_day_method,
                    defaults={
                        'rate_type': 'flat',
                        'base_rate': 350,
                        'free_shipping_threshold': 8000,
                        'is_active': True
                    }
                )
                
                rate_action = "Created" if rate_created else "Updated"
                print(f"{rate_action} same-day shipping rate for {city_name}: {same_day_rate}")
    
    print("\nCity data import complete!")

if __name__ == "__main__":
    main() 