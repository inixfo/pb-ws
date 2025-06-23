#!/usr/bin/env python
"""
Test script to test the registration API endpoint using only HTTP requests.
This doesn't require Django setup and can be run independently.
"""
import json
import requests
import random
import string

def generate_random_email():
    """Generate a random email for testing"""
    random_string = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"testuser_{random_string}@example.com"

# Test data to register a user
test_email = generate_random_email()
test_data = {
    "email": test_email,
    "password": "TestPassword123",
    "first_name": "Test",
    "last_name": "User",
    "phone": "8801712345678"  # Formatted Bangladesh phone number
}

print("\n===== REGISTRATION API TEST =====")
print(f"Test data: {json.dumps(test_data, indent=2)}")

# Test endpoints
# First, try the debug endpoint to see what's happening
debug_url = "http://localhost:8000/api/users/debug-register/"
api_url = "http://localhost:8000/api/users/register/"
headers = {
    "Content-Type": "application/json",
}

try:
    print("\n----- Testing DEBUG endpoint -----")
    response = requests.post(
        debug_url,
        headers=headers,
        json=test_data
    )
    
    print(f"Status code: {response.status_code}")
    try:
        print(f"Response data: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response text: {response.text}")
        
    if response.status_code == 200:
        print("Debug endpoint worked! This means the data is valid")
    else:
        print("Debug endpoint failed. See errors above")
        
except Exception as e:
    print(f"Error calling debug API: {str(e)}")

# Now try the actual registration endpoint
try:
    print("\n----- Testing REGISTRATION endpoint -----")
    response = requests.post(
        api_url,
        headers=headers,
        json=test_data
    )
    
    print(f"Status code: {response.status_code}")
    try:
        print(f"Response data: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response text: {response.text}")
    
    if response.status_code == 201:
        print("Success! User created via API")
    else:
        print("API registration failed")
        
except Exception as e:
    print(f"Error calling API: {str(e)}")

# Test with production URL if available
prod_url = "http://52.62.201.84/api/users/register/"

try:
    print("\n----- Testing PRODUCTION endpoint -----")
    response = requests.post(
        prod_url,
        headers=headers,
        json=test_data
    )
    
    print(f"Status code: {response.status_code}")
    try:
        print(f"Response data: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response text: {response.text}")
    
    if response.status_code == 201:
        print("Success! User created via production API")
    else:
        print("Production API registration failed")
        
except Exception as e:
    print(f"Error calling production API: {str(e)}")

print("\n===== TEST COMPLETE =====") 