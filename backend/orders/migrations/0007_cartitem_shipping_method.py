# Generated by Django 4.2.8 on 2025-06-03 11:07

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0006_remove_emirecord_order_remove_emirecord_plan_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='cartitem',
            name='shipping_method',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
