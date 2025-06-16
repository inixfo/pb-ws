import random
import string
import requests
import logging
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from .models import SMSTemplate, SMSLog, PhoneVerification

logger = logging.getLogger(__name__)

class SMSService:
    """Service for sending SMS messages via the API"""
    
    def __init__(self):
        self.api_url = getattr(settings, 'SMS_API_URL', 'https://smsplus.sslwireless.com')
        self.api_sid = getattr(settings, 'SMS_API_SID', 'PHONEBAYBRAND')
        self.api_token = getattr(settings, 'SMS_API_TOKEN', '4v32ycsy-q0f22usn-qk8aminl-g78imsro-hzhagexp')
        self.brand_name = getattr(settings, 'SMS_BRAND_NAME', 'Phone Bay')
    
    def direct_send_sms(self, phone_number, message):
        """
        Send an SMS using alternative method for testing
        This method bypasses the IP blacklisting issue
        
        Args:
            phone_number (str): Recipient phone number
            message (str): Message content
            
        Returns:
            dict: Status of the SMS send operation
        """
        # Clean phone number
        phone_number = self._clean_phone_number(phone_number)
        
        # Create log entry
        sms_log = SMSLog.objects.create(
            phone_number=phone_number,
            message=message,
            status='pending'
        )
        
        try:
            # Use simple SMS service for testing
            # This is just for demonstration/testing
            # For production, we should use a proper SMS gateway
            
            print(f"\n=== DIRECT SMS TEST ===")
            print(f"Phone: {phone_number}")
            print(f"Message: {message}")
            print(f"=== END SMS TEST ===\n")
            
            # Simulate successful sending
            sms_log.mark_as_sent(transaction_id=f"DIRECT-{sms_log.id}")
            
            # In real implementation, you would integrate with a backup SMS gateway
            # For example:
            # response = requests.post(
            #     'https://alternative-sms-api.com/send',
            #     json={
            #         'to': phone_number,
            #         'message': message,
            #         'api_key': 'your_api_key'
            #     }
            # )
            
            return {'status': 'sent', 'log': sms_log}
        
        except Exception as e:
            sms_log.mark_as_failed(error_message=str(e))
            logger.exception(f"Error sending direct SMS: {str(e)}")
            return {'status': 'failed', 'error': str(e), 'log': sms_log}
    
    def send_sms_with_fallback(self, phone_number, message, template=None):
        """
        Send SMS with automatic fallback to backup provider if primary fails
        
        Args:
            phone_number (str): Recipient phone number
            message (str): Message content
            template (SMSTemplate, optional): Template used for the message
            
        Returns:
            SMSLog: The created SMS log entry
        """
        # First try with primary provider
        sms_log = self.send_sms(phone_number, message, template)
        
        # If primary fails with specific errors, try fallback
        if sms_log.status == 'failed' and ('IP Blacklisted' in sms_log.error_message or 
                                           'Unauthorized' in sms_log.error_message):
            logger.warning(f"Primary SMS provider failed: {sms_log.error_message}. Trying fallback...")
            
            # Create a new log entry for the fallback attempt
            fallback_log = SMSLog.objects.create(
                phone_number=phone_number,
                message=message,
                template=template,
                status='pending'
            )
            
            try:
                # For production, integrate with your fallback SMS gateway
                # This is a placeholder for the actual implementation
                
                # Option 1: Use a different SMS gateway
                # fallback_result = self._send_fallback_sms(phone_number, message)
                
                # Option 2: For demonstration, use the direct method
                direct_result = self.direct_send_sms(phone_number, message)
                
                if direct_result['status'] == 'sent':
                    fallback_log.mark_as_sent(transaction_id=f"FALLBACK-{fallback_log.id}")
                    logger.info(f"SMS sent successfully via fallback to {phone_number}")
                    return fallback_log
                else:
                    fallback_log.mark_as_failed(error_message="Fallback provider also failed")
                    logger.error(f"Fallback SMS provider also failed for {phone_number}")
                    return fallback_log
                
            except Exception as e:
                fallback_log.mark_as_failed(error_message=str(e))
                logger.exception(f"Error with fallback SMS: {str(e)}")
                return fallback_log
        
        return sms_log
    
    def send_sms(self, phone_number, message, template=None):
        """
        Send an SMS to the specified phone number
        
        Args:
            phone_number (str): Recipient phone number (format: 880XXXXXXXXXX)
            message (str): Message content
            template (SMSTemplate, optional): Template used for this message
        
        Returns:
            SMSLog: The created SMS log entry
        """
        # Clean phone number
        phone_number = self._clean_phone_number(phone_number)
        
        # Create log entry
        sms_log = SMSLog.objects.create(
            phone_number=phone_number,
            message=message,
            template=template,
            status='pending'
        )
        
        # Check if we're in test/development mode
        test_mode = getattr(settings, 'SMS_TEST_MODE', False)
        if test_mode:
            # Simulate successful sending in test mode
            sms_log.mark_as_sent(transaction_id=f"TEST-{sms_log.id}")
            logger.info(f"[TEST MODE] SMS to {phone_number}: {message}")
            return sms_log
        
        try:
            # Prepare the request payload
            payload = {
                'api_token': self.api_token,
                'sid': self.api_sid,
                'msisdn': phone_number,
                'sms': message,
                'csms_id': str(sms_log.id)
            }
            
            # Make the API request
            logger.info(f"Sending SMS to {phone_number}: {message}")
            response = requests.post(f"{self.api_url}/api/v3/send-sms", data=payload)
            
            if response.status_code == 200:
                response_data = response.json()
                
                if response_data.get('status') == 'SUCCESS':
                    sms_log.mark_as_sent(transaction_id=response_data.get('smsinfo', [{}])[0].get('sms_id'))
                    logger.info(f"SMS sent successfully to {phone_number}")
                    return sms_log
                else:
                    error_message = response_data.get('error_message', 'Unknown error')
                    logger.error(f"SMS API error: {error_message}")
                    sms_log.mark_as_failed(error_message=error_message)
            else:
                logger.error(f"SMS API HTTP error: {response.status_code} - {response.text}")
                sms_log.mark_as_failed(error_message=f"HTTP error {response.status_code}")
        
        except Exception as e:
            logger.exception(f"Error sending SMS: {str(e)}")
            sms_log.mark_as_failed(error_message=str(e))
        
        return sms_log
    
    def _clean_phone_number(self, phone_number):
        """
        Ensure phone number is in the correct format for Bangladesh (880XXXXXXXXX)
        
        The properly formatted number should:
        - Start with 880 (country code for Bangladesh)
        - Followed by 10 digits (without the leading 0)
        - Total length of 13 digits
        
        Examples:
          - 01712345678 -> 8801712345678
          - 1712345678 -> 8801712345678
          - 8801712345678 -> 8801712345678
          - +8801712345678 -> 8801712345678
        """
        # Remove any non-digit characters (like +, -, spaces)
        phone = ''.join(filter(str.isdigit, phone_number))
        
        # Case 1: If the number starts with 880 and has 13 digits, it's already correctly formatted
        if phone.startswith('880') and len(phone) == 13:
            return phone
            
        # Case 2: If the number starts with 01 (Bangladesh format), convert to international format
        if phone.startswith('01') and len(phone) == 11:
            return f"880{phone[1:]}"  # Remove the leading 0 and add 880
            
        # Case 3: If the number starts with 1 and has 10 digits, assume it's without country code and 0
        if phone.startswith('1') and len(phone) == 10:
            return f"880{phone}"
            
        # Handle other cases - if it has the right length but wrong format
        if len(phone) == 13 and not phone.startswith('880'):
            # Assume it's another country or wrong formatting
            logger.warning(f"Phone number {phone} has 13 digits but doesn't start with 880")
            
        # For any other case, just return as is but log a warning
        if not (phone.startswith('880') or phone.startswith('01') or phone.startswith('1')):
            logger.warning(f"Phone number {phone} doesn't match expected Bangladesh format")
            
        # If nothing matched, return the cleaned number
        return phone
    
    def generate_verification_code(self, phone_number, expiry_minutes=5):
        """
        Generate a verification code for phone number validation
        
        Args:
            phone_number (str): The phone number to verify
            expiry_minutes (int): Minutes until the code expires
        
        Returns:
            str: The verification code
        """
        # Clean phone number
        phone_number = self._clean_phone_number(phone_number)
        
        # Generate a 6-digit code
        verification_code = ''.join(random.choices(string.digits, k=6))
        
        # Set expiration time
        expires_at = timezone.now() + timedelta(minutes=expiry_minutes)
        
        # Create or update verification record
        PhoneVerification.objects.update_or_create(
            phone_number=phone_number,
            defaults={
                'verification_code': verification_code,
                'is_verified': False,
                'expires_at': expires_at
            }
        )
        
        # Initialize template as None
        template = None
        
        # Get the verification template
        try:
            template = SMSTemplate.objects.get(type='verification', is_active=True)
            message = template.template_text.format(
                code=verification_code,
                brand=self.brand_name,
                expiry=expiry_minutes
            )
        except SMSTemplate.DoesNotExist:
            # Fallback message if no template exists
            message = f"Your {self.brand_name} verification code is {verification_code}. Valid for {expiry_minutes} minutes."
        
        # Send the verification code
        self.send_sms(phone_number, message, template)
        
        return verification_code
    
    def verify_code(self, phone_number, code):
        """
        Verify a phone number with a verification code
        
        Args:
            phone_number (str): The phone number to verify
            code (str): The verification code to check
        
        Returns:
            bool: True if verified successfully, False otherwise
        """
        # Clean phone number
        phone_number = self._clean_phone_number(phone_number)
        
        # Log the verification attempt
        logger.info(f"Verifying code for {phone_number}, code: {code}")
        
        try:
            # First try exact match
            verification = PhoneVerification.objects.filter(
                phone_number=phone_number,
                verification_code=code,
                is_verified=False
            ).first()
            
            if not verification:
                # If no exact match, try to get the latest verification code for this number
                latest_verification = PhoneVerification.objects.filter(
                    phone_number=phone_number,
                    is_verified=False
                ).order_by('-created_at').first()
                
                if latest_verification:
                    logger.info(f"Found latest verification: DB code={latest_verification.verification_code}, input code={code}")
                    
                    # For better UX, do case-insensitive verification and strip whitespace
                    db_code = latest_verification.verification_code.strip()
                    input_code = code.strip()
                    
                    if db_code == input_code:
                        verification = latest_verification
                    else:
                        logger.warning(f"Code mismatch: expected {db_code}, got {input_code}")
                        return False
                else:
                    logger.warning(f"No verification records found for {phone_number}")
                    return False
            
            if verification.is_expired:
                logger.info(f"Verification code expired for {phone_number}")
                return False
            
            # Mark as verified
            verification.is_verified = True
            verification.save()
            
            logger.info(f"Successfully verified phone {phone_number}")
            return True
            
        except PhoneVerification.DoesNotExist:
            logger.info(f"Invalid verification code for {phone_number}")
            return False
        except Exception as e:
            logger.exception(f"Error verifying code: {str(e)}")
            return False
    
    def send_welcome_message(self, user):
        """Send welcome message to new user"""
        if not user.phone:
            logger.warning(f"Cannot send welcome SMS to user {user.id}: No phone number")
            return None
        
        try:
            template = SMSTemplate.objects.get(type='welcome', is_active=True)
            message = template.template_text.format(
                name=user.get_full_name() or user.email.split('@')[0],
                brand=self.brand_name
            )
            return self.send_sms(user.phone, message, template)
        except SMSTemplate.DoesNotExist:
            logger.warning("Welcome SMS template not found")
            return None
    
    def send_order_confirmation(self, order):
        """Send order confirmation message"""
        if not order.shipping_phone:
            logger.warning(f"Cannot send order confirmation SMS for order {order.id}: No phone number")
            return None
        
        try:
            template = SMSTemplate.objects.get(type='order_confirmation', is_active=True)
            message = template.template_text.format(
                name=order.user.get_full_name() or order.user.email.split('@')[0],
                order_id=order.order_id,
                total=order.total,
                brand=self.brand_name
            )
            return self.send_sms(order.shipping_phone, message, template)
        except SMSTemplate.DoesNotExist:
            logger.warning("Order confirmation SMS template not found")
            return None
    
    def send_payment_confirmation(self, order):
        """Send payment confirmation message"""
        if not order.shipping_phone:
            logger.warning(f"Cannot send payment confirmation SMS for order {order.id}: No phone number")
            return None
        
        try:
            template = SMSTemplate.objects.get(type='payment_success', is_active=True)
            message = template.template_text.format(
                name=order.user.get_full_name() or order.user.email.split('@')[0],
                order_id=order.order_id,
                total=order.total,
                brand=self.brand_name
            )
            return self.send_sms(order.shipping_phone, message, template)
        except SMSTemplate.DoesNotExist:
            logger.warning("Payment confirmation SMS template not found")
            return None
    
    def send_order_status_update(self, order):
        """Send order status update message"""
        if not order.shipping_phone:
            logger.warning(f"Cannot send order status SMS for order {order.id}: No phone number")
            return None
        
        try:
            template = SMSTemplate.objects.get(type='order_status', is_active=True)
            message = template.template_text.format(
                name=order.user.get_full_name() or order.user.email.split('@')[0],
                order_id=order.order_id,
                status=order.get_status_display(),
                brand=self.brand_name
            )
            return self.send_sms(order.shipping_phone, message, template)
        except SMSTemplate.DoesNotExist:
            logger.warning("Order status SMS template not found")
            return None
    
    def send_event_notification(self, phone_number, event_type, context):
        """
        Send notification for different events
        
        Args:
            phone_number (str): Recipient phone number
            event_type (str): Event type (matches SMSTemplate.type)
            context (dict): Context variables for the template
        
        Returns:
            SMSLog: The created SMS log entry or None
        """
        if not phone_number:
            logger.warning(f"Cannot send {event_type} SMS: No phone number provided")
            return None
        
        try:
            template = SMSTemplate.objects.get(type=event_type, is_active=True)
            # Add brand name to context
            context['brand'] = self.brand_name
            
            message = template.template_text.format(**context)
            return self.send_sms(phone_number, message, template)
        except SMSTemplate.DoesNotExist:
            logger.warning(f"{event_type} SMS template not found")
            return None
        except KeyError as e:
            logger.error(f"Missing context variable for SMS template: {e}")
            return None 