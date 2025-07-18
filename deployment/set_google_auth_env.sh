#!/bin/bash

# Script to set Google OAuth environment variables for production deployment

# Set Google OAuth credentials
export GOOGLE_CLIENT_ID="your_google_client_id_here"
export GOOGLE_CLIENT_SECRET="your_google_client_secret_here"

# Print confirmation
echo "Google OAuth environment variables set:"
echo "GOOGLE_CLIENT_ID: $GOOGLE_CLIENT_ID"
echo "GOOGLE_CLIENT_SECRET: [HIDDEN]"

# Instructions for adding to systemd service
echo ""
echo "To make these environment variables persistent in your systemd service:"
echo "1. Edit your service file with: sudo nano /etc/systemd/system/your-django-app.service"
echo "2. Add the following lines in the [Service] section:"
echo "   Environment=\"GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID\""
echo "   Environment=\"GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET\""
echo "3. Reload systemd: sudo systemctl daemon-reload"
echo "4. Restart your service: sudo systemctl restart your-django-app.service" 