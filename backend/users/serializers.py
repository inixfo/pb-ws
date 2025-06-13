from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Profile, Address, PaymentMethod

User = get_user_model()


class UserMinimalSerializer(serializers.ModelSerializer):
    """Minimal serializer for user objects (used in reviews, comments, etc.)."""
    
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'first_name', 'last_name']
    
    def get_full_name(self, obj):
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.email


class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile."""
    
    bio = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True, format='%Y-%m-%d')
    
    class Meta:
        model = Profile
        fields = [
            'id', 'profile_picture', 'bio', 'date_of_birth',
            'company_name', 'business_address', 'business_registration_number', 'is_approved'
        ]
        read_only_fields = ['is_approved']
        
    def validate_date_of_birth(self, value):
        """
        Handle empty string dates by converting to None/null.
        """
        if value == '':
            return None
        return value
        
    def update(self, instance, validated_data):
        """Update profile instance."""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class AddressSerializer(serializers.ModelSerializer):
    """Serializer for user addresses."""
    
    class Meta:
        model = Address
        fields = [
            'id', 'address_type', 'full_name', 'phone', 'address_line1',
            'address_line2', 'city', 'state', 'postal_code', 'is_default'
        ]


class PaymentMethodSerializer(serializers.ModelSerializer):
    """Serializer for user payment methods."""
    
    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'payment_type', 'provider', 'account_number', 'is_default', 'is_verified'
        ]
        read_only_fields = ['is_verified']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user objects."""
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone', 'role', 'is_verified', 'is_active', 'date_joined']
        read_only_fields = ['is_verified', 'date_joined']


class UserDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for user objects with related data."""
    
    profile = ProfileSerializer(read_only=True)
    addresses = AddressSerializer(many=True, read_only=True)
    payment_methods = PaymentMethodSerializer(many=True, read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone', 'role',
            'is_verified', 'profile', 'addresses', 'payment_methods'
        ]
        read_only_fields = ['is_verified']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating user objects."""
    
    password = serializers.CharField(write_only=True, min_length=8)
    phone = serializers.CharField(required=True, help_text="Required for verification")
    is_vendor = serializers.BooleanField(write_only=True, required=False, default=False)
    company_name = serializers.CharField(write_only=True, required=False)
    business_email = serializers.EmailField(write_only=True, required=False)
    business_phone = serializers.CharField(write_only=True, required=False)
    business_address = serializers.CharField(write_only=True, required=False)
    city = serializers.CharField(write_only=True, required=False)
    state = serializers.CharField(write_only=True, required=False)
    postal_code = serializers.CharField(write_only=True, required=False)
    country = serializers.CharField(write_only=True, required=False)
    vendor_approved = serializers.BooleanField(write_only=True, required=False, default=False)
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'first_name', 'last_name', 'phone', 'role',
            'is_vendor', 'company_name', 'business_email', 'business_phone',
            'business_address', 'city', 'state', 'postal_code', 'country',
            'vendor_approved'
        ]
        extra_kwargs = {'password': {'write_only': True, 'min_length': 8}}
    
    def validate(self, attrs):
        """Validate vendor registration data."""
        is_vendor = attrs.get('is_vendor', False)
        
        # Validate phone number format
        phone = attrs.get('phone', '')
        if not phone:
            raise serializers.ValidationError({'phone': 'Phone number is required'})
        
        # Basic validation - can be improved with regex
        cleaned_phone = ''.join(filter(str.isdigit, phone))
        if len(cleaned_phone) < 10:
            raise serializers.ValidationError({'phone': 'Phone number must be at least 10 digits'})
        
        # If registering as vendor, validate required vendor fields
        if is_vendor:
            # Set role to 'vendor'
            attrs['role'] = 'vendor'
            
            # Check for required vendor fields
            required_fields = ['company_name', 'business_email', 'business_phone', 
                              'business_address', 'city', 'state', 'postal_code', 'country']
            
            missing_fields = [field for field in required_fields if not attrs.get(field)]
            if missing_fields:
                raise serializers.ValidationError({
                    'vendor_fields': f"Missing required vendor fields: {', '.join(missing_fields)}"
                })
        
        return attrs
    
    def create(self, validated_data):
        """Create a new user with encrypted password and return it."""
        # Remove vendor-specific fields before creating user
        vendor_fields = {
            'is_vendor', 'company_name', 'business_email', 'business_phone',
            'business_address', 'city', 'state', 'postal_code', 'country',
            'vendor_approved'
        }
        
        user_data = {k: v for k, v in validated_data.items() if k not in vendor_fields}
        
        # If registering as vendor, set role
        if validated_data.get('is_vendor', False):
            user_data['role'] = 'vendor'
        
        # Create user
        user = User.objects.create_user(**user_data)
        
        # Store vendor fields on user for access in signal
        if validated_data.get('is_vendor', False):
            user.company_name = validated_data.get('company_name')
            user.business_email = validated_data.get('business_email')
            user.business_phone = validated_data.get('business_phone')
            user.business_address = validated_data.get('business_address')
            user.city = validated_data.get('city')
            user.state = validated_data.get('state')
            user.postal_code = validated_data.get('postal_code')
            user.country = validated_data.get('country')
            user.vendor_approved = validated_data.get('vendor_approved', False)
            
            # Not saving here as the signal will handle creating the vendor profile
        
        # Create an empty profile for the user
        Profile.objects.create(user=user)
        
        return user


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change endpoint."""
    
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value 