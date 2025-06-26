#!/bin/bash

# Script to fix website logos and favicon issues
echo "===== Website Logos Fix Script ====="

# Stop containers if running
echo "Checking if containers are running..."
if docker-compose ps | grep -q "backend\|frontend"; then
  echo "Stopping containers..."
  docker-compose stop
else
  echo "Containers are not running."
fi

# Create the necessary directories
echo "Creating required directories..."
mkdir -p media/website/logos
chmod -R 755 media
echo "Created media/website/logos directory with correct permissions"

# Create custom favicon if it doesn't exist
if [ ! -f "media/website/logos/favicon.ico" ]; then
  echo "Creating a default favicon in media/website/logos..."
  if [ -f "media/favicon.ico" ]; then
    echo "Copying existing favicon.ico to website/logos directory"
    cp media/favicon.ico media/website/logos/favicon.ico
  else
    echo "No favicon.ico found, copying public favicon"
    if [ -f "home/public/favicon.ico" ]; then
      cp home/public/favicon.ico media/website/logos/favicon.ico
    else
      echo "WARNING: Could not find a favicon.ico to copy!"
    fi
  fi
fi

# Create a placeholder logo if no logo exists
if [ ! -f "media/website/logos/logo.png" ]; then
  echo "Creating a placeholder logo in media/website/logos..."
  if [ -f "media/logo.png" ]; then
    echo "Copying existing logo.png to website/logos directory"
    cp media/logo.png media/website/logos/logo.png
  else
    echo "No logo.png found, copying public logo if available"
    if [ -f "home/public/logo.png" ]; then
      cp home/public/logo.png media/website/logos/logo.png
    fi
  fi
fi

# List directory contents
echo "Listing website/logos directory contents:"
ls -la media/website/logos
echo

# Fix permissions
echo "Setting correct permissions..."
chmod -R 755 media

# Restart containers
echo "Starting containers..."
docker-compose up -d

echo "===== Fix Complete ====="
echo "Now you can access the admin panel and upload new logos and favicon:"
echo "1. Go to Admin Panel -> Site Settings"
echo "2. Upload new header logo, footer logo, and favicon"
echo "3. Save settings and check that they appear correctly on both domains"

# Extra debug info
echo
echo "===== Debug Info ====="
echo "Media directories:"
find media -type d | sort
echo
echo "Media files:"
find media -type f | sort

echo
echo "If you still experience issues, please check browser console for errors." 