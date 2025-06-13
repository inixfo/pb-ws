import os
import django
import traceback

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import Product

def check_products():
    print("Checking products...")
    try:
        products = Product.objects.all()
        print(f"Total products: {products.count()}")
        
        for p in products:
            print(f"ID: {p.id}, Name: {p.name}, Base price: {p.base_price}")
            print(f"Variations: {p.variations.count()}, Images: {p.images.count()}")
            print(f"Special offer: {p.is_special_offer}, Trending: {p.is_trending}")
            print(f"Specifications: {p.specifications}")
            print("-" * 80)
        
        # Check trending products
        trending = Product.objects.filter(is_trending=True)
        print(f"\nTrending products: {trending.count()}")
        for p in trending:
            print(f"  - {p.name} (ID: {p.id})")
        
        # Check special offers
        special_offers = Product.objects.filter(is_special_offer=True)
        print(f"\nSpecial offers: {special_offers.count()}")
        for p in special_offers:
            print(f"  - {p.name} (ID: {p.id})")
        
        # Check new arrivals (most recent 10)
        new_arrivals = Product.objects.order_by('-created_at')[:10]
        print(f"\nNew arrivals: {new_arrivals.count()}")
        for p in new_arrivals:
            print(f"  - {p.name} (ID: {p.id}, Created: {p.created_at})")
    
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    check_products() 