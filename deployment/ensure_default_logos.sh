#!/bin/bash

# Script to ensure default logos and favicons are in the correct places
echo "===== Default Logo Checker ====="

# Create the public directory if it doesn't exist
if [ ! -d "home/public" ]; then
  mkdir -p home/public
  echo "Created public directory"
fi

# Check if we have default logo and favicon
if [ ! -f "home/public/logo.png" ]; then
  echo "Default logo not found in public directory!"
  
  # Try to find a logo elsewhere
  if [ -f "media/logo.png" ]; then
    echo "Found logo in media directory, copying to public"
    cp media/logo.png home/public/logo.png
  elif [ -f "backend/media/website/logos/logo.png" ]; then
    echo "Found logo in backend media directory, copying to public"
    cp backend/media/website/logos/logo.png home/public/logo.png
  elif [ -f "deployment/media/website/logos/logo.png" ]; then
    echo "Found logo in deployment media directory, copying to public"
    cp deployment/media/website/logos/logo.png home/public/logo.png
  else
    echo "WARNING: No logo.png found to copy! Please add one manually to home/public/logo.png"
  fi
else
  echo "Default logo already exists at home/public/logo.png"
fi

# Check if we have a favicon
if [ ! -f "home/public/favicon.ico" ]; then
  echo "Default favicon not found in public directory!"
  
  # Try to find a favicon elsewhere
  if [ -f "media/favicon.ico" ]; then
    echo "Found favicon in media directory, copying to public"
    cp media/favicon.ico home/public/favicon.ico
  elif [ -f "backend/media/website/logos/favicon.ico" ]; then
    echo "Found favicon in backend media directory, copying to public"
    cp backend/media/website/logos/favicon.ico home/public/favicon.ico
  elif [ -f "deployment/media/website/logos/favicon.ico" ]; then
    echo "Found favicon in deployment media directory, copying to public"
    cp deployment/media/website/logos/favicon.ico home/public/favicon.ico
  else
    echo "WARNING: No favicon.ico found to copy! Please add one manually to home/public/favicon.ico"
  fi
else
  echo "Default favicon already exists at home/public/favicon.ico"
fi

# Copy default logos to media directory as well
echo "Ensuring logos are in media directory..."
mkdir -p media/website/logos

# Copy from public if exists, or vice versa
if [ -f "home/public/logo.png" ] && [ ! -f "media/website/logos/logo.png" ]; then
  echo "Copying logo from public to media directory"
  cp home/public/logo.png media/website/logos/logo.png
fi

if [ -f "home/public/favicon.ico" ] && [ ! -f "media/website/logos/favicon.ico" ]; then
  echo "Copying favicon from public to media directory"
  cp home/public/favicon.ico media/website/logos/favicon.ico
fi

# Set permissions
echo "Setting permissions"
chmod -R 755 home/public
chmod -R 755 media

echo "===== Default Logo Check Complete =====" 