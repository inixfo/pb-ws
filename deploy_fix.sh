#!/bin/bash
# Deploy fix script for the decimal multiplication error on the server

echo "Creating Python fix script..."
cat > fix_decimal_error.py << 'EOPY'
#!/usr/bin/env python
"""
This script fixes the decimal multiplication error in the filter_options method in products/views.py.
"""

import os
import re
import sys

def fix_views_file():
    # Path to the file
    views_path = 'products/views.py'
    
    if not os.path.exists(views_path):
        print(f"Error: Could not find file at {views_path}")
        return False
    
    # Read the file
    with open(views_path, 'r') as file:
        content = file.read()
    
    # Find and replace the problematic line
    pattern = r'(\s+)max_price = max_price \* 1\.1'
    replacement = r'\1max_price = float(max_price) * 1.1'
    
    if not re.search(pattern, content):
        print("Error: Could not find the line to replace.")
        return False
    
    new_content = re.sub(pattern, replacement, content)
    
    # Write the updated content back to the file
    with open(views_path, 'w') as file:
        file.write(new_content)
    
    print("Successfully updated products/views.py")
    return True

if __name__ == '__main__':
    success = fix_views_file()
    if success:
        print("Fix applied successfully. Restart the server for changes to take effect.")
    else:
        print("Fix could not be applied. Please check the file manually.")
EOPY

echo "Making Python script executable..."
chmod +x fix_decimal_error.py

echo "Instructions:"
echo "1. Upload this script to the server where the Django code is deployed"
echo "2. Run: python fix_decimal_error.py"
echo "3. Restart the Gunicorn server: sudo systemctl restart gunicorn"
echo "4. Alternatively, for Docker deployment:"
echo "   a. Copy the script into the container: docker cp fix_decimal_error.py container_name:/app/"
echo "   b. Execute in container: docker exec container_name python fix_decimal_error.py"
echo "   c. Restart container: docker restart container_name"
echo ""
echo "Fix script created: fix_decimal_error.py" 