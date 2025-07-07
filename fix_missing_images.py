#!/usr/bin/env python
"""
Fix Missing Images Script

This script does two things:
1. Fixes missing images for existing products
2. Updates the bulk upload functionality to better handle external URLs

Run this script on the production server inside the Docker container:
docker-compose exec backend python fix_missing_images.py
"""

import os
import sys
import django
import requests
import time
import argparse
from urllib.parse import urlparse
from io import BytesIO

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.core.files import File
from django.core.files.temp import NamedTemporaryFile
from products.models import Product, ProductImage

def download_image_from_url(url, timeout=30, max_retries=3):
    """Download an image from a URL with retry logic"""
    print(f"Downloading image from URL: {url}")
    
    for attempt in range(max_retries):
        try:
            response = requests.get(url, stream=True, timeout=timeout)
            
            if response.ok:
                # Create a BytesIO object
                img_content = BytesIO()
                total_size = 0
                
                # Write the image to the BytesIO object
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        img_content.write(chunk)
                        total_size += len(chunk)
                
                if total_size == 0:
                    print(f"  Warning: Downloaded image has zero bytes")
                    if attempt < max_retries - 1:
                        print(f"  Retrying download ({attempt+1}/{max_retries})...")
                        time.sleep(1)
                        continue
                    else:
                        return None, None
                
                # Reset the file pointer to the beginning
                img_content.seek(0)
                
                # Get the filename from the URL or generate one
                filename = os.path.basename(urlparse(url).path)
                if not filename or len(filename) < 4:
                    # Get extension from content-type
                    content_type = response.headers.get('content-type', '')
                    ext = 'jpg'  # Default extension
                    if 'png' in content_type:
                        ext = 'png'
                    elif 'gif' in content_type:
                        ext = 'gif'
                    elif 'webp' in content_type:
                        ext = 'webp'
                        
                    filename = f"image_{time.time()}.{ext}"
                
                print(f"  Successfully downloaded image ({total_size} bytes)")
                return img_content, filename
            else:
                print(f"  Failed to download: Status {response.status_code}")
                if attempt < max_retries - 1:
                    print(f"  Retrying download ({attempt+1}/{max_retries})...")
                    time.sleep(1)
                else:
                    return None, None
                    
        except Exception as e:
            print(f"  Error downloading: {str(e)}")
            if attempt < max_retries - 1:
                print(f"  Retrying download ({attempt+1}/{max_retries})...")
                time.sleep(1)
            else:
                return None, None
    
    return None, None

def fix_product_images(product_id=None, csv_file=None, dry_run=True):
    """Fix missing images for products"""
    if product_id:
        products = Product.objects.filter(id=product_id)
        print(f"Checking for product with ID {product_id}")
    else:
        products = Product.objects.all().order_by('id')
        print(f"Checking all {products.count()} products")

    # Track progress
    fixed_count = 0
    failed_count = 0
    processed_count = 0
    
    # Open CSV file for writing if provided
    csv_output = None
    if csv_file:
        import csv
        csv_output = open(csv_file, 'w', newline='')
        csv_writer = csv.writer(csv_output)
        csv_writer.writerow(['Product ID', 'Product Name', 'Has Image Records', 'Has Valid Images', 'Specification URLs'])
    
    try:
        # Process each product
        for product in products:
            processed_count += 1
            print(f"\nProcessing product {product.id}: {product.name}")
            
            # Check for existing image records
            image_records = ProductImage.objects.filter(product=product)
            has_image_records = image_records.exists()
            
            # Check if any image records have valid files
            has_valid_images = False
            for img in image_records:
                if img.image and hasattr(img.image, 'url') and img.image.name:
                    has_valid_images = True
                    break
            
            print(f"  Has image records: {has_image_records}")
            print(f"  Has valid images: {has_valid_images}")
            
            # Extract image URLs from specifications
            image_urls = []
            if product.specifications and isinstance(product.specifications, dict):
                for key, value in product.specifications.items():
                    if isinstance(value, str) and (value.startswith('http://') or value.startswith('https://')):
                        if any(img_term in key.lower() for img_term in ['image', 'img', 'photo', 'picture']):
                            image_urls.append(value)
                
                # Also check for image_url field directly
                if 'image_url' in product.specifications:
                    url = product.specifications.get('image_url')
                    if url and isinstance(url, str) and (url.startswith('http://') or url.startswith('https://')):
                        image_urls.append(url)
            
            # Log to CSV if requested
            if csv_output:
                csv_writer.writerow([
                    product.id, 
                    product.name, 
                    has_image_records, 
                    has_valid_images, 
                    ', '.join(image_urls)
                ])
            
            # If product has no valid images but we have URLs, fix it
            if not has_valid_images and image_urls:
                print(f"  Found {len(image_urls)} potential image URLs in specifications")
                
                # If dry run, just report
                if dry_run:
                    print("  [DRY RUN] Would attempt to download images")
                    continue
                
                # Get or create an image record
                if has_image_records:
                    image = image_records.first()
                else:
                    image = ProductImage.objects.create(
                        product=product,
                        is_primary=True,
                        display_order=0
                    )
                
                # Try each URL until one works
                success = False
                for url in image_urls:
                    print(f"  Trying URL: {url}")
                    img_content, filename = download_image_from_url(url)
                    
                    if img_content and filename:
                        try:
                            # Save the image
                            image.image.save(filename, File(img_content), save=True)
                            print(f"  Successfully saved image to {image.image.name}")
                            fixed_count += 1
                            success = True
                            break
                        except Exception as e:
                            print(f"  Error saving image: {str(e)}")
                
                if not success:
                    print("  Failed to download and save any images")
                    failed_count += 1
            
            elif not has_valid_images:
                print("  No image URLs found in specifications")
            
            # Progress report for large batches
            if processed_count % 10 == 0:
                print(f"\nProgress: {processed_count}/{products.count()} products processed")
                print(f"Fixed: {fixed_count}, Failed: {failed_count}")
    
    finally:
        # Close CSV file if opened
        if csv_output:
            csv_output.close()
    
    # Final report
    print(f"\nCompleted processing {processed_count} products")
    print(f"Fixed {fixed_count} products with missing images")
    print(f"Failed to fix {failed_count} products")
    
    if dry_run:
        print("\nThis was a DRY RUN. No changes were made.")
        print("Run with --no-dry-run to apply changes.")

def main():
    parser = argparse.ArgumentParser(description='Fix missing product images')
    parser.add_argument('--product-id', type=int, help='Fix a specific product by ID')
    parser.add_argument('--csv', type=str, help='Export product image data to CSV file')
    parser.add_argument('--no-dry-run', action='store_true', help='Actually apply fixes (default is dry run)')
    
    args = parser.parse_args()
    
    print("=== Product Image Fixer ===")
    fix_product_images(
        product_id=args.product_id,
        csv_file=args.csv,
        dry_run=not args.no_dry_run
    )

if __name__ == "__main__":
    main() 