# Generated by Django 4.2.8 on 2025-06-01 01:50

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('emi', '0002_remove_emiplan_max_months_remove_emiplan_min_months_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='emiplan',
            name='max_months',
            field=models.PositiveIntegerField(default=24, help_text='Maximum number of months for EMI', validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(60)]),
        ),
        migrations.AddField(
            model_name='emiplan',
            name='min_months',
            field=models.PositiveIntegerField(default=3, help_text='Minimum number of months for EMI', validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(60)]),
        ),
    ]
