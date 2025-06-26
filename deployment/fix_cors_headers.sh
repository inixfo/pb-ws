#!/bin/bash

# Script to remove duplicate CORS headers in nginx.conf
echo "Fixing CORS headers in nginx.conf..."

# Backup the current nginx.conf
cp nginx.conf nginx.conf.bak
echo "Backed up nginx.conf to nginx.conf.bak"

# Remove the Access-Control-Allow-Origin header from server blocks
# This header is already being added dynamically based on $http_origin
sed -i 's/add_header '"'"'Access-Control-Allow-Origin'"'"' '"'"'*'"'"' always;//g' nginx.conf

# Just keep the dynamic CORS header in the /media/ location which uses $http_origin
echo "Fixed CORS headers in nginx.conf"

# Test the nginx configuration to ensure it's valid
echo "Testing nginx configuration..."
docker exec nginx nginx -t

if [ $? -eq 0 ]; then
  echo "Nginx configuration is valid. Reloading nginx..."
  docker exec nginx nginx -s reload
  echo "Nginx reloaded successfully."
else
  echo "Nginx configuration test failed! Restoring backup..."
  cp nginx.conf.bak nginx.conf
  echo "Original configuration restored."
  exit 1
fi

echo "Done!" 