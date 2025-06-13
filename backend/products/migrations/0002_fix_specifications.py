from django.db import migrations
import json

def fix_specifications(apps, schema_editor):
    Product = apps.get_model('products', 'Product')
    for product in Product.objects.all():
        if isinstance(product.specifications, str):
            try:
                product.specifications = json.loads(product.specifications)
                product.save()
            except json.JSONDecodeError:
                # If the string is not valid JSON, set to empty dict
                product.specifications = {}
                product.save()

def reverse_specifications(apps, schema_editor):
    # No need to reverse this migration
    pass

class Migration(migrations.Migration):
    dependencies = [
        ('products', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(fix_specifications, reverse_specifications),
    ] 