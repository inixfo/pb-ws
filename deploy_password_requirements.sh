#!/bin/bash

# Script to deploy password requirements changes

echo "Deploying password requirements changes..."

# Copy the updated SignUp.tsx file to the server
echo "Copying updated SignUp.tsx file..."
cp home/src/screens/Auth/SignUp.tsx /var/www/html/home/src/screens/Auth/SignUp.tsx

# Rebuild the frontend
echo "Rebuilding the frontend..."
cd /var/www/html/home
npm run build

echo "Deployment complete! The password requirements are now displayed on the signup page." 