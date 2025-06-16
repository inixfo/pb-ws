#!/usr/bin/env python
"""
Test script for SMS verification functionality.
Run with: python test_sms.py <phone_number> [message]
Example: python test_sms.py 01712345678 "Hello from Phone Bay!"
"""
import os
import sys
import django
import time
import random
import string

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from sms.services import SMSService
from sms.models import SMSTemplate, SMSLog, PhoneVerification
from django.conf import settings

def test_verification_code(phone_number):
    """Test sending a verification code to a phone number"""
    print(f"Testing SMS verification with phone number: {phone_number}")
    
    # Check if verification templates exist
    verification_templates = SMSTemplate.objects.filter(type='verification', is_active=True)
    if verification_templates.exists():
        print(f"Verification template found: {verification_templates.first().name}")
    else:
        print("Warning: No verification template found. Will use fallback message.")
    
    # Print API credentials
    sms = SMSService()
    print(f"SMS API URL: {sms.api_url}")
    print(f"SMS API SID: {sms.api_sid}")
    print(f"SMS Brand Name: {sms.brand_name}")
    print(f"SMS Test Mode: {settings.SMS_TEST_MODE}")
    
    # Generate verification code but don't send it yet
    verification_code = ''.join(random.choices(string.digits, k=6))
    print(f"Verification code generated: {verification_code}")
    
    # Create a custom verification message
    message = f"Your {sms.brand_name} verification code is {verification_code}. Valid for 5 minutes."
    
    # Send using direct method to bypass IP blacklisting
    result = sms.direct_send_sms(phone_number, message)
    
    if result['status'] == 'sent':
        print(f"SMS sent successfully using direct method")
        
        # Get the log entry
        sms_log = result['log']
        print(f"SMS Log status: {sms_log.status}")
        print(f"Transaction ID: {sms_log.transaction_id}")
        
        return verification_code
    else:
        print(f"Error sending verification code: {result.get('error')}")
        return None

def send_custom_message(phone_number, message):
    """Send a custom SMS message to a phone number"""
    print(f"Sending custom SMS to phone number: {phone_number}")
    print(f"Message: {message}")
    
    # Print API credentials and settings
    sms = SMSService()
    print(f"SMS API URL: {sms.api_url}")
    print(f"SMS API SID: {sms.api_sid}")
    print(f"SMS Brand Name: {sms.brand_name}")
    print(f"SMS Test Mode: {settings.SMS_TEST_MODE}")
    
    try:
        # Send direct SMS using the bypass method
        result = sms.direct_send_sms(phone_number, message)
        
        if result['status'] == 'sent':
            print(f"SMS sent successfully using direct method")
            
            # Get the log entry
            sms_log = result['log']
            print(f"SMS Log status: {sms_log.status}")
            print(f"Transaction ID: {sms_log.transaction_id}")
            
            return sms_log
        else:
            print(f"Error sending SMS: {result.get('error')}")
            return None
    except Exception as e:
        print(f"Error sending custom message: {e}")
        return None

def test_sms_with_fallback(phone_number, message):
    """Test SMS sending with fallback mechanism"""
    print(f"\nTesting SMS with fallback mechanism to: {phone_number}")
    print(f"Message: {message}")
    
    sms = SMSService()
    print(f"SMS Test Mode: {settings.SMS_TEST_MODE}")
    
    try:
        # Send using fallback method
        sms_log = sms.send_sms_with_fallback(phone_number, message)
        
        if sms_log:
            print(f"SMS status: {sms_log.status}")
            if sms_log.status == 'failed':
                print(f"Error message: {sms_log.error_message}")
            else:
                print(f"SMS sent at: {sms_log.sent_at}")
                print(f"Transaction ID: {sms_log.transaction_id}")
        else:
            print("No SMS log returned from fallback method")
            
        return sms_log
    except Exception as e:
        print(f"Error testing SMS fallback: {e}")
        return None

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python test_sms.py <phone_number> [message] [--fallback]")
        print("Example: python test_sms.py 01712345678 \"Hello from Phone Bay!\"")
        print("Add --fallback to test the fallback mechanism")
        sys.exit(1)
        
    phone_number = sys.argv[1]
    use_fallback = "--fallback" in sys.argv
    
    if len(sys.argv) > 2 and "--fallback" != sys.argv[2]:
        # If message is provided, send custom message
        message = sys.argv[2]
        
        if use_fallback:
            test_sms_with_fallback(phone_number, message)
        else:
            send_custom_message(phone_number, message)
    else:
        # Otherwise send verification code
        test_verification_code(phone_number) 