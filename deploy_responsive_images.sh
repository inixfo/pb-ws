#!/bin/bash

# Script to deploy responsive image changes

# Display info
echo "Deploying responsive image changes..."

# Backend changes
echo "Applying backend changes..."

# Copy middleware file
echo "Copying middleware file..."
cp backend/products/middleware.py /var/www/html/backend/products/

# Update settings
echo "Updating Django settings..."
sed -i 's/MIDDLEWARE = \[/MIDDLEWARE = \[\n    "products.middleware.ImageResizingMiddleware",  # Add image resizing middleware/' /var/www/html/backend/backend/settings.py

# Frontend changes
echo "Applying frontend changes..."

# Copy formatters utility
echo "Copying formatters utility..."
mkdir -p /var/www/html/home/src/utils/
cp home/src/utils/formatters.ts /var/www/html/home/src/utils/

# Update imageUtils
echo "Updating image utilities..."
cp home/src/utils/imageUtils.ts /var/www/html/home/src/utils/

# Update product types
echo "Updating product types..."
cp home/src/types/product.ts /var/www/html/home/src/types/

# Update ProductCard component
echo "Updating ProductCard component..."
cp home/src/components/ProductCard/ProductCard.tsx /var/www/html/home/src/components/ProductCard/

# Restart services
echo "Restarting services..."
systemctl restart gunicorn
systemctl restart nginx

echo "Deployment complete!" 