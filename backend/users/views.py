from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
import json
import logging

logger = logging.getLogger(__name__)

from .models import Profile, Address, PaymentMethod
from .serializers import (
    UserSerializer, UserDetailSerializer, UserCreateSerializer,
    ProfileSerializer, AddressSerializer, PaymentMethodSerializer,
    PasswordChangeSerializer
)
from .permissions import IsOwnerOrAdmin, IsUserOwnerOrAdmin

User = get_user_model()


class UserRegistrationView(generics.CreateAPIView):
    """Register a new user."""
    
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        # Log the raw request data for debugging
        logger.info("=============================================")
        logger.info("REGISTRATION REQUEST DATA")
        logger.info(f"Request data: {request.data}")
        
        # Try to validate and catch errors for detailed logging
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Validation errors: {serializer.errors}")
            
            # Log specific fields to debug
            email = request.data.get('email', '')
            password = request.data.get('password', '')
            first_name = request.data.get('first_name', '')
            last_name = request.data.get('last_name', '')
            phone = request.data.get('phone', '')
            
            logger.error(f"Email: {email} (valid: {'@' in email})")
            logger.error(f"Password provided: {bool(password)} (length: {len(password) if password else 0})")
            logger.error(f"First name: {first_name}")
            logger.error(f"Last name: {last_name}")
            logger.error(f"Phone: {phone}")
            
            return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_create(serializer)
        
        # Get user data for the response
        user_data = UserSerializer(serializer.instance).data
        
        # Add info about verification
        verification_sent = getattr(serializer.instance, '_verification_sent', False)
        verification_phone = getattr(serializer.instance, '_verification_phone', None)
        
        response_data = {
            'user': user_data,
            'verification_required': True,
            'verification_sent': verification_sent,
            'verification_phone': verification_phone,
            'message': 'Please verify your phone number with the code sent via SMS',
        }
        
        headers = self.get_success_headers(serializer.data)
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)
        
    def perform_create(self, serializer):
        # Check if this is a vendor registration
        is_vendor = self.request.data.get('is_vendor', False)
        vendor_approved = self.request.data.get('vendor_approved', False)
        
        # Format phone number consistently
        phone = serializer.validated_data.get('phone')
        formatted_phone = phone
        if phone:
            # Import the SMS service for phone formatting
            try:
                from sms.services import SMSService
                sms_service = SMSService()
                formatted_phone = sms_service._clean_phone_number(phone)
                # Update the phone in validated_data
                serializer.validated_data['phone'] = formatted_phone
                logger.info(f"Phone number formatted: {phone} -> {formatted_phone}")
            except ImportError:
                logger.warning("SMS module not available for phone formatting")
            except Exception as e:
                logger.error(f"Error formatting phone number: {str(e)}")
                
        # Check if this phone number has already been verified
        is_verified = False
        if formatted_phone:
            # Check if we have a verified code for this phone number
            try:
                from sms.models import PhoneVerification
                verified_records = PhoneVerification.objects.filter(
                    phone_number=formatted_phone, 
                    is_verified=True
                ).exists()
                if verified_records:
                    logger.info(f"Phone number {formatted_phone} has already been verified")
                    is_verified = True
            except ImportError:
                logger.warning("SMS module not available for verification check")
            except Exception as e:
                logger.error(f"Error checking verification status: {str(e)}")
        
        # Create user with the appropriate verification status
        user = serializer.save(is_verified=is_verified)
        
        # If this is a vendor registration, handle vendor-specific data
        if is_vendor:
            # Mark as vendor
            user.role = 'vendor'
            
            # If admin is creating and auto-approving
            if vendor_approved and self.request.user.is_authenticated and self.request.user.is_staff:
                user._created_by_admin = True
            
            user.save()
            
            # Vendor profile will be created by the signal
        
        # Store verification status for response
        verification_sent = False
        verification_phone = None
        
        # Send verification code to user's phone
        try:
            from sms.services import SMSService
            phone = user.phone
            if phone:
                verification_phone = phone
                sms_service = SMSService()
                sms_service.generate_verification_code(phone)
                verification_sent = True
        except ImportError:
            # SMS module not available
            logger.warning("SMS module not available for verification")
        except Exception as e:
            # Log the error but don't prevent user creation
            logger.error(f"Error sending verification SMS: {str(e)}")
        
        # Store these for the response
        user._verification_sent = verification_sent
        user._verification_phone = verification_phone


class UserLoginView(APIView):
    """Login and get JWT tokens."""
    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        user = User.objects.filter(email=email).first()
        
        if user is None or not user.check_password(password):
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if user is a vendor and has a suspended/rejected status
        if user.role == 'vendor' and hasattr(user, 'vendor_profile'):
            vendor_status = user.vendor_profile.status
            if vendor_status == 'suspended':
                return Response(
                    {'error': 'Your vendor account is currently inactive. Please contact support for assistance.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            elif vendor_status == 'rejected':
                return Response(
                    {'error': 'Your vendor application has been rejected. Please contact support for more information.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            elif vendor_status == 'pending':
                return Response(
                    {'error': 'Your vendor application is still pending approval. Please wait for admin approval or contact support.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })


class UserDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve or update user details."""
    
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    
    def get_object(self):
        return self.request.user


class PasswordChangeView(generics.GenericAPIView):
    """Change user password."""
    
    serializer_class = PasswordChangeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        
        return Response({'message': 'Password changed successfully'})


class ProfileUpdateView(generics.RetrieveUpdateAPIView):
    """Retrieve or update user profile."""
    
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    
    def get_object(self):
        # Get or create the profile for the current user
        profile, created = Profile.objects.get_or_create(user=self.request.user)
        return profile
    
    def update(self, request, *args, **kwargs):
        """
        Update profile and handle fields that might be sent directly.
        For example, 'bio' might be sent directly in the request data
        instead of being nested in a 'profile' object.
        """
        logger = logging.getLogger(__name__)
        logger.error(f"Request data type: {type(request.data)}")
        logger.error(f"Request data: {request.data}")
        
        instance = self.get_object()
        
        # Make sure request.data is treated as a dictionary
        request_data = request.data
        if isinstance(request_data, str):
            try:
                request_data = json.loads(request_data)
                logger.error(f"Parsed JSON data: {request_data}")
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error: {e}")
                request_data = {}
        
        # Extract profile-specific fields from request_data
        profile_fields = {}
        for field in ['bio', 'date_of_birth', 'profile_picture',
                      'company_name', 'business_address', 'business_registration_number']:
            if field in request_data:
                # Handle empty strings for date fields
                if field == 'date_of_birth' and request_data[field] == '':
                    profile_fields[field] = None
                else:
                    profile_fields[field] = request_data.get(field)
        
        logger.error(f"Profile fields to update: {profile_fields}")
        
        # Always use partial update
        serializer = self.get_serializer(instance, data=profile_fields, partial=True)
        if not serializer.is_valid():
            logger.error(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        self.perform_update(serializer)
        
        # Also update user fields if included
        user = request.user
        user_fields = {}
        for field in ['first_name', 'last_name', 'phone']:
            if field in request_data:
                user_fields[field] = request_data.get(field)
        
        logger.error(f"User fields to update: {user_fields}")
        
        if user_fields:
            user.__dict__.update(user_fields)
            user.save()
        
        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}
        
        # Return complete user data including profile
        user_serializer = UserDetailSerializer(user)
        return Response(user_serializer.data)


class AddressListCreateView(generics.ListCreateAPIView):
    """List all addresses or create a new address."""
    
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete an address."""
    
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated, IsUserOwnerOrAdmin]
    
    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)


class PaymentMethodListCreateView(generics.ListCreateAPIView):
    """List all payment methods or create a new payment method."""
    
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PaymentMethodDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a payment method."""
    
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated, IsUserOwnerOrAdmin]
    
    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user)


class UserLogoutView(APIView):
    """Logout user and blacklist the refresh token."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            # Get the refresh token from request
            refresh_token = request.data.get('refresh_token')
            
            if refresh_token:
                # Blacklist the refresh token
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response(
                {'message': 'Logout successful'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': f'Logout failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


class DebugRegistrationView(APIView):
    """Debug endpoint to see what's wrong with registration requests"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        # Log request data
        logger.info("====== DEBUG REGISTRATION REQUEST ======")
        logger.info(f"Request data: {request.data}")
        
        # Manually validate against UserCreateSerializer to see exactly what's wrong
        serializer = UserCreateSerializer(data=request.data)
        is_valid = serializer.is_valid()
        
        if not is_valid:
            logger.info(f"Validation errors: {serializer.errors}")
            
            # Check specific fields
            email = request.data.get('email', '')
            password = request.data.get('password', '')
            first_name = request.data.get('first_name', '')
            last_name = request.data.get('last_name', '')
            phone = request.data.get('phone', '')
            
            logger.info(f"Email: {email} (valid: {'@' in email})")
            logger.info(f"Password provided: {bool(password)} (length: {len(password)})")
            logger.info(f"First name: {first_name}")
            logger.info(f"Last name: {last_name}")
            logger.info(f"Phone: {phone}")
            
            # Return detailed validation errors
            return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info("Request data is valid according to serializer!")
        logger.info(f"Validated data: {serializer.validated_data}")
        
        # Don't actually create the user, just return what would be created
        return Response({
            'message': 'This is a debug endpoint. User would be created with these details:',
            'data': serializer.validated_data
        })
