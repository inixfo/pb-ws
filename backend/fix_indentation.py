"""
Quick script to fix indentation in payments/views.py file
"""

def fix_indentation():
    # Read the file
    file_path = 'payments/views.py'
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Find the line with the error
    fixed_lines = []
    found_error = False
    
    for i, line in enumerate(lines):
        if "sslcommerz = get_sslcommerz_instance()" in line and not found_error:
            # Check if this is the line with incorrect indentation
            # Make sure it has proper indentation (8 spaces for nested if)
            if not line.startswith("            "):
                line = "            " + line.lstrip()
                found_error = True
                print(f"Fixed indentation on line {i+1}")
        
        fixed_lines.append(line)
    
    # Write back to file
    if found_error:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(fixed_lines)
        print("File fixed successfully!")
    else:
        print("No indentation issues found on target line.")

if __name__ == "__main__":
    fix_indentation() 