#!/bin/bash

# Production deployment script for Google OAuth integration
# This script updates both backend and frontend configurations

echo "===== Phone Bay Google OAuth Deployment Script ====="
echo "Please provide your Google OAuth credentials"
echo ""

# 1. Prompt for credentials
read -p "Enter Google Client ID: " GOOGLE_CLIENT_ID
read -p "Enter Google Client Secret: " GOOGLE_CLIENT_SECRET

# Set environment variables for the current session
export GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID"
export GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET"

echo "✅ Environment variables set for current session"

# 2. Update the backend.env file
if [ -f "backend.env" ]; then
    # Check if Google OAuth settings already exist in the file
    if grep -q "GOOGLE_CLIENT_ID" backend.env; then
        # Update existing settings
        sed -i "s|GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID|g" backend.env
        sed -i "s|GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET|g" backend.env
    else
        # Add new settings
        echo "" >> backend.env
        echo "# Google OAuth Settings" >> backend.env
        echo "GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID" >> backend.env
        echo "GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET" >> backend.env
    fi
    echo "✅ Updated backend.env file"
else
    echo "❌ backend.env file not found"
fi

# 3. Update the frontend config.js file
if [ -f "../home/src/config.js" ]; then
    sed -i "s|GOOGLE_CLIENT_ID: '[^']*'|GOOGLE_CLIENT_ID: '$GOOGLE_CLIENT_ID'|g" "../home/src/config.js"
    echo "✅ Updated frontend config.js file"
else
    echo "❌ Frontend config.js file not found"
fi

# 4. Instructions for systemd service
echo ""
echo "===== Production Deployment Instructions ====="
echo "1. Add these environment variables to your systemd service:"
echo "   Environment=\"GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID\""
echo "   Environment=\"GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET\""
echo ""
echo "2. Reload systemd daemon:"
echo "   sudo systemctl daemon-reload"
echo ""
echo "3. Restart your Django service:"
echo "   sudo systemctl restart your-django-service.service"
echo ""
echo "4. Rebuild the frontend:"
echo "   cd ../home && npm run build"
echo ""
echo "5. Configure Google OAuth redirect URIs in Google Cloud Console:"
echo "   - http://52.62.201.84/api/social-auth/complete/google-oauth2/"
echo "   - https://phonebay.xyz/api/social-auth/complete/google-oauth2/"
echo ""
echo "6. Configure authorized JavaScript origins in Google Cloud Console:"
echo "   - http://52.62.201.84"
echo "   - https://phonebay.xyz"
echo ""
echo "===== Deployment Complete =====" 