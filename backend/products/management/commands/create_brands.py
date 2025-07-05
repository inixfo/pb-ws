from django.core.management.base import BaseCommand
from django.utils.text import slugify
from products.models import Brand, Category
from django.core.files.base import ContentFile
import requests

class Command(BaseCommand):
    help = 'Create predefined brands in the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--assign-categories',
            action='store_true',
            help='Assign categories to brands',
        )
        parser.add_argument(
            '--skip-logos',
            action='store_true',
            help='Skip downloading logos',
        )

    def handle(self, *args, **options):
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
        
        brands_created = 0
        brands_skipped = 0
        
        self.stdout.write(self.style.SUCCESS("Creating brands..."))
        
        for brand_info in BRANDS:
            brand_name = brand_info["name"]
            logo_url = brand_info["logo_url"]
            slug = slugify(brand_name)
            
            # Check if brand already exists
            if Brand.objects.filter(slug=slug).exists():
                self.stdout.write(f"Brand '{brand_name}' already exists, skipping.")
                brands_skipped += 1
                continue
            
            # Create brand
            brand = Brand(
                name=brand_name,
                slug=slug,
                description=f"{brand_name} products.",
                is_active=True,
            )
            
            # Download and set the logo if not skipping logos
            if not options['skip_logos']:
                logo_file = self.download_logo(logo_url, brand_name)
                if logo_file:
                    brand.logo.save(f"{slug}.png", logo_file, save=False)
                    self.stdout.write(self.style.SUCCESS(f"Downloaded logo for {brand_name}"))
                else:
                    self.stdout.write(self.style.WARNING(f"Could not download logo for {brand_name}"))
            
            brand.save()
            self.stdout.write(self.style.SUCCESS(f"Created brand: {brand.name}"))
            brands_created += 1
        
        self.stdout.write("\nBrands creation complete.")
        self.stdout.write(f"Created: {brands_created}")
        self.stdout.write(f"Skipped: {brands_skipped}")
        self.stdout.write(f"Total brands in database: {Brand.objects.count()}")
        
        # Assign categories if requested
        if options['assign_categories']:
            self.assign_categories_to_brands()
    
    def download_logo(self, url, brand_name):
        """Download logo from URL and return as ContentFile."""
        try:
            self.stdout.write(f"Downloading logo for {brand_name}...")
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
                self.stdout.write(self.style.ERROR(
                    f"Failed to download logo for {brand_name}: HTTP {response.status_code}"
                ))
                return None
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error downloading logo for {brand_name}: {str(e)}"))
            return None
    
    def assign_categories_to_brands(self):
        """Assign categories to brands."""
        self.stdout.write(self.style.SUCCESS("\nAssigning categories to brands..."))
        
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
                    self.stdout.write(self.style.SUCCESS(f"Added {brand_name} to Smartphones category"))
                except Brand.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f"Brand {brand_name} not found"))
                    
            # Assign vehicle brands to Vehicles category if it exists
            try:
                vehicles_category = Category.objects.get(name="Vehicles")
                vehicle_brands = ["Hero", "Bajaj"]
                
                for brand_name in vehicle_brands:
                    try:
                        brand = Brand.objects.get(name=brand_name)
                        brand.categories.add(vehicles_category)
                        self.stdout.write(self.style.SUCCESS(f"Added {brand_name} to Vehicles category"))
                    except Brand.DoesNotExist:
                        self.stdout.write(self.style.WARNING(f"Brand {brand_name} not found"))
            except Category.DoesNotExist:
                self.stdout.write(self.style.WARNING("Vehicles category not found"))
                
        except Category.DoesNotExist:
            self.stdout.write(self.style.WARNING("Smartphones category not found")) 