#!/usr/bin/env python
"""
Test script for SMS verification functionality.
Run with: python test_sms.py
"""
import os
import sys
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from sms.services import SMSService
from sms.models import SMSTemplate, SMSLog, PhoneVerification

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
    
    # Generate and send verification code
    try:
        code = sms.generate_verification_code(phone_number)
        print(f"Verification code generated: {code}")
        
        # Check SMS logs
        logs = SMSLog.objects.filter(phone_number__contains=phone_number.replace('+', '')).order_by('-created_at')
        if logs.exists():
            latest_log = logs.first()
            print(f"SMS Log status: {latest_log.status}")
            if latest_log.status == 'failed':
                print(f"Error message: {latest_log.error_message}")
        else:
            print("No SMS logs found for this number")
        
        return code
    except Exception as e:
        print(f"Error sending verification code: {e}")
        return None

if __name__ == '__main__':
    if len(sys.argv) > 1:
        phone_number = sys.argv[1]
    else:
        # Default test number - replace with a valid number when testing
        phone_number = "01888344423"
    
    test_verification_code(phone_number) 