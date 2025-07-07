#!/usr/bin/env python
import os
import sys
import requests
import time
from urllib.parse import urlparse
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import ProductImage, Product
from django.core.files import File
from django.core.files.temp import NamedTemporaryFile
from django.conf import settings

def test_url_connection(url):
    """Test if the URL can be accessed"""
    print(f"Testing URL connection to: {url}")
    try:
        response = requests.head(url, timeout=5)
        print(f"  Response status: {response.status_code}")
        return response.ok
    except Exception as e:
        print(f"  Connection error: {str(e)}")
        return False

def test_url_download(url):
    """Test if we can download content from the URL"""
    print(f"Testing content download from: {url}")
    try:
        start_time = time.time()
        response = requests.get(url, stream=True, timeout=10)
        if not response.ok:
            print(f"  Download failed with status: {response.status_code}")
            return False
        
        # Read a small part to test
        chunk = next(response.iter_content(1024 * 8), None)
        end_time = time.time()
        
        print(f"  Successfully downloaded first chunk ({len(chunk)} bytes)")
        print(f"  Download time: {end_time - start_time:.2f} seconds")
        return True
    except Exception as e:
        print(f"  Download error: {str(e)}")
        return False

def test_temp_file_creation():
    """Test if temp files can be created"""
    print("Testing temp file creation")
    try:
        temp_file = NamedTemporaryFile(delete=True)
        temp_file_path = temp_file.name
        print(f"  Created temp file: {temp_file_path}")
        
        # Check if we can write to it
        temp_file.write(b"Test content")
        temp_file.flush()
        
        # Check if it exists
        if os.path.exists(temp_file_path):
            print(f"  Temp file exists and is writable")
            temp_file.close()
            return True
        else:
            print(f"  Temp file doesn't exist after creation")
            return False
    except Exception as e:
        print(f"  Temp file error: {str(e)}")
        return False

def test_s3_storage():
    """Test if S3 storage is properly configured"""
    print("Testing S3 storage configuration")
    try:
        # Check if we're using S3
        storage_class = settings.DEFAULT_FILE_STORAGE
        print(f"  Storage backend: {storage_class}")
        
        # Check AWS settings
        if hasattr(settings, 'AWS_ACCESS_KEY_ID'):
            # Don't print the actual key, just check if it's set
            has_key = bool(settings.AWS_ACCESS_KEY_ID)
            print(f"  AWS_ACCESS_KEY_ID configured: {has_key}")
            
        if hasattr(settings, 'AWS_SECRET_ACCESS_KEY'):
            has_secret = bool(settings.AWS_SECRET_ACCESS_KEY)
            print(f"  AWS_SECRET_ACCESS_KEY configured: {has_secret}")
            
        if hasattr(settings, 'AWS_STORAGE_BUCKET_NAME'):
            print(f"  AWS_STORAGE_BUCKET_NAME: {settings.AWS_STORAGE_BUCKET_NAME}")
            
        return True
    except Exception as e:
        print(f"  S3 configuration error: {str(e)}")
        return False

def test_save_image_from_url(url, product_id=None):
    """Test the entire save image from URL process"""
    print(f"Testing full image save process from URL: {url}")
    try:
        # Get or create a test product
        if product_id:
            product = Product.objects.get(id=product_id)
        else:
            # Try to get any product
            product = Product.objects.first()
            if not product:
                print("  No product found for testing")
                return False
        
        print(f"  Using product: {product.id} - {product.name}")
        
        # Download the image
        img_temp = NamedTemporaryFile(delete=True)
        response = requests.get(url, stream=True, timeout=10)
        
        if not response.ok:
            print(f"  Failed to download image: {response.status_code}")
            return False
            
        # Write the image to a temporary file
        for block in response.iter_content(1024 * 8):
            if not block:
                break
            img_temp.write(block)
            
        img_temp.flush()
        
        # Create the product image
        image = ProductImage.objects.create(
            product=product,
            is_primary=False,
            display_order=0
        )
        
        # Get the filename from the URL
        filename = os.path.basename(urlparse(url).path)
        if not filename:
            filename = "test_image.jpg"
            
        # Save the image file
        image.image.save(filename, File(img_temp))
        img_temp.close()
        
        # Verify the image was saved
        if image.image and image.image.url:
            print(f"  Successfully saved image: {image.image.url}")
            return True
        else:
            print("  Image was created but has no file")
            return False
    except Exception as e:
        print(f"  Save image error: {str(e)}")
        return False

def print_system_info():
    """Print system information"""
    print("\n=== System Information ===")
    print(f"Python version: {sys.version}")
    print(f"Django version: {django.get_version()}")
    print(f"Requests version: {requests.__version__}")
    print(f"Media root: {settings.MEDIA_ROOT}")
    print(f"Media URL: {settings.MEDIA_URL}")
    print(f"DEBUG mode: {settings.DEBUG}")
    print(f"ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
    
    # Check if requests can access internet
    print("\nTesting internet connection:")
    test_urls = [
        "https://www.google.com",
        "https://s3.amazonaws.com"
    ]
    for url in test_urls:
        test_url_connection(url)

if __name__ == "__main__":
    print_system_info()
    
    print("\n=== Testing Temp Files ===")
    test_temp_file_creation()
    
    print("\n=== Testing S3 Storage ===")
    test_s3_storage()
    
    print("\n=== Testing Image URLs ===")
    # Test with some common image URLs
    test_urls = [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png",
        "https://picsum.photos/200/300"
    ]
    
    # Also test with a user-provided URL if given
    if len(sys.argv) > 1:
        test_urls.append(sys.argv[1])
    
    for url in test_urls:
        print(f"\nTesting URL: {url}")
        connection_ok = test_url_connection(url)
        if connection_ok:
            download_ok = test_url_download(url)
            if download_ok:
                test_save_image_from_url(url) 