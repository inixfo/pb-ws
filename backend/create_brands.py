#!/usr/bin/env python
"""
Script to create brands in the Phone Bay database.
Usage: python manage.py shell < create_brands.py
"""

import os
import django
from django.utils.text import slugify
from django.core.files.base import ContentFile
import requests

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import Brand, Category  # Import models after Django setup

# List of brands with their logo URLs
BRANDS = [
    {
        "name": "Samsung",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/9/9c/Samsung_logo_wordmark.svg"
    },
    {
        "name": "Vivo",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/1/13/Vivo_logo_2019.svg"
    },
    {
        "name": "Poco",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Poco_Smartphone_Company_logo.svg/250px-Poco_Smartphone_Company_logo.svg.png"
    },
    {
        "name": "Realme",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Realme_logo.svg/960px-Realme_logo.svg.png?20230228121816"
    },
    {
        "name": "OnePlus",
        "logo_url": "https://seeklogo.com/images/O/oneplus-logo-AD0F8C44DC-seeklogo.com.png"
    },
    {
        "name": "Nothing",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Nothing_Logo.webp/960px-Nothing_Logo.webp.png?20220322143235"
    },
    {
        "name": "Google",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1024px-Google_2015_logo.svg.png"
    },
    {
        "name": "Xiaomi",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Xiaomi_logo.svg/200px-Xiaomi_logo.svg.png?20221121094825"
    },
    {
        "name": "Redmi",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Redmi_Logo.svg/500px-Redmi_Logo.svg.png?20211216083212"
    },
    {
        "name": "Apple",
        "logo_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCvh-j7HsTHJ8ZckknAoiZMx9VcFmsFkv72g&s"
    },
    {
        "name": "Honor",
        "logo_url": "https://download.logo.wine/logo/Honor_(brand)/Honor_(brand)-Logo.wine.png"
    },
    {
        "name": "Asus",
        "logo_url": "https://static.vecteezy.com/system/resources/thumbnails/019/767/925/small_2x/asus-logo-asus-icon-transparent-free-png.png"
    },
    {
        "name": "IQOO",
        "logo_url": "https://brandlogos.net/wp-content/uploads/2022/05/iqoo-logo_brandlogos.net_slseg-512x512.png"
    },
    {
        "name": "Motorola",
        "logo_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnCiR6dtcVHc4_WzLJlXeol7-pvOQKHQ3yxQ&s"
    },
    {
        "name": "ZTE",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/ZTE-logo.svg/400px-ZTE-logo.svg.png?20170811223828"
    },
    {
        "name": "Huawei",
        "logo_url": "https://upload.wikimedia.org/wikipedia/en/thumb/0/04/Huawei_Standard_logo.svg/126px-Huawei_Standard_logo.svg.png?20190815073546"
    },
    {
        "name": "Hero",
        "logo_url": "https://logos-world.net/wp-content/uploads/2020/12/Hero-Logo-700x394.png"
    },
    {
        "name": "Bajaj",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Bajaj_Auto_Ltd_logo.svg/150px-Bajaj_Auto_Ltd_logo.svg.png"
    },
]

def download_logo(url, brand_name):
    """Download logo from URL and return as ContentFile."""
    try:
        response = requests.get(url)
        if response.status_code == 200:
            # Get file extension from URL
            file_ext = url.split('.')[-1]
            if '?' in file_ext:
                file_ext = file_ext.split('?')[0]
            if file_ext.lower() not in ['jpg', 'jpeg', 'png', 'svg', 'webp']:
                file_ext = 'png'  # Default to png if extension is not recognized
            
            # Create a ContentFile from the response content
            return ContentFile(response.content, name=f"{slugify(brand_name)}.{file_ext}")
        else:
            print(f"Failed to download logo for {brand_name}: HTTP {response.status_code}")
            return None
    except Exception as e:
        print(f"Error downloading logo for {brand_name}: {str(e)}")
        return None

def create_brands():
    """Create brands if they don't already exist."""
    brands_created = 0
    brands_skipped = 0
    
    print("Creating brands...")
    
    for brand_info in BRANDS:
        brand_name = brand_info["name"]
        logo_url = brand_info["logo_url"]
        slug = slugify(brand_name)
        
        # Check if brand already exists
        if Brand.objects.filter(slug=slug).exists():
            print(f"Brand '{brand_name}' already exists, skipping.")
            brands_skipped += 1
            continue
        
        # Create brand
        brand = Brand(
            name=brand_name,
            slug=slug,
            description=f"{brand_name} products.",
            is_active=True,
        )
        
        # Download and set the logo
        logo_file = download_logo(logo_url, brand_name)
        if logo_file:
            brand.logo.save(f"{slug}.png", logo_file, save=False)
        
        brand.save()
        print(f"Created brand: {brand.name}" + (" with logo" if logo_file else " without logo"))
        brands_created += 1
    
    print(f"\nBrands creation complete.")
    print(f"Created: {brands_created}")
    print(f"Skipped: {brands_skipped}")
    print(f"Total brands in database: {Brand.objects.count()}")

def assign_categories_to_brands():
    """
    Optional: Assign categories to brands.
    Uncomment and modify this function as needed.
    """
    # Example category assignments for smartphone brands
    try:
        # Get the Smartphones category if it exists
        smartphone_category = Category.objects.get(name="Smartphones")
        
        # Assign smartphone brands to the Smartphones category
        smartphone_brands = [
            "Samsung", "Vivo", "Poco", "Realme", "OnePlus", 
            "Nothing", "Google", "Xiaomi", "Redmi", "Apple", 
            "Honor", "Asus", "IQOO", "Motorola", "ZTE", "Huawei"
        ]
        
        for brand_name in smartphone_brands:
            try:
                brand = Brand.objects.get(name=brand_name)
                brand.categories.add(smartphone_category)
                print(f"Added {brand_name} to Smartphones category")
            except Brand.DoesNotExist:
                print(f"Brand {brand_name} not found")
                
        # Assign vehicle brands to Vehicles category if it exists
        try:
            vehicles_category = Category.objects.get(name="Vehicles")
            vehicle_brands = ["Hero", "Bajaj"]
            
            for brand_name in vehicle_brands:
                try:
                    brand = Brand.objects.get(name=brand_name)
                    brand.categories.add(vehicles_category)
                    print(f"Added {brand_name} to Vehicles category")
                except Brand.DoesNotExist:
                    print(f"Brand {brand_name} not found")
        except Category.DoesNotExist:
            print("Vehicles category not found")
            
    except Category.DoesNotExist:
        print("Smartphones category not found")

if __name__ == "__main__":
    create_brands()
    # Uncomment this line to also assign categories to brands
    # assign_categories_to_brands()
    print("Done!") 