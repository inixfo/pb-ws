#!/bin/bash

# Simple script to create required media directories and fix permissions
echo "===== Media Directories Fix Script ====="

# 1. Stop the containers
echo "Stopping containers..."
docker-compose down
echo

# 2. Create media directories
echo "Creating media directories..."
mkdir -p media/website/logos
chmod -R 755 media
echo "Created and set permissions for media/website/logos"
echo

# 3. Copy logo if it exists
if [ -f "media/logo.png" ]; then
  echo "Found logo.png in media root, copying to website/logos directory"
  cp media/logo.png media/website/logos/default_logo.png
else
  echo "No logo.png found in media root"
  echo "Creating test file in logos directory"
  echo "This is a test file" > media/website/logos/test.txt
fi

# 4. List directory contents
echo "Listing logo directory contents:"
ls -la media/website/logos
echo

# 5. Start containers again
echo "Starting containers..."
docker-compose up -d
echo

echo "===== Fix Complete ====="
echo "You should now check the admin panel and upload logos to test if they display correctly."
echo "Remember to test both the phonebay.xyz and www.phonebay.xyz domains." 