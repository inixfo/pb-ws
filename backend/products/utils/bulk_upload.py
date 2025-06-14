import csv
import io
import pandas as pd
import numpy as np
import openpyxl
from typing import Dict, List, Any, Tuple
from django.db import transaction
from products.models import Product, Category, Brand, ProductField, ProductVariation, ProductImage, User, EMIPlan
from django.core.files.base import ContentFile
import requests
from django.utils.text import slugify


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
    
    # Create a list of column names - Standard Product Fields
    columns = [
        'name', 'description', 'price', 'sale_price', 'stock_quantity', 
        'brand', # Expects Brand Name
        'vendor_email', # New: For assigning vendor
        'is_approved',  # New: Boolean (True/False)
        'emi_available', # Boolean (True/False)
        'emi_plan_ids',  # New: Comma-separated EMI Plan IDs (e.g., "1,2,3")
        # New: Promotional Flags
        'is_trending', 'is_special_offer', 'is_best_seller', 'is_todays_deal'
    ]
    
    # Add dynamic fields (custom fields for the category)
    dynamic_field_details = []
    for group, group_fields in field_groups.items():
        for field in group_fields:
            column_name = f"{field.name}"
            if field.is_required:
                column_name += " *"
            columns.append(column_name)
            dynamic_field_details.append({
                'name': field.name,
                'type': field.field_type,
                'group': field.group,
                'required': field.is_required,
                'options': field.options
            })

    # Add columns for Product Variations (up to 3)
    for i in range(1, 4): # variation_1, variation_2, variation_3
        columns.extend([
            f'variation_{i}_name',
            f'variation_{i}_price',
            f'variation_{i}_stock_quantity',
            f'variation_{i}_sku',
            f'variation_{i}_is_default' # Boolean (True/False)
        ])

    # Add columns for Product Images (up to 3)
    for i in range(1, 4): # image_1, image_2, image_3
        columns.extend([
            f'image_{i}_url',
            f'image_{i}_alt_text',
            f'image_{i}_is_primary' # Boolean (True/False)
        ])
    
    # Create an example row
    example_row = {
        'name': 'Sample Product Name',
        'description': 'Detailed product description here.',
        'price': '1999.99',
        'sale_price': '1799.99',
        'stock_quantity': '100',
        'brand': 'Existing Brand Name', # User needs to ensure this brand exists or will be created
        'vendor_email': 'vendor@example.com', # Email of an existing vendor user
        'is_approved': 'True',
        'emi_available': 'True',
        'emi_plan_ids': '1,2', # Comma-separated IDs of existing EMI Plans
        'is_trending': 'False',
        'is_special_offer': 'True',
        'is_best_seller': 'False',
        'is_todays_deal': 'True'
    }
    
    for field_detail in dynamic_field_details:
        field_name_key = field_detail['name'] # This is the actual key for example_row
        if field_detail['type'] == 'boolean':
            example_row[field_name_key] = 'True' # Or 'False'
        elif field_detail['type'] == 'select' and field_detail['options']:
            options = field_detail['options']
            if isinstance(options, list) and options:
                example_row[field_name_key] = options[0] # Example with the first option
            else:
                example_row[field_name_key] = 'Select valid option'
        elif field_detail['type'] == 'multi_select' and field_detail['options']:
            options = field_detail['options']
            if isinstance(options, list) and len(options) >= 2:
                example_row[field_name_key] = f"{options[0]},{options[1]}" # Example with first two
            elif isinstance(options, list) and len(options) == 1:
                example_row[field_name_key] = options[0]
            else:
                example_row[field_name_key] = 'OptionA,OptionB'
        elif field_detail['type'] == 'number':
            example_row[field_name_key] = '123'
        else: # Text or other types
            example_row[field_name_key] = f'Sample {field_detail["name"]}'

    # Example data for variations and images
    for i in range(1, 4):
        if i == 1: # Fill first variation/image with more specific examples
            example_row[f'variation_{i}_name'] = 'Red, Large'
            example_row[f'variation_{i}_price'] = '2099.99'
            example_row[f'variation_{i}_stock_quantity'] = '50'
            example_row[f'variation_{i}_sku'] = 'SAMPLE-RED-L'
            example_row[f'variation_{i}_is_default'] = 'True'

            example_row[f'image_{i}_url'] = 'http://example.com/path/to/image1.jpg'
            example_row[f'image_{i}_alt_text'] = 'Main product image'
            example_row[f'image_{i}_is_primary'] = 'True'
        else: # Subsequent variations/images can be blank or have placeholder text
            example_row[f'variation_{i}_name'] = '' # Or 'Blue, Medium'
            example_row[f'variation_{i}_price'] = '' # Or '1999.00'
            example_row[f'variation_{i}_stock_quantity'] = '' # Or '30'
            example_row[f'variation_{i}_sku'] = '' # Or 'SAMPLE-BLUE-M'
            example_row[f'variation_{i}_is_default'] = 'False'

            example_row[f'image_{i}_url'] = '' # Or 'http://example.com/path/to/image2.jpg'
            example_row[f'image_{i}_alt_text'] = '' # Or 'Side view'
            example_row[f'image_{i}_is_primary'] = 'False'
            
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
    """Process an uploaded file and create products, variations, and images."""
    category = Category.objects.get(id=category_id)
    #requesting_user_is_admin = False # This variable was not used
    #if vendor_id is None: # Admin is uploading
    #    pass # Handled by product_data['vendor'] later

    # Read file based on extension
    file_extension = file.name.split('.')[-1].lower()
    
    if file_extension == 'csv':
        df = pd.read_csv(file, encoding='utf-8-sig', dtype=str) # Read all as string initially
    elif file_extension in ['xlsx', 'xls']:
        df = pd.read_excel(file, dtype=str) # Read all as string initially
    else:
        raise ValueError(f"Unsupported file format: {file_extension}")
    
    df = df.replace({np.nan: None}) # Replace pandas NaN with None
    df = df.rename(columns=lambda x: x.strip()) # Strip whitespace from column names

    product_fields = ProductField.objects.filter(category=category)
    field_map = {field.name.strip(): field for field in product_fields}
    
    df.columns = [col.split(' *')[0].strip() if ' *' in col else col.strip() for col in df.columns]
    
    results = []

    for index, row in df.iterrows():
        row_data = {k.strip() if isinstance(k, str) else k: v.strip() if isinstance(v, str) else v for k, v in row.to_dict().items()} # Trim whitespace from keys and string values
        
        current_product_name = row_data.get('name', f'Row {index + 2}')
        product_errors = []

        try:
            with transaction.atomic(): # Atomic transaction for each product and its related objects
                is_valid, missing_fields = validate_required_fields(row_data, category)
                if not is_valid:
                    product_errors.extend([f"Missing required field: {mf}" for mf in missing_fields])
                
                # Vendor handling
                vendor_email = row_data.get('vendor_email')
                product_vendor = None
                if vendor_email:
                    try:
                        product_vendor = User.objects.get(email=vendor_email, role='vendor')
                    except User.DoesNotExist:
                        product_errors.append(f"Vendor with email '{vendor_email}' not found.")
                elif vendor_id: # If uploading user is a vendor (vendor_id is vendor_profile.id)
                    try:
                        product_vendor = User.objects.get(vendor_profile__id=vendor_id) # Corrected lookup
                    except User.DoesNotExist:
                        product_errors.append(f"User for vendor profile ID {vendor_id} not found.")
                    except AttributeError: # In case User model doesn't have vendor_profile or it's misconfigured
                        product_errors.append(f"Vendor profile linkage error for ID {vendor_id}.")
                else: # Admin uploading, and no vendor_email specified
                    # This implies the product is for the platform itself or vendor must be specified
                    # Depending on business logic, this might be an error or allowed if Product.vendor can be null
                    # For now, let's assume if an admin uploads, vendor_email in sheet is optional (product belongs to platform)
                    # If Product.vendor cannot be null, this needs adjustment or check model `null=True/False`
                    pass # If Product.vendor can be null or have a default platform owner

                # Basic fields processing
                brand_name = row_data.get('brand')
                brand = None
                if brand_name:
                    brand, _ = Brand.objects.get_or_create(name=brand_name, defaults={'slug': slugify(brand_name)})
                else:
                    product_errors.append("Brand name is required.")

                base_price_str = row_data.get('price')
                base_price = None
                try:
                    if base_price_str is not None and base_price_str != '':
                        base_price = float(base_price_str)
                    else:
                         product_errors.append("Base Price (column 'price') is required.")
                except ValueError:
                    product_errors.append(f"Invalid base price: {base_price_str}")

                stock_quantity_str = row_data.get('stock_quantity')
                stock_quantity = 0 # Default if not specified and no variations
                try:
                    if stock_quantity_str is not None and stock_quantity_str != '':
                        stock_quantity = int(stock_quantity_str)
                except ValueError:
                     product_errors.append(f"Invalid stock quantity: {stock_quantity_str}")
                
                if product_errors: # If basic errors found, record and skip to next row
                    results.append({
                        'row': index + 2,
                        'status': 'error',
                        'product_name': current_product_name,
                        'errors': "; ".join(product_errors)
                    })
                    continue

                product_data = {
                    'name': row_data.get('name'),
                    'slug': slugify(row_data.get('name')),
                    'description': row_data.get('description', ''),
                    'base_price': base_price,
                    'sale_price': float(row_data.get('sale_price')) if row_data.get('sale_price') else None,
                    'stock_quantity': stock_quantity, 
                    'category': category,
                    'brand': brand,
                    'vendor': product_vendor, # May be None if admin uploads for platform & Product.vendor allows null
                    'is_approved': str(row_data.get('is_approved', 'False')).lower() == 'true',
                    'emi_available': str(row_data.get('emi_available', 'False')).lower() == 'true',
                    'is_trending': str(row_data.get('is_trending', 'False')).lower() == 'true',
                    'is_special_offer': str(row_data.get('is_special_offer', 'False')).lower() == 'true',
                    'is_best_seller': str(row_data.get('is_best_seller', 'False')).lower() == 'true',
                    'is_todays_deal': str(row_data.get('is_todays_deal', 'False')).lower() == 'true',
                    'is_available': True 
                }
                
                # Check if product vendor is None and Product.vendor model field doesn't allow null
                if product_vendor is None and not Product._meta.get_field('vendor').null:
                    product_errors.append("Vendor is required for this product. Please specify a 'vendor_email' in the sheet.")
                    # This error should have been caught earlier if it's always required for admin uploads.
                    # Re-evaluating the vendor logic placement or Product.vendor model constraint is needed if this hits.

                if product_errors: # Check again after vendor nullability check
                    results.append({'row': index + 2, 'status': 'error', 'product_name': current_product_name, 'errors': "; ".join(product_errors)})
                    continue

                original_slug = product_data['slug']
                counter = 1
                while Product.objects.filter(slug=product_data['slug']).exists():
                    product_data['slug'] = f"{original_slug}-{counter}"
                    counter += 1
                
                product = Product(**product_data)
                product.save() 

                emi_plan_ids_str = row_data.get('emi_plan_ids', '')
                if emi_plan_ids_str:
                    try:
                        plan_ids = [int(id.strip()) for id in emi_plan_ids_str.split(',') if id.strip().isdigit()]
                        valid_plans = EMIPlan.objects.filter(id__in=plan_ids)
                        product.emi_plans.set(valid_plans)
                    except Exception as e:
                        product_errors.append(f"Error processing EMI Plan IDs '{emi_plan_ids_str}': {str(e)}")

                specs = {}
                for field_name_key, field_obj in field_map.items():
                    if field_name_key in row_data and row_data[field_name_key] is not None and str(row_data[field_name_key]).strip() != '':
                        value = str(row_data[field_name_key]).strip()
                        if field_obj.field_type == 'boolean':
                            value = value.lower() == 'true'
                        elif field_obj.field_type == 'multi_select': # Already a list if from JSON, string if from CSV
                            value = [item.strip() for item in value.split(',')]
                        elif field_obj.field_type == 'number':
                            try:
                                value = float(value)
                            except ValueError:
                                product_errors.append(f"Invalid number for spec '{field_name_key}': {value}")
                                continue 
                        
                        if field_obj.group not in specs:
                            specs[field_obj.group] = {}
                        specs[field_obj.group][field_name_key] = value
                product.specifications = specs
                # product.save() # Save after variations and images, to do it once if possible

                total_variation_stock = 0
                has_variations_defined = False
                for i in range(1, 4):
                    var_name = row_data.get(f'variation_{i}_name')
                    var_price_str = row_data.get(f'variation_{i}_price')
                    var_stock_str = row_data.get(f'variation_{i}_stock_quantity')
                    var_sku = row_data.get(f'variation_{i}_sku')
                    var_is_default_str = row_data.get(f'variation_{i}_is_default', 'False')

                    if var_name and var_price_str and str(var_name).strip() and str(var_price_str).strip():
                        has_variations_defined = True
                        try:
                            var_price = float(str(var_price_str).strip())
                            var_stock = int(str(var_stock_str).strip()) if var_stock_str and str(var_stock_str).strip() else 0
                            total_variation_stock += var_stock
                            var_is_default = str(var_is_default_str).lower() == 'true'
                            
                            ProductVariation.objects.create(
                                product=product,
                                name=str(var_name).strip(),
                                price=var_price,
                                stock_quantity=var_stock,
                                sku=str(var_sku).strip() if var_sku and str(var_sku).strip() else None, 
                                is_default=var_is_default,
                                is_active=True
                            )
                        except ValueError as e:
                            product_errors.append(f"Invalid variation {i} data ('{var_name}'): {str(e)}")
                        except Exception as e:
                            product_errors.append(f"Error creating variation {i} ('{var_name}'): {str(e)}")
                
                if has_variations_defined:
                    product.stock_quantity = total_variation_stock 
                    product.is_available = total_variation_stock > 0
                # else: product.stock_quantity remains as initially set from the main column
                
                # product.save() # Consolidate save after images too

                for i in range(1, 4):
                    img_url = row_data.get(f'image_{i}_url')
                    img_alt = row_data.get(f'image_{i}_alt_text', '')
                    img_is_primary_str = row_data.get(f'image_{i}_is_primary', 'False')

                    if img_url and str(img_url).strip():
                        img_url = str(img_url).strip()
                        try:
                            response = requests.get(img_url, stream=True, timeout=10)
                            response.raise_for_status()
                            file_name = img_url.split('/')[-1].split('?')[0]
                            if not file_name: file_name = f"product_image_{product.id}_{i}.jpg"

                            product_image = ProductImage(product=product, alt_text=str(img_alt).strip(), is_primary=(str(img_is_primary_str).lower() == 'true'))
                            product_image.image.save(file_name, ContentFile(response.content), save=False) # Save False initially
                            product_image.save() # Now save the ProductImage instance
                        
                        except requests.exceptions.RequestException as e:
                            product_errors.append(f"Download failed for image {i} ({img_url}): {str(e)}")
                        except Exception as e:
                            product_errors.append(f"Error saving image {i}: {str(e)}")
                
                product.save() # Final save for product with updated stock/specs

                if product_errors:
                    raise Exception("; ".join(product_errors))

                results.append({
                    'row': index + 2,
                    'status': 'success',
                    'product_id': product.id,
                    'product_name': product.name,
                    'errors': None
                })

        except Exception as e:
            results.append({
                'row': index + 2,
                'status': 'error',
                'product_name': current_product_name, 
                'errors': str(e)
            })
            
    return results 