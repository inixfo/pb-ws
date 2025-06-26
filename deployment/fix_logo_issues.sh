#!/bin/bash

# Comprehensive script to fix logo and media path issues

echo "========== Starting Logo & Media Path Fix Script =========="
echo "This script will fix issues with logo paths, media directories, and CORS headers"
echo

# 1. Create necessary directories
echo "=== Step 1: Creating required media directories ==="
mkdir -p /usr/share/nginx/html/media/website/logos
chmod -R 755 /usr/share/nginx/html/media
echo "Created and set permissions for /usr/share/nginx/html/media/website/logos"
echo

# 2. Fix nginx CORS headers 
echo "=== Step 2: Fixing CORS headers in nginx.conf ==="
echo "Backing up nginx.conf..."
cp /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak

# Remove duplicate CORS headers
# This header is already being added dynamically based on $http_origin
echo "Removing duplicate CORS headers..."
sed -i 's/add_header '"'"'Access-Control-Allow-Origin'"'"' '"'"'\*'"'"' always;//g' /etc/nginx/conf.d/default.conf

echo "Testing new nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
  echo "Nginx configuration is valid."
  nginx -s reload
  echo "Nginx reloaded successfully."
else
  echo "WARNING: Nginx configuration test failed! Restoring backup..."
  cp /etc/nginx/conf.d/default.conf.bak /etc/nginx/conf.d/default.conf
fi
echo

# 3. Fix URLs in database
echo "=== Step 3: Checking site settings in the database ==="
echo "This script will check for double /media/ paths in the database"

# Execute Python script to fix database paths
cat > /app/fix_paths.py << 'EOF'
from adminpanel.models import SiteSettings
import re

def fix_media_paths():
    print("Fixing media paths in site settings...")
    
    # Get settings
    settings = SiteSettings.objects.first()
    if not settings:
        print("No settings found in database")
        return
    
    # Check for and fix double media paths
    fixed = False
    
    if settings.header_logo and '/media/media/' in settings.header_logo:
        print(f"Fixing header_logo: {settings.header_logo}")
        settings.header_logo = re.sub(r'/media/media/', '/media/', settings.header_logo)
        fixed = True
        
    if settings.footer_logo and '/media/media/' in settings.footer_logo:
        print(f"Fixing footer_logo: {settings.footer_logo}")
        settings.footer_logo = re.sub(r'/media/media/', '/media/', settings.footer_logo)
        fixed = True
        
    if settings.favicon and '/media/media/' in settings.favicon:
        print(f"Fixing favicon: {settings.favicon}")
        settings.favicon = re.sub(r'/media/media/', '/media/', settings.favicon)
        fixed = True
    
    # Save if changes were made
    if fixed:
        settings.save()
        print("Site settings updated successfully")
    else:
        print("No double media paths found in site settings")
    
    # Print current settings
    print("\nCurrent site settings:")
    print(f"- header_logo: {settings.header_logo}")
    print(f"- footer_logo: {settings.footer_logo}")
    print(f"- favicon: {settings.favicon}")

if __name__ == "__main__":
    fix_media_paths()
EOF

echo "Executing Python script to fix paths in database..."
cd /app && python manage.py shell -c "exec(open('fix_paths.py').read())"
echo

# 4. Check for logo files and create test file if needed
echo "=== Step 4: Verifying logo files ==="
if [ -f "/usr/share/nginx/html/media/logo.png" ]; then
  echo "Found logo.png in media root, copying to website/logos directory"
  cp /usr/share/nginx/html/media/logo.png /usr/share/nginx/html/media/website/logos/default_logo.png
else
  echo "Creating test logo file..."
  echo "This is a test file to verify directory permissions" > /usr/share/nginx/html/media/website/logos/test.txt
fi

echo "Listing logo directory contents:"
ls -la /usr/share/nginx/html/media/website/logos
echo

# 5. Final steps
echo "=== Step 5: Final checks ==="
echo "Checking media directory permissions..."
ls -la /usr/share/nginx/html/media
echo

echo "========== Logo & Media Path Fix Script Complete =========="
echo "You should now upload logos in the admin panel and confirm they display correctly."
echo "Remember to check both phonebay.xyz and www.phonebay.xyz domains." 