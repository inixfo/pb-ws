from django.core.management.base import BaseCommand
from products.models import Product, ProductVariation
from decimal import Decimal

class Command(BaseCommand):
    help = 'Creates sample product variations for the first product'

    def handle(self, *args, **options):
        product = Product.objects.first()
        if not product:
            self.stdout.write(self.style.ERROR('No products found in database'))
            return

        self.stdout.write(f'Creating variations for product: {product.name}')
        
        base_price = Decimal('1000.00')
        
        variations = [
            {
                'name': '4GB + 64GB',
                'price': base_price,
                'stock_quantity': 10,
                'is_default': True
            },
            {
                'name': '6GB + 128GB',
                'price': base_price * Decimal('1.2'),
                'stock_quantity': 15,
                'is_default': False
            },
            {
                'name': '8GB + 256GB',
                'price': base_price * Decimal('1.5'),
                'stock_quantity': 8,
                'is_default': False
            }
        ]

        for variation_data in variations:
            variation = ProductVariation.objects.create(
                product=product,
                **variation_data
            )
            self.stdout.write(self.style.SUCCESS(
                f'Created variation: {variation.name} at price ₹{variation.price}'
            )) 