import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import Product
from django.db.models import F, Value
from decimal import Decimal
import random

def fix_product_prices():
    """Update all products with base_price of 0 to have meaningful prices."""
    
    # Get all products with base_price of 0
    zero_price_products = Product.objects.filter(base_price=0)
    count = zero_price_products.count()
    
    if count == 0:
        print("No products with zero prices found.")
        return
    
    print(f"Found {count} products with zero base_price.")
    
    # Define price ranges for different product types
    phone_price_range = (500, 1200)  # Most phones are between $500-$1200
    
    # Update each product individually to have a realistic price
    for product in zero_price_products:
        # Determine product type from name/category
        product_name = product.name.lower()
        
        if 'iphone' in product_name:
            # iPhones are premium products
            new_price = round(random.uniform(800, 1200), 2)
        elif 'samsung' in product_name and ('galaxy' in product_name or 's' in product_name):
            # Samsung Galaxy phones are premium
            new_price = round(random.uniform(700, 1000), 2)
        elif 'phone' in product_name or 'mobile' in product_name:
            # Generic phones
            new_price = round(random.uniform(300, 700), 2)
        else:
            # Default case - random price in the phone range
            new_price = round(random.uniform(phone_price_range[0], phone_price_range[1]), 2)
        
        # Update the base_price
        product.base_price = new_price
        product.save()
        
        print(f"Updated {product.name}: base_price set to {new_price}")
    
    print("\nPrice update completed.")
    print(f"Updated {count} products with realistic prices.")

if __name__ == "__main__":
    fix_product_prices()
    
    # Verify the update
    zero_count = Product.objects.filter(base_price=0).count()
    if zero_count > 0:
        print(f"Warning: {zero_count} products still have zero prices.")
    else:
        print("Success: All products now have non-zero prices.")
    
    # Show some product prices for verification
    products = Product.objects.all()[:5]
    print("\nSample product prices:")
    for product in products:
        print(f"{product.name}: {product.base_price}") 