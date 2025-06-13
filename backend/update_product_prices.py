import os
import django
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import Product, Brand
from decimal import Decimal

def update_product_prices():
    """Update all products with realistic prices based on brand and product details."""
    print("Starting price update based on real-world values...")
    
    # Get all products
    products = Product.objects.all()
    
    if not products.exists():
        print("No products found in the database.")
        return
    
    # Define price ranges by brand and product type
    price_map = {
        # Apple products
        'iphone': {
            'base': 999,
            'pro': 1199,
            'max': 1399,
            'mini': 699
        },
        # Samsung products
        'galaxy': {
            's': 899,
            'note': 999,
            'fold': 1799,
            'flip': 999,
            'a': 399
        },
        # Xiaomi products
        'xiaomi': {
            'mi': 499,
            'redmi': 299,
            'poco': 349
        },
        # OnePlus products
        'oneplus': {
            'base': 649,
            'pro': 899
        },
        # Generic fallback
        'default': 499
    }
    
    updated_count = 0
    
    for product in products:
        old_price = product.base_price
        name_lower = product.name.lower()
        
        # Determine price based on brand and product name
        new_price = price_map['default']  # Default fallback price
        
        # Check for Apple products
        if 'iphone' in name_lower or product.brand.name.lower() == 'apple':
            new_price = price_map['iphone']['base']
            if 'pro max' in name_lower:
                new_price = price_map['iphone']['max']
            elif 'pro' in name_lower:
                new_price = price_map['iphone']['pro']
            elif 'mini' in name_lower:
                new_price = price_map['iphone']['mini']
                
        # Check for Samsung products
        elif 'samsung' in name_lower or product.brand.name.lower() == 'samsung':
            if 'galaxy' in name_lower:
                if 's' in name_lower.split():
                    new_price = price_map['galaxy']['s']
                elif 'note' in name_lower:
                    new_price = price_map['galaxy']['note']
                elif 'fold' in name_lower:
                    new_price = price_map['galaxy']['fold']
                elif 'flip' in name_lower:
                    new_price = price_map['galaxy']['flip']
                elif 'a' in name_lower.split():
                    new_price = price_map['galaxy']['a']
                else:
                    new_price = price_map['galaxy']['s']  # Default Samsung to S series price
            else:
                new_price = price_map['galaxy']['s']  # Default Samsung to S series price
                
        # Check for Xiaomi products
        elif 'xiaomi' in name_lower or product.brand.name.lower() == 'xiaomi':
            if 'mi' in name_lower.split():
                new_price = price_map['xiaomi']['mi']
            elif 'redmi' in name_lower:
                new_price = price_map['xiaomi']['redmi']
            elif 'poco' in name_lower:
                new_price = price_map['xiaomi']['poco']
            else:
                new_price = price_map['xiaomi']['mi']  # Default Xiaomi to Mi price
                
        # Check for OnePlus products
        elif 'oneplus' in name_lower or product.brand.name.lower() == 'oneplus':
            if 'pro' in name_lower:
                new_price = price_map['oneplus']['pro']
            else:
                new_price = price_map['oneplus']['base']
        
        # Add variation for storage size if mentioned
        storage_keywords = ['gb', 'tb']
        for word in name_lower.split():
            for keyword in storage_keywords:
                if keyword in word:
                    try:
                        size = int(''.join(filter(str.isdigit, word)))
                        if size >= 512 and keyword == 'gb':
                            new_price += 200
                        elif size >= 256 and keyword == 'gb':
                            new_price += 100
                        elif size >= 128 and keyword == 'gb':
                            new_price += 50
                        elif keyword == 'tb':
                            new_price += 400
                    except ValueError:
                        pass
        
        # Set the new price
        product.base_price = new_price
        product.save()
        
        print(f"Updated {product.name}: {old_price} -> {product.base_price}")
        updated_count += 1
    
    print(f"\nPrice update completed. Updated {updated_count} products.")
    
    # Display statistics
    min_price = Product.objects.order_by('base_price').first().base_price if products.exists() else 0
    max_price = Product.objects.order_by('-base_price').first().base_price if products.exists() else 0
    print(f"Price range: {min_price} - {max_price}")

if __name__ == "__main__":
    update_product_prices() 