# Generated by Django 4.2.8 on 2025-06-24 21:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0014_orderitem_emi_plan'),
    ]

    operations = [
        migrations.AddField(
            model_name='cartitem',
            name='emi_bank',
            field=models.CharField(blank=True, help_text='Bank code for SSLCOMMERZ EMI', max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='cartitem',
            name='emi_type',
            field=models.CharField(blank=True, choices=[('card_emi', 'Card EMI'), ('cardless_emi', 'Cardless EMI')], help_text='Type of EMI', max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='orderitem',
            name='emi_bank',
            field=models.CharField(blank=True, help_text='Bank code for SSLCOMMERZ EMI', max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='orderitem',
            name='emi_type',
            field=models.CharField(blank=True, choices=[('card_emi', 'Card EMI'), ('cardless_emi', 'Cardless EMI')], help_text='Type of EMI', max_length=20, null=True),
        ),
    ]
