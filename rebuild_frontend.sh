#!/bin/bash

echo "Rebuilding frontend with updated configuration..."

# Navigate to the deployment directory
cd deployment

# Stop the frontend container
echo "Stopping frontend container..."
docker-compose stop frontend

# Rebuild the frontend container
echo "Rebuilding frontend container..."
docker-compose build frontend

# Start the frontend container
echo "Starting frontend container..."
docker-compose up -d frontend

echo "Frontend rebuild complete!"
echo ""
echo "If you're still experiencing issues with logos not displaying:"
echo "1. Check the browser console for any errors"
echo "2. Verify that the logo files are correctly uploaded in the admin panel"
echo "3. Make sure the media files are being served correctly by the web server"
echo "4. Try clearing your browser cache or using incognito mode"
echo ""
echo "To debug further, you can inspect the network requests in your browser's developer tools"
echo "to see if the logo URLs are being correctly formed and if the files are being served." 