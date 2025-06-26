#!/bin/bash

# Script to verify media files and their URLs on the server

echo "==== Media Directory Structure ===="
find media -type d | sort
echo ""

echo "==== Logo Files in website/logos ===="
find media/website/logos -type f 2>/dev/null | sort
echo ""

echo "==== Media File Permissions ===="
ls -la media/website/logos 2>/dev/null
echo ""

echo "==== Getting Site Settings from API ===="
curl -s http://localhost:8000/api/adminpanel/settings/ | python -m json.tool
echo ""

echo "==== Trying Direct Access to a Logo File ===="
# Get the first logo file
LOGO_FILE=$(find media/website/logos -type f 2>/dev/null | head -n 1)
if [ -n "$LOGO_FILE" ]; then
  echo "Testing access to: $LOGO_FILE"
  
  # Try to access the file via the media URL
  RELATIVE_PATH=${LOGO_FILE#media/}
  MEDIA_URL="http://localhost/media/$RELATIVE_PATH"
  
  echo "Testing URL: $MEDIA_URL"
  curl -I "$MEDIA_URL"
else
  echo "No logo files found to test"
fi

echo ""
echo "==== Verifying Docker Container Mounts ===="
docker-compose exec backend ls -la /app/media/website/logos 2>/dev/null
docker-compose exec frontend ls -la /usr/share/nginx/html/media/website/logos 2>/dev/null

echo ""
echo "==== Completed Media Check ====" 