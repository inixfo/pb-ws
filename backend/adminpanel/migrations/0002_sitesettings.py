# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('adminpanel', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='SiteSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('header_logo', models.ImageField(blank=True, help_text='Logo displayed in the site header (recommended size: 141x40px)', null=True, upload_to='website/logos/')),
                ('footer_logo', models.ImageField(blank=True, help_text='Logo displayed in the site footer (recommended size: 96x40px)', null=True, upload_to='website/logos/')),
                ('favicon', models.ImageField(blank=True, help_text='Site favicon (recommended size: 32x32px)', null=True, upload_to='website/logos/')),
                ('site_name', models.CharField(default='Phone Bay', max_length=100)),
                ('site_description', models.TextField(blank=True)),
                ('contact_email', models.EmailField(blank=True, max_length=254)),
                ('contact_phone', models.CharField(blank=True, max_length=20)),
                ('address', models.TextField(blank=True)),
                ('facebook_url', models.URLField(blank=True)),
                ('twitter_url', models.URLField(blank=True)),
                ('instagram_url', models.URLField(blank=True)),
                ('linkedin_url', models.URLField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Site Settings',
                'verbose_name_plural': 'Site Settings',
            },
        ),
    ] 