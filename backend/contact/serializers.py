from rest_framework import serializers
from .models import ContactInfo, ContactSubmission, Newsletter

class ContactInfoSerializer(serializers.ModelSerializer):
    """Serializer for the ContactInfo model."""
    
    class Meta:
        model = ContactInfo
        fields = [
            'id', 'address', 'phone', 'email', 'support_hours', 
            'google_maps_embed', 'facebook_url', 'twitter_url', 
            'instagram_url', 'linkedin_url'
        ]


class ContactSubmissionSerializer(serializers.ModelSerializer):
    """Serializer for creating a new contact submission."""
    
    class Meta:
        model = ContactSubmission
        fields = ['name', 'email', 'phone', 'subject', 'message']
    
    def create(self, validated_data):
        # Add IP address if available in the request
        request = self.context.get('request')
        if request:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0]
            else:
                ip = request.META.get('REMOTE_ADDR')
            validated_data['ip_address'] = ip
            
        return super().create(validated_data)


class ContactSubmissionDetailSerializer(serializers.ModelSerializer):
    """Serializer for viewing contact submission details (admin only)."""
    
    class Meta:
        model = ContactSubmission
        fields = [
            'id', 'name', 'email', 'phone', 'subject', 'message', 
            'status', 'admin_notes', 'ip_address', 'created_at', 
            'updated_at'
        ]


class NewsletterSerializer(serializers.ModelSerializer):
    """Serializer for newsletter subscriptions."""
    
    class Meta:
        model = Newsletter
        fields = ['email']
    
    def create(self, validated_data):
        # Add IP address if available in the request
        request = self.context.get('request')
        if request:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0]
            else:
                ip = request.META.get('REMOTE_ADDR')
            validated_data['ip_address'] = ip
        
        # Check if email already exists, update status to active if it does
        email = validated_data.get('email')
        existing = Newsletter.objects.filter(email=email).first()
        
        if existing:
            existing.is_active = True
            existing.save()
            return existing
            
        return super().create(validated_data) 