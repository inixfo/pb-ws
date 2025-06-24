#!/bin/bash

# Script to update the frontend config.js file with the correct Google Client ID
# Usage: ./update_frontend_config.sh [google_client_id]

# Get the Google Client ID from argument or prompt
if [ -z "$1" ]; then
    read -p "Enter Google Client ID: " GOOGLE_CLIENT_ID
else
    GOOGLE_CLIENT_ID="$1"
fi

# Path to the config.js file
CONFIG_FILE="../home/src/config.js"

# Check if the config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Config file not found at $CONFIG_FILE"
    exit 1
fi

# Update the Google Client ID in the config file
sed -i "s|GOOGLE_CLIENT_ID: '[^']*'|GOOGLE_CLIENT_ID: '$GOOGLE_CLIENT_ID'|g" "$CONFIG_FILE"

# Check if the update was successful
if [ $? -eq 0 ]; then
    echo "Successfully updated Google Client ID in $CONFIG_FILE"
    echo "New Google Client ID: $GOOGLE_CLIENT_ID"
else
    echo "Error: Failed to update Google Client ID in $CONFIG_FILE"
    exit 1
fi

# Remind to rebuild the frontend
echo ""
echo "Remember to rebuild the frontend to apply changes:"
echo "cd ../home && npm run build" 