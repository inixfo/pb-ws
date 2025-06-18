#!/bin/bash

# Fix responsive images

# Ensure Pillow is installed
pip install Pillow

# Restart the web server to apply changes
sudo systemctl restart gunicorn
sudo systemctl restart nginx

echo "Responsive image fixes applied. The thumbnails should now be responsive." 