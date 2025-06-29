# Generated by Django 5.2.1 on 2025-06-06 07:59

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('emi', '0006_emiplan_sslcommerz_bank_id'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='emiplan',
            name='emi_type',
        ),
        migrations.AddField(
            model_name='emiplan',
            name='plan_type',
            field=models.CharField(choices=[('card_emi', 'Card EMI'), ('cardless_emi', 'Cardless EMI')], default='card_emi', help_text='Type of EMI plan', max_length=20),
        ),
        migrations.AlterField(
            model_name='emiplan',
            name='interest_rate',
            field=models.DecimalField(blank=True, decimal_places=2, help_text='Annual interest rate in percentage. Leave blank for SSLCOMMERZ card EMI where bank sets the rate.', max_digits=5, null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)]),
        ),
    ]
