#!/bin/bash

# Restore website functionality

echo "Restoring website functionality..."

# Restart services
echo "Restarting services..."
sudo systemctl restart nginx
sudo systemctl restart gunicorn

echo "Website should now be restored. Please check if it's accessible." 