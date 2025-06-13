"""
Script to fix indentation and mixed tabs/spaces in payments/views.py file
"""
import re

def fix_payments_view_file():
    # Path to the file
    file_path = 'payments/views.py'
    
    # Read the file content
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Create a backup of the original file
    with open(file_path + '.bak', 'w', encoding='utf-8') as f:
        f.write(content)
    
    # Split content into lines
    lines = content.split('\n')
    fixed_lines = []
    
    # Process line by line
    for i, line in enumerate(lines):
        # Check for mixed tabs and spaces
        if '\t' in line:
            # Replace each tab with 4 spaces
            line = line.replace('\t', '    ')
        
        # Special fix for the line causing the error
        if i >= 230 and i <= 235 and re.search(r'\bsslcommerz\s*=\s*get_sslcommerz_instance\(\)', line):
            # Ensure proper indentation for code within if block
            stripped = line.lstrip()
            line = '            ' + stripped  # Use 12 spaces (8 for if block + 4 for nested code)
            print(f"Fixed line {i+1}: {line}")
        
        # Check for strange invisible characters
        line = ''.join(c for c in line if ord(c) < 128)
        
        fixed_lines.append(line)
    
    # Join lines back into a single string
    fixed_content = '\n'.join(fixed_lines)
    
    # Write the fixed content back to the file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(fixed_content)
    
    print(f"Fixed file saved to {file_path}")
    print(f"Backup saved to {file_path}.bak")

if __name__ == "__main__":
    fix_payments_view_file() 