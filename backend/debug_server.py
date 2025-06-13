import os
import sys

# Set debugging flags
os.environ["DJANGO_DEBUG"] = "True"
os.environ["PYTHONUNBUFFERED"] = "1"
os.environ['DJANGO_SETTINGS_MODULE'] = 'backend.settings'

# Execute Django's runserver command with debug output
if __name__ == "__main__":
    import django
    django.setup()
    
    from django.core.management import execute_from_command_line
    
    # Print debugging info
    print("Starting Django server with debug settings...")
    print(f"Python version: {sys.version}")
    print(f"Django version: {django.get_version()}")
    
    # Run the server
    execute_from_command_line(["manage.py", "runserver", "--traceback"]) 