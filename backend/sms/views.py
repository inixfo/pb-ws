from django.shortcuts import render
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .services import SMSService
from .models import PhoneVerification
import logging

# Configure logging
logger = logging.getLogger(__name__)

User = get_user_model()

class SendVerificationCodeView(APIView):
    """
    API view to send verification code to a phone number
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        phone_number = request.data.get('phone_number')
        
        if not phone_number:
            return Response({'error': 'Phone number is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate and send verification code
        sms_service = SMSService()
        code = sms_service.generate_verification_code(phone_number)
        
        return Response({'message': 'Verification code sent successfully'})


class VerifyPhoneNumberView(APIView):
    """
    API view to verify a phone number with a code
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        phone_number = request.data.get('phone_number')
        code = request.data.get('code')
        user_id = request.data.get('user_id')
        
        logger.info(f"Verifying phone number: {phone_number}, code: {code}")
        
        if not phone_number or not code:
            logger.warning(f"Missing data: phone_number={bool(phone_number)}, code={bool(code)}")
            return Response(
                {'error': 'Phone number and code are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify the code
        sms_service = SMSService()
        
        # Clean phone number to ensure consistent format
        clean_phone = sms_service._clean_phone_number(phone_number)
        logger.info(f"Original phone: {phone_number}, Cleaned phone: {clean_phone}")
        
        # Get all verification records for this phone to debug
        from .models import PhoneVerification
        records = PhoneVerification.objects.filter(phone_number=clean_phone).order_by('-created_at')
        
        if records.exists():
            latest = records.first()
            logger.info(f"Found verification record: code={latest.verification_code}, expired={latest.is_expired}, verified={latest.is_verified}")
            
            # If code is already verified, consider this a success
            if latest.is_verified and latest.verification_code == code:
                logger.info(f"Code was already verified for {clean_phone}")
                return Response({'message': 'Phone number verified successfully'})
        else:
            logger.warning(f"No verification records found for {clean_phone}")
            
            # Try alternative phone formats if no records found
            possible_formats = [
                clean_phone,
                f"880{clean_phone}" if not clean_phone.startswith('880') else clean_phone,
                f"880{clean_phone[1:]}" if clean_phone.startswith('0') else clean_phone
            ]
            
            logger.info(f"Trying alternative formats: {possible_formats}")
            
            for alt_format in possible_formats:
                alt_records = PhoneVerification.objects.filter(phone_number=alt_format).order_by('-created_at')
                if alt_records.exists():
                    latest = alt_records.first()
                    logger.info(f"Found record with alternative format {alt_format}: code={latest.verification_code}")
                    clean_phone = alt_format
                    records = alt_records
                    break
        
        is_verified = sms_service.verify_code(clean_phone, code)
        
        if not is_verified:
            logger.warning(f"Verification failed for {clean_phone} with code {code}")
            return Response(
                {'error': 'Invalid or expired verification code'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"Verification successful for {clean_phone}")
        
        # Update user by user_id if provided
        if user_id:
            try:
                user = None
                
                # Use request.user if authenticated
                if request.user.is_authenticated and str(request.user.id) == user_id:
                    user = request.user
                else:
                    # Otherwise lookup by ID
                    user = User.objects.get(id=user_id)
                
                if user:
                    user.phone = clean_phone
                    user.is_verified = True
                    user.save()
                    
                    # Send welcome message
                    sms_service.send_welcome_message(user)
                    
                    return Response({
                        'message': 'Phone number verified successfully',
                        'user_updated': True
                    })
            except User.DoesNotExist:
                logger.warning(f"User with ID {user_id} not found")
        
        # Check for and update users with this phone number (even if newly registered)
        users_with_phone = User.objects.filter(phone=clean_phone)
        if users_with_phone.exists():
            logger.info(f"Found {users_with_phone.count()} users with phone {clean_phone}")
            for user in users_with_phone:
                if not user.is_verified:
                    user.is_verified = True
                    user.save()
                    logger.info(f"Updated verification status for user {user.id}")
            
            return Response({
                'message': 'Phone number verified successfully',
                'users_updated': users_with_phone.count()
            })
        
        return Response({'message': 'Phone number verified successfully'})


class ResendVerificationCodeView(APIView):
    """
    API view to resend verification code to a phone number
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        phone_number = request.data.get('phone_number')
        
        if not phone_number:
            return Response({'error': 'Phone number is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate and send verification code
        sms_service = SMSService()
        code = sms_service.generate_verification_code(phone_number)
        
        return Response({'message': 'Verification code resent successfully'})
