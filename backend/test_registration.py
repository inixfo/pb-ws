#!/usr/bin/env python
"""
Test script to attempt user registration with the correct data format.
Run this script to see if the registration API is working properly.
"""
import os
import sys
import django
import json
import requests

# Set up Django environment
sys.path.append(os.path.abspath('.'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'phone_bay.settings')
django.setup()

from django.conf import settings
from django.contrib.auth import get_user_model
from users.models import Profile
from sms.services import SMSService

User = get_user_model()

# Check if a test user already exists and delete it
test_email = "testuser@example.com"
if User.objects.filter(email=test_email).exists():
    print(f"Deleting existing test user: {test_email}")
    User.objects.filter(email=test_email).delete()

# Test data to register a user
test_data = {
    "email": test_email,
    "password": "TestPassword123",
    "first_name": "Test",
    "last_name": "User",
    "phone": "8801712345678"  # Formatted Bangladesh phone number
}

print("\n===== REGISTRATION TEST =====")
print(f"Test data: {json.dumps(test_data, indent=2)}")

# Try to register a user directly via the model (baseline test)
try:
    print("\n----- Testing direct model creation -----")
    user = User.objects.create_user(
        email=test_data["email"],
        password=test_data["password"],
        first_name=test_data["first_name"],
        last_name=test_data["last_name"],
        phone=test_data["phone"]
    )
    user.is_verified = False
    user.save()
    
    print(f"Successfully created user: {user.email}")
    
    # Create a profile for the user
    profile = Profile.objects.create(user=user)
    print("Created user profile")
    
    # Verify the user was created correctly
    created_user = User.objects.get(email=test_data["email"])
    print(f"User verified: {created_user.email}, phone: {created_user.phone}")
    
    # Clean up
    created_user.delete()
    print("Test user deleted")
except Exception as e:
    print(f"Error creating user via model: {str(e)}")

# Test the API endpoint with the data
api_url = "http://localhost:8000/api/users/register/"
headers = {
    "Content-Type": "application/json",
}

try:
    print("\n----- Testing API endpoint -----")
    response = requests.post(
        api_url,
        headers=headers,
        json=test_data
    )
    
    print(f"Status code: {response.status_code}")
    print(f"Response data: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 201:
        print("Success! User created via API")
    else:
        print("API registration failed")
        
except Exception as e:
    print(f"Error calling API: {str(e)}")

print("\n===== TEST COMPLETE =====") 