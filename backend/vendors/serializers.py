from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import VendorProfile, StoreSettings, VendorApproval, VendorBankAccount

User = get_user_model()


class VendorProfileSerializer(serializers.ModelSerializer):
    """Serializer for vendor profile."""
    
    class Meta:
        model = VendorProfile
        fields = [
            'id', 'user', 'company_name', 'slug', 'business_email', 'business_phone',
            'tax_id', 'business_address', 'city', 'state', 'postal_code', 'country',
            'status', 'is_featured', 'rating', 'business_certificate', 'id_proof',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'slug', 'status', 'is_featured', 'rating', 'created_at', 'updated_at']


class VendorProfileCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating vendor profile."""
    
    class Meta:
        model = VendorProfile
        fields = [
            'company_name', 'business_email', 'business_phone',
            'tax_id', 'business_address', 'city', 'state', 'postal_code', 'country',
            'business_certificate', 'id_proof'
        ]
    
    def create(self, validated_data):
        user = self.context['request'].user
        
        # Check if user already has a vendor profile
        if hasattr(user, 'vendor_profile'):
            raise serializers.ValidationError("User already has a vendor profile")
        
        # Create vendor profile
        vendor_profile = VendorProfile.objects.create(
            user=user,
            **validated_data
        )
        
        # Create default store settings
        StoreSettings.objects.create(
            vendor=vendor_profile,
            store_name=vendor_profile.company_name
        )
        
        return vendor_profile


class StoreSettingsSerializer(serializers.ModelSerializer):
    """Serializer for vendor store settings."""
    
    class Meta:
        model = StoreSettings
        fields = [
            'id', 'store_name', 'store_description', 'logo', 'banner',
            'support_email', 'support_phone', 'website', 'facebook', 'instagram', 'twitter',
            'enable_emi', 'enable_cod', 'auto_approve_reviews', 'commission_rate',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['commission_rate', 'created_at', 'updated_at']


class VendorApprovalSerializer(serializers.ModelSerializer):
    """Serializer for vendor approval requests."""
    
    class Meta:
        model = VendorApproval
        fields = [
            'id', 'vendor', 'status', 'admin_notes', 'admin_user',
            'additional_document1', 'additional_document2',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['status', 'admin_notes', 'admin_user', 'created_at', 'updated_at']


class VendorApprovalAdminSerializer(serializers.ModelSerializer):
    """Serializer for admin to manage vendor approval requests."""
    
    class Meta:
        model = VendorApproval
        fields = [
            'id', 'vendor', 'status', 'admin_notes',
            'additional_document1', 'additional_document2',
            'created_at', 'updated_at'
        ]


class VendorBankAccountSerializer(serializers.ModelSerializer):
    """Serializer for vendor bank accounts."""
    
    class Meta:
        model = VendorBankAccount
        fields = [
            'id', 'account_name', 'account_number', 'bank_name',
            'branch_name', 'routing_number', 'swift_code',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class VendorPublicProfileSerializer(serializers.ModelSerializer):
    """Serializer for public vendor profile information."""
    
    store_settings = StoreSettingsSerializer(read_only=True)
    
    class Meta:
        model = VendorProfile
        fields = [
            'id', 'company_name', 'slug', 'business_email', 'business_phone',
            'city', 'state', 'country', 'status', 'is_featured', 'rating',
            'store_settings', 'created_at'
        ] 