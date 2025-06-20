# Generated by Django 4.2.8 on 2025-05-26 13:44

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='VendorProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('company_name', models.CharField(max_length=255)),
                ('slug', models.SlugField(max_length=255, unique=True)),
                ('business_email', models.EmailField(max_length=254)),
                ('business_phone', models.CharField(max_length=20)),
                ('tax_id', models.CharField(blank=True, max_length=50, null=True)),
                ('business_address', models.TextField()),
                ('city', models.CharField(max_length=100)),
                ('state', models.CharField(max_length=100)),
                ('postal_code', models.CharField(max_length=20)),
                ('country', models.CharField(max_length=100)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected'), ('suspended', 'Suspended')], default='pending', max_length=20)),
                ('is_featured', models.BooleanField(default=False)),
                ('rating', models.DecimalField(decimal_places=2, default=0.0, max_digits=3)),
                ('business_certificate', models.FileField(blank=True, null=True, upload_to='vendor_documents/certificates/')),
                ('id_proof', models.FileField(blank=True, null=True, upload_to='vendor_documents/id_proofs/')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='vendor_profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='VendorBankAccount',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('account_name', models.CharField(max_length=255)),
                ('account_number', models.CharField(max_length=50)),
                ('bank_name', models.CharField(max_length=255)),
                ('branch_name', models.CharField(max_length=255)),
                ('routing_number', models.CharField(blank=True, max_length=50, null=True)),
                ('swift_code', models.CharField(blank=True, max_length=50, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('vendor', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='bank_account', to='vendors.vendorprofile')),
            ],
        ),
        migrations.CreateModel(
            name='VendorApproval',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='pending', max_length=20)),
                ('admin_notes', models.TextField(blank=True, null=True)),
                ('additional_document1', models.FileField(blank=True, null=True, upload_to='vendor_documents/additional/')),
                ('additional_document2', models.FileField(blank=True, null=True, upload_to='vendor_documents/additional/')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('admin_user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='vendor_approvals', to=settings.AUTH_USER_MODEL)),
                ('vendor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='approval_requests', to='vendors.vendorprofile')),
            ],
        ),
        migrations.CreateModel(
            name='StoreSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('store_name', models.CharField(max_length=255)),
                ('store_description', models.TextField(blank=True, null=True)),
                ('logo', models.ImageField(blank=True, null=True, upload_to='vendor_logos/')),
                ('banner', models.ImageField(blank=True, null=True, upload_to='vendor_banners/')),
                ('support_email', models.EmailField(blank=True, max_length=254, null=True)),
                ('support_phone', models.CharField(blank=True, max_length=20, null=True)),
                ('website', models.URLField(blank=True, null=True)),
                ('facebook', models.URLField(blank=True, null=True)),
                ('instagram', models.URLField(blank=True, null=True)),
                ('twitter', models.URLField(blank=True, null=True)),
                ('enable_emi', models.BooleanField(default=True)),
                ('enable_cod', models.BooleanField(default=True)),
                ('auto_approve_reviews', models.BooleanField(default=False)),
                ('commission_rate', models.DecimalField(decimal_places=2, default=10.0, max_digits=5)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('vendor', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='store_settings', to='vendors.vendorprofile')),
            ],
        ),
    ]
