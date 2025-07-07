#!/usr/bin/env python
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import Product, ProductImage
import requests
from django.core.files import File
from django.core.files.temp import NamedTemporaryFile
from urllib.parse import urlparse

def fix_missing_product_images():
    """
    Find products with missing images and try to fix them by downloading from the specifications.
    This checks products that have images in their specifications but missing actual image files.
    """
    print("Checking for products with missing images...")
    products = Product.objects.all()
    fixed_count = 0
    error_count = 0
    
    for product in products:
        # Check if product already has images
        has_images = ProductImage.objects.filter(product=product).exists()
        
        # If product has image records but the files are missing
        images = ProductImage.objects.filter(product=product)
        for image in images:
            try:
                # Check if the image file exists
                if not image.image or not hasattr(image.image, 'url') or not image.image.name:
                    print(f"Product {product.id} ({product.name}) has image record but missing file")
                    
                    # Check if we have image URLs in specifications
                    if product.specifications and isinstance(product.specifications, dict):
                        image_urls = []
                        
                        # Look for image URLs in specifications
                        for key, value in product.specifications.items():
                            if any(img_key in key.lower() for img_key in ['image', 'img', 'photo', 'picture']):
                                if isinstance(value, str) and (value.startswith('http://') or value.startswith('https://')):
                                    image_urls.append(value)
                        
                        # Also check for image_url field directly
                        if 'image_url' in product.specifications:
                            url = product.specifications.get('image_url')
                            if url and isinstance(url, str):
                                image_urls.append(url)
                        
                        # Try to download and save the first valid image URL
                        if image_urls:
                            for url in image_urls:
                                print(f"  Trying to download image from URL: {url}")
                                if download_and_save_image(image, url):
                                    fixed_count += 1
                                    break
                    else:
                        print(f"  No image URLs found in specifications for product {product.id}")
            except Exception as e:
                print(f"  Error processing image for product {product.id}: {str(e)}")
                error_count += 1
    
    print(f"\nFixed {fixed_count} images. Encountered {error_count} errors.")

def download_and_save_image(image_obj, url, timeout=30):
    """
    Download image from URL and save it to the provided image object
    """
    try:
        # Create a temporary file
        img_temp = NamedTemporaryFile(delete=True)
        
        # Set longer timeout for problematic connections
        response = requests.get(url, stream=True, timeout=timeout)
        if not response.ok:
            print(f"  Failed to download image: Status {response.status_code}")
            return False
        
        # Write the image to a temporary file
        for block in response.iter_content(1024 * 8):
            if not block:
                break
            img_temp.write(block)
        
        img_temp.flush()
        
        # Get filename from URL or use a default
        filename = os.path.basename(urlparse(url).path)
        if not filename or len(filename) < 4:  # Ensure we have a valid filename
            # Get extension from content-type
            content_type = response.headers.get('content-type', '')
            ext = 'jpg'  # Default extension
            if 'png' in content_type:
                ext = 'png'
            elif 'gif' in content_type:
                ext = 'gif'
            elif 'webp' in content_type:
                ext = 'webp'
                
            filename = f"image_{image_obj.product.id}_{image_obj.id}.{ext}"
        
        # Save the image file
        image_obj.image.save(filename, File(img_temp))
        img_temp.close()
        
        # Verify image was saved
        if image_obj.image and image_obj.image.url:
            print(f"  Successfully saved image: {image_obj.image.url}")
            return True
        else:
            print("  Image was processed but file not saved correctly")
            return False
            
    except Exception as e:
        print(f"  Error downloading/saving image: {str(e)}")
        return False

def fix_bulk_upload_method():
    """
    Apply fixes to make the bulk upload method more robust.
    This will update the save_image_from_path function to better handle downloads.
    """
    # Note: In a production environment, you'd need to update the actual code files
    print("To fix the bulk upload method, update the save_image_from_path function in:")
    print("backend/products/utils/bulk_upload.py")
    
    print("\nRecommended changes:")
    print("""
1. Increase timeout for URL downloads:
   response = requests.get(image_path, stream=True, timeout=30)

2. Add better error handling and retry logic:
   max_retries = 3
   for attempt in range(max_retries):
       try:
           response = requests.get(image_path, stream=True, timeout=30)
           if response.ok:
               break
       except Exception as e:
           if attempt < max_retries - 1:
               time.sleep(1)  # Wait before retrying
           else:
               print(f"Failed to download after {max_retries} attempts: {str(e)}")
               return None

3. Add better content-type checking to ensure proper file extensions:
   content_type = response.headers.get('content-type', '')
   ext = 'jpg'  # Default extension
   if 'png' in content_type:
       ext = 'png'
   # ... similar logic for other types

4. Add more debug logging to trace exact failures:
   print(f"Attempting to save image from URL: {image_path}")
   # ... at each major step
    """)

if __name__ == "__main__":
    print("===== Image Fix Utility =====")
    
    # Check if we should run the fix for missing images
    fix_missing = len(sys.argv) > 1 and sys.argv[1] == "--fix-missing"
    
    if fix_missing:
        print("\n=== Fixing Missing Product Images ===")
        fix_missing_product_images()
    else:
        print("\n=== Showing Recommended Fixes ===")
        fix_bulk_upload_method()
        print("\nRun this script with --fix-missing to attempt fixing missing product images") 