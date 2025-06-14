#!/usr/bin/env python
"""
Script to install SSLCommerz-python without the typed-ast dependency
"""
import os
import shutil
import tempfile
import subprocess
from pathlib import Path

def install_sslcommerz():
    print("Installing SSLCommerz-python without typed-ast...")
    
    # Create a temporary directory
    temp_dir = tempfile.mkdtemp()
    try:
        # Clone or download the package
        subprocess.check_call(
            ["pip", "download", "--no-deps", "SSLCommerz-python==0.0.7", "-d", temp_dir]
        )
        
        # Find the downloaded tarball
        tarball = list(Path(temp_dir).glob("*.tar.gz"))[0]
        
        # Extract it
        extract_dir = os.path.join(temp_dir, "extract")
        os.makedirs(extract_dir, exist_ok=True)
        subprocess.check_call(["tar", "-xzf", str(tarball), "-C", extract_dir])
        
        # Find the setup.py directory
        setup_dir = next(Path(extract_dir).glob("*"))
        
        # Modify setup.py to remove typed-ast dependency
        setup_py = os.path.join(setup_dir, "setup.py")
        with open(setup_py, 'r') as f:
            content = f.read()
        
        # Remove typed-ast from install_requires
        modified_content = content.replace(
            "'typed-ast==1.4.0',", 
            "# 'typed-ast==1.4.0', # Removed for Python 3.10 compatibility"
        )
        
        with open(setup_py, 'w') as f:
            f.write(modified_content)
        
        # Install the modified package
        subprocess.check_call(
            ["pip", "install", "-e", str(setup_dir)]
        )
        
        print("SSLCommerz-python installed successfully without typed-ast")
        
    finally:
        # Clean up
        shutil.rmtree(temp_dir)

if __name__ == "__main__":
    install_sslcommerz() 