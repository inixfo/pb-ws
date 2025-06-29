# Generated by Django 4.2 on 2024-06-05 12:00

from django.db import migrations, models
import products.models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0005_remove_thumbnail_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='productimage',
            name='thumbnail_small',
            field=models.ImageField(blank=True, null=True, upload_to=products.models.product_image_path),
        ),
        migrations.AddField(
            model_name='productimage',
            name='thumbnail_medium',
            field=models.ImageField(blank=True, null=True, upload_to=products.models.product_image_path),
        ),
    ] 