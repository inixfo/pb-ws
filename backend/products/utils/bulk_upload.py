import csv
import io
import pandas as pd
import numpy as np
import openpyxl
import requests
import os
from urllib.parse import urlparse
from django.core.files import File
from django.core.files.temp import NamedTemporaryFile
from typing import Dict, List, Any, Tuple
from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils.text import slugify

from products.models import Product, Category, Brand, ProductField, ProductVariation, ProductImage


def _parse_boolean(value):
    """
    Parse a value as a boolean.
    
    Handles various input types:
    - Boolean: returns as is
    - String: converts 'true', 'yes', '1', 'y' (case insensitive) to True
    - Number: 1 is True, 0 is False
    - None: returns False
    """
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ('true', 'yes', '1', 'y')
    if isinstance(value, (int, float)):
        return bool(value)
    return False


def validate_required_fields(data: Dict[str, Any], category: Category) -> Tuple[bool, List[str]]:
    """Validate that all required fields are present in the data."""
    required_fields = ProductField.objects.filter(
        category=category, 
        is_required=True
    ).values_list('name', flat=True)
    
    missing_fields = []
    for field in required_fields:
        if field not in data or not data[field]:
            missing_fields.append(field)
    
    return len(missing_fields) == 0, missing_fields


def is_url(path):
    """Check if a path is a URL."""
    try:
        result = urlparse(path)
        return all([result.scheme, result.netloc])
    except:
        return False


def save_image_from_path(product, image_path, is_primary=False, display_order=0):
    """Save an image from a path or URL to a ProductImage instance."""
    if not image_path:
        return None
        
    try:
        if is_url(image_path):
            # Handle URL
            img_temp = NamedTemporaryFile(delete=True)
            response = requests.get(image_path, stream=True)
            
            if not response.ok:
                print(f"Failed to download image from URL: {image_path}")
                return None
                
            # Write the image to a temporary file
            for block in response.iter_content(1024 * 8):
                if not block:
                    break
                img_temp.write(block)
                
            img_temp.flush()
            
            # Create the product image
            image = ProductImage.objects.create(
                product=product,
                is_primary=is_primary,
                display_order=display_order
            )
            
            # Get the filename from the URL
            filename = os.path.basename(urlparse(image_path).path)
            if not filename:
                filename = f"image_{display_order}.jpg"
                
            # Save the image file
            image.image.save(filename, File(img_temp))
            print(f"Successfully saved image from URL: {image_path}")
            return image
            
        else:
            # For local file paths, try to handle both Windows and Unix paths
            # and convert to absolute paths if needed
            
            # Try to normalize the path
            normalized_path = os.path.normpath(image_path)
            
            # Check if file exists directly
            if os.path.exists(normalized_path):
                file_path = normalized_path
            else:
                # Try common media locations
                from django.conf import settings
                media_root = getattr(settings, 'MEDIA_ROOT', '')
                base_dir = os.path.dirname(os.path.dirname(os.path.abspath(settings.__file__)))
                
                # List of possible paths to try
                possible_paths = [
                    normalized_path,
                    os.path.join(media_root, normalized_path),
                    os.path.join(base_dir, normalized_path),
                    os.path.join(base_dir, 'media', normalized_path),
                    # For Docker container paths
                    os.path.join('/app/media', os.path.basename(normalized_path)),
                ]
                
                # Try each path
                file_path = None
                for path in possible_paths:
                    if os.path.exists(path):
                        file_path = path
                        break
                
                if not file_path:
                    print(f"Could not find image file: {image_path}")
                    print(f"Tried paths: {possible_paths}")
                    return None
            
            # Create the product image
            image = ProductImage.objects.create(
                product=product,
                is_primary=is_primary,
                display_order=display_order
            )
            
            # Get the filename
            filename = os.path.basename(file_path)
            
            # Open and save the file
            with open(file_path, 'rb') as f:
                image.image.save(filename, File(f))
                
            print(f"Successfully saved image from file: {file_path}")
            return image
            
    except Exception as e:
        print(f"Error saving image: {str(e)}")
        return None


def generate_upload_template(category_id: int, file_format: str = 'csv') -> io.BytesIO:
    """Generate a template file for bulk uploading products based on category."""
    category = Category.objects.get(id=category_id)
    fields = ProductField.objects.filter(category=category).order_by('group', 'display_order')
    
    # Group fields by their group attribute
    field_groups = {}
    for field in fields:
        if field.group not in field_groups:
            field_groups[field.group] = []
        field_groups[field.group].append(field)
    
    # Create a list of column names
    columns = [
        # Basic info
        'name', 'description', 'price', 'sale_price', 'stock_quantity', 'brand', 
        
        # Status fields
        'is_available', 'is_approved', 'vendor_email',
        
        # Promotional fields
        'is_trending', 'is_special_offer', 'is_best_seller', 'is_todays_deal',
        
        # EMI options
        'emi_available', 'emi_plan_ids',
        
        # Product variations (up to 3 variations)
        'variation1_name', 'variation1_price', 'variation1_stock', 'variation1_is_default', 'variation1_is_active',
        'variation2_name', 'variation2_price', 'variation2_stock', 'variation2_is_default', 'variation2_is_active',
        'variation3_name', 'variation3_price', 'variation3_stock', 'variation3_is_default', 'variation3_is_active',
        
        # Product images (up to 3 images)
        'image1_path', 'image1_is_primary',
        'image2_path', 'image2_is_primary',
        'image3_path', 'image3_is_primary',
    ]
    
    # Add dynamic fields
    dynamic_fields = []
    for group, group_fields in field_groups.items():
        for field in group_fields:
            column_name = f"{field.name}"
            if field.is_required:
                column_name += " *"
            columns.append(column_name)
            dynamic_fields.append({
                'name': field.name,            # raw field name (e.g. "Brand")
                'column': column_name,         # actual column in CSV (may include " *")
                'type': field.field_type,
                'group': field.group,
                'required': field.is_required,
                'options': field.options
            })
    
    # Create an example row
    example_row = {
        # Basic info
        'name': 'Sample Product',
        'description': 'This is a sample product description',
        'price': '1000.00',
        'sale_price': '900.00',
        'stock_quantity': '100',
        'brand': 'Sample Brand',
        
        # Status fields
        'is_available': 'True',
        'is_approved': 'True',
        'vendor_email': 'vendor@example.com',
        
        # Promotional fields
        'is_trending': 'False',
        'is_special_offer': 'True',
        'is_best_seller': 'False',
        'is_todays_deal': 'True',
        
        # EMI options
        'emi_available': 'True',
        'emi_plan_ids': '1,2,3',  # Comma-separated EMI plan IDs
        
        # Product variations
        'variation1_name': '128GB Black',
        'variation1_price': '1000.00',
        'variation1_stock': '50',
        'variation1_is_default': 'True',
        'variation1_is_active': 'True',
        
        'variation2_name': '256GB Black',
        'variation2_price': '1200.00',
        'variation2_stock': '30',
        'variation2_is_default': 'False',
        'variation2_is_active': 'True',
        
        'variation3_name': '512GB Black',
        'variation3_price': '1500.00',
        'variation3_stock': '20',
        'variation3_is_default': 'False',
        'variation3_is_active': 'True',
        
        # Product images
        'image1_path': 'C:/path/to/image1.jpg or https://example.com/image1.jpg',
        'image1_is_primary': 'True',
        'image2_path': 'C:/path/to/image2.jpg or https://example.com/image2.jpg',
        'image2_is_primary': 'False',
        'image3_path': 'C:/path/to/image3.jpg or https://example.com/image3.jpg',
        'image3_is_primary': 'False',
    }
    
    # Use the exact column key that was added to columns list
    for field in dynamic_fields:
        key = field['column']
        if field['type'] == 'boolean':
            example_row[key] = 'True/False'
        elif field['type'] == 'select' and field['options']:
            options = field['options']
            if isinstance(options, list) and options:
                example_row[key] = options[0]
            else:
                example_row[key] = 'Select an option'
        elif field['type'] == 'multi_select' and field['options']:
            options = field['options']
            if isinstance(options, list) and len(options) >= 2:
                example_row[key] = f"{options[0]}, {options[1]}"
            else:
                example_row[key] = 'Option1, Option2'
        elif field['type'] == 'number':
            example_row[key] = '0'
        else:
            example_row[key] = f'Sample {field["name"]}'
    
    # Create a template file
    if file_format == 'csv':
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=columns)
        writer.writeheader()
        writer.writerow(example_row)
        
        # Convert to BytesIO for file response
        bytes_output = io.BytesIO()
        bytes_output.write(output.getvalue().encode('utf-8-sig'))  # UTF-8 with BOM for Excel compatibility
        bytes_output.seek(0)
        return bytes_output
    
    elif file_format == 'xlsx':
        df = pd.DataFrame([example_row], columns=columns)
        output = io.BytesIO()
        df.to_excel(output, index=False, engine='openpyxl')
        output.seek(0)
        return output
    
    else:
        raise ValueError(f"Unsupported file format: {file_format}")


def process_upload_file(file, category_id: int, vendor_id: int) -> List[Dict[str, Any]]:
    """Process an uploaded file and create products."""
    User = get_user_model()
    category = Category.objects.get(id=category_id)
    
    # Read file based on extension
    file_extension = file.name.split('.')[-1].lower()
    
    if file_extension == 'csv':
        df = pd.read_csv(file, encoding='utf-8-sig')
    elif file_extension in ['xlsx', 'xls']:
        df = pd.read_excel(file)
    else:
        raise ValueError(f"Unsupported file format: {file_extension}")
    
    # Replace NaN values with None
    df = df.replace({np.nan: None})
    
    # Get all field names for this category
    product_fields = ProductField.objects.filter(category=category)
    field_map = {field.name: field for field in product_fields}
    
    # Clean column names (remove * from required fields)
    df.columns = [col.split(' *')[0] if ' *' in col else col for col in df.columns]
    
    # Process each row
    results = []
    with transaction.atomic():
        for index, row in df.iterrows():
            row_data = row.to_dict()
            
            # Validate required fields
            is_valid, missing_fields = validate_required_fields(row_data, category)
            
            if not is_valid:
                results.append({
                    'row': index + 2,  # +2 for Excel row number (1-based + header)
                    'status': 'error',
                    'errors': f"Missing required fields: {', '.join(missing_fields)}",
                    'data': row_data
                })
                continue
            
            try:
                # Process basic product fields
                brand_name = row_data.get('brand')
                brand, _ = Brand.objects.get_or_create(name=brand_name) if brand_name else (None, False)
                
                # Handle vendor
                vendor = None
                vendor_email = row_data.get('vendor_email')
                if vendor_email:
                    try:
                        user = User.objects.get(email=vendor_email)
                        vendor_id = user.id  # Use the found user's ID
                    except User.DoesNotExist:
                        pass  # Keep using the provided vendor_id
                
                # Generate slug
                product_name = row_data.get('name')
                slug = slugify(product_name)
                
                # Ensure slug uniqueness
                base_slug = slug
                counter = 1
                while Product.objects.filter(slug=slug).exists():
                    slug = f"{base_slug}-{counter}"
                    counter += 1
                
                # Extract basic product fields
                basic_fields = {
                    'name': product_name,
                    'slug': slug,  # Add the generated slug
                    'description': row_data.get('description', ''),
                    'base_price': row_data.get('price'),
                    'sale_price': row_data.get('sale_price'),
                    'stock_quantity': row_data.get('stock_quantity', 0),
                    'category': category,
                    'brand': brand,
                    'vendor_id': vendor_id,  # Use the vendor_id directly
                    'is_available': _parse_boolean(row_data.get('is_available', 'True')),
                    'is_approved': _parse_boolean(row_data.get('is_approved', 'False')),
                    'emi_available': _parse_boolean(row_data.get('emi_available', 'False')),
                    
                    # Promotional fields
                    'is_trending': _parse_boolean(row_data.get('is_trending', 'False')),
                    'is_special_offer': _parse_boolean(row_data.get('is_special_offer', 'False')),
                    'is_best_seller': _parse_boolean(row_data.get('is_best_seller', 'False')),
                    'is_todays_deal': _parse_boolean(row_data.get('is_todays_deal', 'False')),
                }
                
                # Create product
                product = Product.objects.create(**basic_fields)
                
                # Add EMI plans if specified
                emi_plan_ids = row_data.get('emi_plan_ids', '').strip()
                if emi_plan_ids:
                    try:
                        plan_ids = [int(id.strip()) for id in emi_plan_ids.split(',')]
                        product.emi_plans.set(plan_ids)
                    except (ValueError, TypeError):
                        pass  # Invalid EMI plan IDs, skip them
                
                # Process dynamic fields
                specs = {}
                for field_name, field in field_map.items():
                    if field_name in row_data and row_data[field_name] is not None:
                        value = row_data[field_name]
                        
                        # Convert types based on field type
                        if field.field_type == 'boolean':
                            value = _parse_boolean(value)
                        elif field.field_type == 'multi_select' and isinstance(value, str):
                            value = [item.strip() for item in value.split(',')]
                        
                        # Add to specifications
                        specs[field.name] = value
                
                # Save specifications
                product.specifications = specs
                product.save()
                
                # Process product variations
                for i in range(1, 4):  # Handle up to 3 variations
                    var_name = row_data.get(f'variation{i}_name')
                    if var_name:
                        try:
                            var_price = float(row_data.get(f'variation{i}_price', 0))
                            var_stock = int(row_data.get(f'variation{i}_stock', 0))
                            var_is_default = _parse_boolean(row_data.get(f'variation{i}_is_default', 'False'))
                            var_is_active = _parse_boolean(row_data.get(f'variation{i}_is_active', 'True'))
                            
                            # Create variation
                            ProductVariation.objects.create(
                                product=product,
                                name=var_name,
                                price=var_price,
                                stock_quantity=var_stock,
                                is_default=var_is_default,
                                is_active=var_is_active
                            )
                        except (ValueError, TypeError):
                            # Skip invalid variations
                            pass
                
                # Process product images
                for i in range(1, 4):  # Handle up to 3 images
                    img_path = row_data.get(f'image{i}_path')
                    if img_path:
                        try:
                            img_is_primary = _parse_boolean(row_data.get(f'image{i}_is_primary', 'False'))
                            
                            # Debug image path
                            print(f"Processing image path: {img_path}")
                            
                            # Try multiple approaches to save the image
                            image = None
                            
                            # 1. Try direct URL or file path
                            image = save_image_from_path(
                                product=product,
                                image_path=img_path,
                                is_primary=img_is_primary,
                                display_order=i
                            )
                            
                            # 2. If that fails, try treating it as a relative path in the media directory
                            if not image:
                                from django.conf import settings
                                media_root = getattr(settings, 'MEDIA_ROOT', '')
                                relative_path = img_path.replace('\\', '/').lstrip('/')
                                full_path = os.path.join(media_root, relative_path)
                                
                                if os.path.exists(full_path):
                                    image = ProductImage.objects.create(
                                        product=product,
                                        is_primary=img_is_primary,
                                        display_order=i
                                    )
                                    with open(full_path, 'rb') as f:
                                        filename = os.path.basename(full_path)
                                        image.image.save(filename, File(f))
                                    print(f"Saved image using media root path: {full_path}")
                            
                            # 3. For Docker deployment, try container path
                            if not image:
                                docker_path = f"/app/media/{os.path.basename(img_path)}"
                                if os.path.exists(docker_path):
                                    image = ProductImage.objects.create(
                                        product=product,
                                        is_primary=img_is_primary,
                                        display_order=i
                                    )
                                    with open(docker_path, 'rb') as f:
                                        filename = os.path.basename(docker_path)
                                        image.image.save(filename, File(f))
                                    print(f"Saved image using Docker container path: {docker_path}")
                                    
                            # 4. Try to copy the file to the media directory and then use it
                            if not image:
                                try:
                                    # Try to find the file in various locations
                                    base_name = os.path.basename(img_path)
                                    possible_paths = [
                                        img_path,  # Original path
                                        os.path.abspath(img_path),  # Absolute path
                                        os.path.join(os.getcwd(), img_path),  # Current working directory
                                        os.path.join(os.getcwd(), 'media', base_name),  # Media in current directory
                                        os.path.join(os.path.dirname(os.getcwd()), img_path),  # Parent directory
                                    ]
                                    
                                    source_path = None
                                    for path in possible_paths:
                                        if os.path.exists(path):
                                            source_path = path
                                            break
                                    
                                    if source_path:
                                        # Create the product image
                                        image = ProductImage.objects.create(
                                            product=product,
                                            is_primary=img_is_primary,
                                            display_order=i
                                        )
                                        
                                        # Save directly from the file
                                        with open(source_path, 'rb') as f:
                                            image.image.save(base_name, File(f))
                                            
                                        print(f"Saved image by finding and copying from: {source_path}")
                                except Exception as copy_error:
                                    print(f"Error copying image: {str(copy_error)}")
                            
                            # 5. If the path looks like a URL but wasn't detected as one, try it explicitly
                            if not image and ('http://' in img_path or 'https://' in img_path):
                                try:
                                    img_temp = NamedTemporaryFile(delete=True)
                                    response = requests.get(img_path, stream=True)
                                    
                                    if response.ok:
                                        # Write the image to a temporary file
                                        for block in response.iter_content(1024 * 8):
                                            if not block:
                                                break
                                            img_temp.write(block)
                                            
                                        img_temp.flush()
                                        
                                        # Create the product image
                                        image = ProductImage.objects.create(
                                            product=product,
                                            is_primary=img_is_primary,
                                            display_order=i
                                        )
                                        
                                        # Get the filename from the URL
                                        filename = os.path.basename(urlparse(img_path).path)
                                        if not filename:
                                            filename = f"image_{i}.jpg"
                                            
                                        # Save the image file
                                        image.image.save(filename, File(img_temp))
                                        print(f"Successfully saved image from URL (direct method): {img_path}")
                                except Exception as url_error:
                                    print(f"Error downloading image from URL: {str(url_error)}")
                            
                            if not image:
                                print(f"Failed to save image from path: {img_path}")
                                print(f"Current working directory: {os.getcwd()}")
                                print(f"Media root: {getattr(settings, 'MEDIA_ROOT', 'Not set')}")
                                print(f"File exists check: {os.path.exists(img_path)}")
                        except Exception as e:
                            # Log image errors
                            print(f"Error processing image {i}: {str(e)}")
                            # Skip invalid images
                            pass
                
                # Add success result
                results.append({
                    'row': index + 2,
                    'status': 'success',
                    'product_id': product.id,
                    'product_name': product.name
                })
                
            except Exception as e:
                # Add error result
                results.append({
                    'row': index + 2,
                    'status': 'error',
                    'errors': str(e),
                    'data': row_data
                })
                
    return results 