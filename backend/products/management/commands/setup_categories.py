from django.core.management.base import BaseCommand
from django.utils.text import slugify
from products.models import Category, ProductField
import json


class Command(BaseCommand):
    help = 'Set up product categories and their dynamic fields'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Setting up product categories and fields...'))
        
        # Create categories
        categories = [
            {
                'name': 'Bikes',
                'description': 'Motorcycles and scooters',
                'fields': self._get_bike_fields()
            },
            {
                'name': 'TV',
                'description': 'Television sets',
                'fields': self._get_tv_fields()
            },
            {
                'name': 'Refrigerator',
                'description': 'Refrigerators and freezers',
                'fields': self._get_refrigerator_fields()
            },
            {
                'name': 'Washing Machine',
                'description': 'Washing machines and dryers',
                'fields': self._get_washing_machine_fields()
            },
            {
                'name': 'AC',
                'description': 'Air conditioners',
                'fields': self._get_ac_fields()
            },
            {
                'name': 'Mobile Phones',
                'description': 'Smartphones and feature phones',
                'fields': self._get_mobile_phone_fields()
            }
        ]
        
        for category_data in categories:
            category, created = Category.objects.get_or_create(
                name=category_data['name'],
                defaults={
                    'slug': slugify(category_data['name']),
                    'description': category_data['description'],
                    'is_active': True
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created category: {category.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'Category already exists: {category.name}'))
            
            # Create fields for this category
            for field_data in category_data['fields']:
                field, created = ProductField.objects.get_or_create(
                    category=category,
                    name=field_data['name'],
                    defaults={
                        'field_type': field_data['field_type'],
                        'group': field_data['group'],
                        'options': field_data.get('options'),
                        'is_required': field_data.get('is_required', False),
                        'is_filter': field_data.get('is_filter', False),
                        'display_order': field_data.get('display_order', 0)
                    }
                )
                
                if created:
                    self.stdout.write(f'  - Added field: {field.name}')
        
        self.stdout.write(self.style.SUCCESS('Categories and fields setup complete!'))
    
    def _get_bike_fields(self):
        """Define fields for Bikes category."""
        return [
            # General
            {'name': 'Brand', 'field_type': 'text', 'group': 'general', 'is_required': True, 'is_filter': True},
            {'name': 'Model Name', 'field_type': 'text', 'group': 'general', 'is_required': True},
            {'name': 'Colors', 'field_type': 'multi_select', 'group': 'general', 'options': ['Red', 'Black', 'Blue', 'White', 'Silver', 'Green', 'Yellow', 'Orange'], 'is_filter': True},
            
            # Specifications
            {'name': 'Engine Type', 'field_type': 'select', 'group': 'specifications', 'options': ['2-Stroke', '4-Stroke', 'Electric'], 'is_filter': True},
            {'name': 'Engine Capacity', 'field_type': 'text', 'group': 'specifications'},
            {'name': 'Fuel Type', 'field_type': 'select', 'group': 'specifications', 'options': ['Petrol', 'Diesel', 'Electric', 'Hybrid'], 'is_filter': True},
            {'name': 'Transmission Type', 'field_type': 'select', 'group': 'specifications', 'options': ['Manual', 'Automatic', 'Semi-Automatic'], 'is_filter': True},
            {'name': 'Max Power', 'field_type': 'text', 'group': 'specifications'},
            {'name': 'Torque', 'field_type': 'text', 'group': 'specifications'},
            {'name': 'Top Speed', 'field_type': 'text', 'group': 'specifications'},
            {'name': 'Mileage', 'field_type': 'text', 'group': 'specifications'},
            {'name': 'Battery Capacity', 'field_type': 'text', 'group': 'specifications'},
            {'name': 'Charging Time', 'field_type': 'text', 'group': 'specifications'},
            
            # Dimensions
            {'name': 'Weight', 'field_type': 'text', 'group': 'dimensions'},
            {'name': 'Ground Clearance', 'field_type': 'text', 'group': 'dimensions'},
            {'name': 'Fuel Tank Capacity', 'field_type': 'text', 'group': 'dimensions'},
            {'name': 'Seat Height', 'field_type': 'text', 'group': 'dimensions'}
        ]
    
    def _get_tv_fields(self):
        """Define fields for TV category."""
        return [
            # General
            {'name': 'Brand', 'field_type': 'text', 'group': 'general', 'is_required': True, 'is_filter': True},
            {'name': 'Model Name', 'field_type': 'text', 'group': 'general', 'is_required': True},
            {'name': 'Screen Size', 'field_type': 'text', 'group': 'general', 'is_required': True, 'is_filter': True},
            {'name': 'Resolution', 'field_type': 'select', 'group': 'general', 'options': ['HD', 'Full HD', '4K', '8K'], 'is_filter': True},
            {'name': 'Panel Type', 'field_type': 'select', 'group': 'general', 'options': ['LED', 'OLED', 'QLED', 'LCD', 'Mini-LED'], 'is_filter': True},
            
            # Display
            {'name': 'Refresh Rate', 'field_type': 'select', 'group': 'display', 'options': ['60Hz', '120Hz', '144Hz', '240Hz'], 'is_filter': True},
            {'name': 'HDR Support', 'field_type': 'boolean', 'group': 'display', 'is_filter': True},
            {'name': 'Brightness', 'field_type': 'text', 'group': 'display'},
            {'name': 'Viewing Angle', 'field_type': 'text', 'group': 'display'},
            
            # Features
            {'name': 'Smart TV', 'field_type': 'boolean', 'group': 'features', 'is_filter': True},
            {'name': 'Operating System', 'field_type': 'select', 'group': 'features', 'options': ['Android TV', 'Tizen', 'WebOS', 'Roku', 'Fire TV'], 'is_filter': True},
            {'name': 'Supported Apps', 'field_type': 'text', 'group': 'features'},
            {'name': 'Voice Assistant', 'field_type': 'multi_select', 'group': 'features', 'options': ['Google Assistant', 'Alexa', 'Bixby', 'Siri']},
            
            # Connectivity
            {'name': 'HDMI Ports', 'field_type': 'number', 'group': 'connectivity'},
            {'name': 'USB Ports', 'field_type': 'number', 'group': 'connectivity'},
            {'name': 'Wi-Fi', 'field_type': 'boolean', 'group': 'connectivity', 'is_filter': True},
            {'name': 'Bluetooth', 'field_type': 'boolean', 'group': 'connectivity'},
            {'name': 'Screen Mirroring', 'field_type': 'boolean', 'group': 'connectivity'}
        ]
    
    def _get_refrigerator_fields(self):
        """Define fields for Refrigerator category."""
        return [
            # General
            {'name': 'Brand', 'field_type': 'text', 'group': 'general', 'is_required': True, 'is_filter': True},
            {'name': 'Model Name', 'field_type': 'text', 'group': 'general', 'is_required': True},
            {'name': 'Capacity', 'field_type': 'text', 'group': 'general', 'is_required': True, 'is_filter': True},
            {'name': 'Type', 'field_type': 'select', 'group': 'general', 'options': ['Single Door', 'Double Door', 'Side by Side', 'French Door', 'Bottom Freezer'], 'is_filter': True},
            {'name': 'Energy Rating', 'field_type': 'select', 'group': 'general', 'options': ['1 Star', '2 Star', '3 Star', '4 Star', '5 Star'], 'is_filter': True},
            
            # Features
            {'name': 'Inverter Compressor', 'field_type': 'boolean', 'group': 'features', 'is_filter': True},
            {'name': 'Defrost Type', 'field_type': 'select', 'group': 'features', 'options': ['Direct Cool', 'Frost Free'], 'is_filter': True},
            {'name': 'Temp Control', 'field_type': 'boolean', 'group': 'features'},
            {'name': 'Door Alarm', 'field_type': 'boolean', 'group': 'features'},
            {'name': 'Child Lock', 'field_type': 'boolean', 'group': 'features'},
            
            # Compartments
            {'name': 'Freezer Capacity', 'field_type': 'text', 'group': 'compartments'},
            {'name': 'Fridge Capacity', 'field_type': 'text', 'group': 'compartments'},
            {'name': 'Shelves', 'field_type': 'number', 'group': 'compartments'},
            {'name': 'Shelf Type', 'field_type': 'select', 'group': 'compartments', 'options': ['Glass', 'Wire', 'Plastic']},
            {'name': 'Ice Dispenser', 'field_type': 'boolean', 'group': 'compartments', 'is_filter': True}
        ]
    
    def _get_washing_machine_fields(self):
        """Define fields for Washing Machine category."""
        return [
            # General
            {'name': 'Brand', 'field_type': 'text', 'group': 'general', 'is_required': True, 'is_filter': True},
            {'name': 'Model Name', 'field_type': 'text', 'group': 'general', 'is_required': True},
            {'name': 'Washer Type', 'field_type': 'select', 'group': 'general', 'options': ['Top Load', 'Front Load', 'Semi-Automatic'], 'is_required': True, 'is_filter': True},
            {'name': 'Capacity', 'field_type': 'text', 'group': 'general', 'is_required': True, 'is_filter': True},
            {'name': 'Energy Rating', 'field_type': 'select', 'group': 'general', 'options': ['1 Star', '2 Star', '3 Star', '4 Star', '5 Star'], 'is_filter': True},
            
            # Features
            {'name': 'Inverter Motor', 'field_type': 'boolean', 'group': 'features', 'is_filter': True},
            {'name': 'Spin Speed', 'field_type': 'text', 'group': 'features'},
            {'name': 'Wash Programs', 'field_type': 'number', 'group': 'features'},
            {'name': 'Drum Material', 'field_type': 'select', 'group': 'features', 'options': ['Stainless Steel', 'Plastic', 'Porcelain Enamel']},
            {'name': 'Noise Level', 'field_type': 'text', 'group': 'features'},
            {'name': 'Child Lock', 'field_type': 'boolean', 'group': 'features'},
            {'name': 'Smart Diagnosis', 'field_type': 'boolean', 'group': 'features'},
            
            # Connectivity
            {'name': 'Wi-Fi Enabled', 'field_type': 'boolean', 'group': 'connectivity', 'is_filter': True},
            {'name': 'App Control', 'field_type': 'boolean', 'group': 'connectivity'}
        ]
    
    def _get_ac_fields(self):
        """Define fields for AC (Air Conditioner) category."""
        return [
            # General
            {'name': 'Brand', 'field_type': 'text', 'group': 'general', 'is_required': True, 'is_filter': True},
            {'name': 'Model Name', 'field_type': 'text', 'group': 'general', 'is_required': True},
            {'name': 'Type', 'field_type': 'select', 'group': 'general', 'options': ['Split AC', 'Window AC', 'Portable AC', 'Central AC'], 'is_required': True, 'is_filter': True},
            {'name': 'Capacity', 'field_type': 'text', 'group': 'general', 'is_required': True, 'is_filter': True},
            {'name': 'Energy Rating', 'field_type': 'select', 'group': 'general', 'options': ['1 Star', '2 Star', '3 Star', '4 Star', '5 Star'], 'is_filter': True},
            
            # Features
            {'name': 'Inverter Compressor', 'field_type': 'boolean', 'group': 'features', 'is_filter': True},
            {'name': 'Cooling Capacity', 'field_type': 'text', 'group': 'features'},
            {'name': 'Noise Level', 'field_type': 'text', 'group': 'features'},
            {'name': 'Refrigerant Type', 'field_type': 'select', 'group': 'features', 'options': ['R32', 'R410A', 'R22']},
            {'name': 'Dehumidifier', 'field_type': 'boolean', 'group': 'features'},
            {'name': 'Air Purifier', 'field_type': 'boolean', 'group': 'features', 'is_filter': True},
            
            # Convenience
            {'name': 'Auto Restart', 'field_type': 'boolean', 'group': 'convenience'},
            {'name': 'Sleep Mode', 'field_type': 'boolean', 'group': 'convenience'},
            {'name': 'Remote Control', 'field_type': 'boolean', 'group': 'convenience'},
            {'name': 'Smart AC', 'field_type': 'boolean', 'group': 'convenience', 'is_filter': True}
        ]
    
    def _get_mobile_phone_fields(self):
        """Define fields for Mobile Phones category."""
        return [
            # General
            {'name': 'Brand', 'field_type': 'text', 'group': 'general', 'is_required': True, 'is_filter': True},
            {'name': 'Model Name', 'field_type': 'text', 'group': 'general', 'is_required': True},
            {'name': 'OS Type', 'field_type': 'select', 'group': 'general', 'options': ['Android', 'iOS', 'Other'], 'is_required': True, 'is_filter': True},
            {'name': 'Variants', 'field_type': 'text', 'group': 'general'},
            {'name': 'Colors', 'field_type': 'multi_select', 'group': 'general', 'options': ['Black', 'White', 'Blue', 'Red', 'Green', 'Gold', 'Silver', 'Purple'], 'is_filter': True},
            {'name': 'Release Year', 'field_type': 'number', 'group': 'general', 'is_filter': True},
            
            # Hardware
            {'name': 'Processor', 'field_type': 'text', 'group': 'hardware', 'is_filter': True},
            {'name': 'RAM', 'field_type': 'select', 'group': 'hardware', 'options': ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB'], 'is_filter': True},
            {'name': 'Storage', 'field_type': 'select', 'group': 'hardware', 'options': ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB'], 'is_filter': True},
            {'name': 'Battery', 'field_type': 'text', 'group': 'hardware'},
            {'name': 'Charging Type', 'field_type': 'select', 'group': 'hardware', 'options': ['USB-C', 'Lightning', 'Micro USB', 'Wireless']},
            {'name': 'Wireless Charging', 'field_type': 'boolean', 'group': 'hardware', 'is_filter': True},
            {'name': 'Reverse Charging', 'field_type': 'boolean', 'group': 'hardware'},
            
            # Display
            {'name': 'Display Size', 'field_type': 'text', 'group': 'display', 'is_filter': True},
            {'name': 'Resolution', 'field_type': 'text', 'group': 'display'},
            {'name': 'Display Type', 'field_type': 'select', 'group': 'display', 'options': ['LCD', 'OLED', 'AMOLED', 'Super AMOLED', 'IPS LCD'], 'is_filter': True},
            {'name': 'Refresh Rate', 'field_type': 'select', 'group': 'display', 'options': ['60Hz', '90Hz', '120Hz', '144Hz'], 'is_filter': True},
            {'name': 'HDR', 'field_type': 'boolean', 'group': 'display'},
            {'name': 'Touch Rate', 'field_type': 'text', 'group': 'display'},
            {'name': 'Glass Protection', 'field_type': 'text', 'group': 'display'},
            
            # Camera
            {'name': 'Rear Camera Specs', 'field_type': 'text', 'group': 'camera'},
            {'name': 'Front Camera Specs', 'field_type': 'text', 'group': 'camera'},
            {'name': 'Zoom', 'field_type': 'text', 'group': 'camera'},
            {'name': 'Flash', 'field_type': 'boolean', 'group': 'camera'},
            {'name': 'Video Recording', 'field_type': 'text', 'group': 'camera'},
            
            # Connectivity
            {'name': '5G', 'field_type': 'boolean', 'group': 'connectivity', 'is_filter': True},
            {'name': 'Wi-Fi', 'field_type': 'boolean', 'group': 'connectivity'},
            {'name': 'Bluetooth', 'field_type': 'text', 'group': 'connectivity'},
            {'name': 'GPS', 'field_type': 'boolean', 'group': 'connectivity'},
            {'name': 'SIM', 'field_type': 'select', 'group': 'connectivity', 'options': ['Single SIM', 'Dual SIM', 'eSIM']},
            {'name': 'ESIM', 'field_type': 'boolean', 'group': 'connectivity'},
            
            # Sensors
            {'name': 'Fingerprint', 'field_type': 'boolean', 'group': 'sensors', 'is_filter': True},
            {'name': 'Face Unlock', 'field_type': 'boolean', 'group': 'sensors'},
            {'name': 'Accelerometer', 'field_type': 'boolean', 'group': 'sensors'},
            {'name': 'Gyro', 'field_type': 'boolean', 'group': 'sensors'},
            {'name': 'Proximity', 'field_type': 'boolean', 'group': 'sensors'},
            {'name': 'Barometer', 'field_type': 'boolean', 'group': 'sensors'},
            
            # Box
            {'name': 'Charger', 'field_type': 'boolean', 'group': 'box'},
            {'name': 'Cable', 'field_type': 'boolean', 'group': 'box'},
            {'name': 'Earphones', 'field_type': 'boolean', 'group': 'box'},
            {'name': 'Case', 'field_type': 'boolean', 'group': 'box'}
        ] 