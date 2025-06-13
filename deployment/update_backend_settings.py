#!/usr/bin/env python
"""
This script copies the AWS settings file to the proper location in the Django project.
"""

import os
import shutil
import sys

def main():
    """
    Copy AWS settings file to Django project and update storage backends.
    """
    # Get the current directory (deployment)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Get the parent directory (project root)
    parent_dir = os.path.dirname(current_dir)
    
    # Source files
    settings_aws_src = os.path.join(current_dir, 'settings_aws.py')
    storage_backends_src = os.path.join(current_dir, 'storage_backends.py')
    
    # Destination files
    settings_aws_dest = os.path.join(parent_dir, 'backend', 'settings_aws.py')
    storage_backends_dest = os.path.join(parent_dir, 'backend', 'storage_backends.py')
    
    # Check if source files exist
    if not os.path.exists(settings_aws_src):
        print(f"Error: {settings_aws_src} does not exist")
        sys.exit(1)
    
    if not os.path.exists(storage_backends_src):
        print(f"Error: {storage_backends_src} does not exist")
        sys.exit(1)
    
    # Copy files
    try:
        shutil.copy2(settings_aws_src, settings_aws_dest)
        print(f"Successfully copied {settings_aws_src} to {settings_aws_dest}")
        
        shutil.copy2(storage_backends_src, storage_backends_dest)
        print(f"Successfully copied {storage_backends_src} to {storage_backends_dest}")
        
        # Create __init__.py if it doesn't exist
        init_file = os.path.join(parent_dir, 'backend', '__init__.py')
        if not os.path.exists(init_file):
            with open(init_file, 'w') as f:
                f.write("# This file is required for Python to recognize this directory as a package\n")
            print(f"Created {init_file}")
        
        print("Backend settings updated successfully")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 