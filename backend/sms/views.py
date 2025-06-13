from django.shortcuts import render
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .services import SMSService
from .models import PhoneVerification

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
        
        if not phone_number or not code:
            return Response(
                {'error': 'Phone number and code are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify the code
        sms_service = SMSService()
        is_verified = sms_service.verify_code(phone_number, code)
        
        if not is_verified:
            return Response(
                {'error': 'Invalid or expired verification code'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # If a user ID is provided, update the user's phone and verification status
        if user_id and request.user.is_authenticated and str(request.user.id) == user_id:
            try:
                user = User.objects.get(id=user_id)
                user.phone = phone_number
                user.is_verified = True
                user.save()
                
                # Send welcome message
                sms_service.send_welcome_message(user)
                
                return Response({
                    'message': 'Phone number verified successfully',
                    'user_updated': True
                })
            except User.DoesNotExist:
                pass
        
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
