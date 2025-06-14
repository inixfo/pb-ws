import csv
import io
import pandas as pd
import numpy as np
import openpyxl
from typing import Dict, List, Any, Tuple
from django.db import transaction

from products.models import Product, Category, Brand, ProductField


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
    
    # Create a list of column names
    columns = ['name', 'description', 'price', 'sale_price', 'stock_quantity', 
               'brand', 'emi_available', 'emi_plan_ids']
    
    # Add dynamic fields
    dynamic_fields = []
    for group, group_fields in field_groups.items():
        for field in group_fields:
            column_name = f"{field.name}"
            if field.is_required:
                column_name += " *"
            columns.append(column_name)
            dynamic_fields.append({
                'name': field.name,
                'type': field.field_type,
                'group': field.group,
                'required': field.is_required,
                'options': field.options
            })
    
    # Create an example row
    example_row = {
        'name': 'Product Name',
        'description': 'Product Description',
        'price': '1000.00',
        'sale_price': '900.00',
        'stock_quantity': '100',
        'brand': 'Brand Name',
        'emi_available': 'True',
        'emi_plan_ids': '1,2,3'  # Comma-separated EMI plan IDs
    }
    
    for field in dynamic_fields:
        if field['type'] == 'boolean':
            example_row[field['name']] = 'True/False'
        elif field['type'] == 'select' and field['options']:
            options = field['options']
            if isinstance(options, list) and options:
                example_row[field['name']] = options[0]
            else:
                example_row[field['name']] = 'Select an option'
        elif field['type'] == 'multi_select' and field['options']:
            options = field['options']
            if isinstance(options, list) and len(options) >= 2:
                example_row[field['name']] = f"{options[0]}, {options[1]}"
            else:
                example_row[field['name']] = 'Option1, Option2'
        elif field['type'] == 'number':
            example_row[field['name']] = '0'
        else:
            example_row[field['name']] = f'Sample {field["name"]}'
    
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
                
                # Extract basic product fields
                basic_fields = {
                    'name': row_data.get('name'),
                    'description': row_data.get('description', ''),
                    'price': row_data.get('price'),
                    'sale_price': row_data.get('sale_price'),
                    'stock_quantity': row_data.get('stock_quantity', 0),
                    'category': category,
                    'brand': brand,
                    'vendor_id': vendor_id,
                    'emi_available': row_data.get('emi_available', 'False').lower() == 'true',
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
                            value = str(value).lower() == 'true'
                        elif field.field_type == 'multi_select' and isinstance(value, str):
                            value = [item.strip() for item in value.split(',')]
                        
                        # Add to specs
                        if field.group not in specs:
                            specs[field.group] = {}
                        specs[field.group][field_name] = value
                
                # Save specifications
                product.specifications = specs
                product.save()
                
                results.append({
                    'row': index + 2,
                    'status': 'success',
                    'product_id': product.id,
                    'product_name': product.name
                })
                
            except Exception as e:
                results.append({
                    'row': index + 2,
                    'status': 'error',
                    'errors': str(e),
                    'data': row_data
                })
    
    return results 