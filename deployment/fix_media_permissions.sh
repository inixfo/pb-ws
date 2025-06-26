#!/bin/bash

# Script to ensure proper media directories exist with correct permissions
echo "Creating media directories if they don't exist..."

# Check if we're running in a Docker container
if [ -d "/usr/share/nginx/html/media" ]; then
  # Docker environment
  echo "Docker environment detected"
  MEDIA_PATH="/usr/share/nginx/html/media"
else
  # Local environment
  echo "Local environment detected"
  MEDIA_PATH="./media"
  # Create local media directory if it doesn't exist
  mkdir -p $MEDIA_PATH
fi

# Create the website/logos directory for site logos
mkdir -p $MEDIA_PATH/website/logos

# Set proper permissions
echo "Setting permissions..."
chmod -R 755 $MEDIA_PATH

# Create a test file if needed
echo "Creating a test file to verify permissions..."
echo "test" > $MEDIA_PATH/website/logos/test.txt

echo "Checking directory structure..."
ls -la $MEDIA_PATH/website/logos

echo "Done!"

# Restart containers if in Docker environment
if [ -f "docker-compose.yml" ]; then
  echo "Restarting containers..."
  docker-compose restart backend frontend
fi 