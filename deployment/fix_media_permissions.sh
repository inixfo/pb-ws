#!/bin/bash

# Script to fix media directory permissions for Docker containers

echo "Fixing media directory permissions..."

# Create required directories if they don't exist
mkdir -p media/website/logos
mkdir -p media/brand_logos
mkdir -p media/category_images
mkdir -p media/product_images
mkdir -p media/promotions

# Ensure permissions are correct (readable by nginx)
chmod -R 755 media

echo "Copying logo.png to website logos directory if it exists"
if [ -f media/logo.png ]; then
    cp media/logo.png media/website/logos/default_logo.png
    echo "Copied media/logo.png to media/website/logos/default_logo.png"
else
    echo "No logo.png found in media directory"
fi

echo "Media directories created and permissions set."

# Restart the containers to apply changes
echo "Restarting containers..."
docker-compose restart backend frontend

echo "Done!" 