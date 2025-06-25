#!/bin/bash

# Script to rebuild the frontend container

echo "Rebuilding frontend container..."

# Navigate to the home directory
cd home

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the frontend
echo "Building frontend..."
npm run build

# Restart the container (if using Docker)
# Uncomment the following lines if using Docker
# echo "Restarting container..."
# docker-compose restart frontend

echo "Frontend rebuild complete!"
echo "Please refresh your browser to see the changes." 