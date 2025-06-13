import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'phone_bay.settings')
django.setup()

from shipping.models import ShippingZone, ShippingMethod, ShippingRate

# Create or update shipping zone for Dhaka
dhaka_zone, created = ShippingZone.objects.update_or_create(
    name="Dhaka City",
    defaults={
        'description': "Shipping zone for Dhaka city and surrounding areas",
        'countries': ['BD'],
        'cities': ['dhaka', 'Dhaka'],
        'is_active': True
    }
)

print(f"{'Created' if created else 'Updated'} shipping zone: {dhaka_zone}")

# Create or update shipping methods
standard_method, created = ShippingMethod.objects.update_or_create(
    name="Standard Shipping",
    defaults={
        'method_type': 'standard',
        'description': 'Regular delivery within 3-5 business days',
        'min_delivery_time': 3,
        'max_delivery_time': 5,
        'handling_time': 1,
        'requires_signature': False,
        'includes_tracking': True,
        'international_shipping': False,
        'is_active': True
    }
)
print(f"{'Created' if created else 'Updated'} shipping method: {standard_method}")

express_method, created = ShippingMethod.objects.update_or_create(
    name="Express Shipping",
    defaults={
        'method_type': 'express',
        'description': 'Fast delivery within 1-2 business days',
        'min_delivery_time': 1,
        'max_delivery_time': 2,
        'handling_time': 0,
        'requires_signature': True,
        'includes_tracking': True,
        'international_shipping': False,
        'is_active': True
    }
)
print(f"{'Created' if created else 'Updated'} shipping method: {express_method}")

# Create or update shipping rates
standard_rate, created = ShippingRate.objects.update_or_create(
    zone=dhaka_zone,
    method=standard_method,
    rate_type='flat',
    defaults={
        'base_rate': 120,
        'per_kg_rate': 0,
        'per_item_rate': 0,
        'free_shipping_threshold': 5000,
        'is_active': True
    }
)
print(f"{'Created' if created else 'Updated'} shipping rate: {standard_rate}")

express_rate, created = ShippingRate.objects.update_or_create(
    zone=dhaka_zone,
    method=express_method,
    rate_type='flat',
    defaults={
        'base_rate': 250,
        'per_kg_rate': 0,
        'per_item_rate': 0,
        'free_shipping_threshold': 10000,
        'is_active': True
    }
)
print(f"{'Created' if created else 'Updated'} shipping rate: {express_rate}")

print("\nShipping data setup complete!") 