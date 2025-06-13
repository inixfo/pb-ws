from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from .models import Notification, NotificationTemplate, NotificationEvent, SMSProvider

User = get_user_model()


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for the Notification model."""
    
    content_type_name = serializers.SerializerMethodField()
    created_at_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'subject', 'body', 'recipient', 'status',
            'content_type', 'object_id', 'content_type_name',
            'sent_at', 'delivered_at', 'created_at', 'created_at_formatted'
        ]
        read_only_fields = fields
    
    def get_content_type_name(self, obj):
        """Get the name of the content type."""
        if obj.content_type:
            return obj.content_type.model
        return None
    
    def get_created_at_formatted(self, obj):
        """Get formatted creation date."""
        if obj.created_at:
            return obj.created_at.strftime('%Y-%m-%d %H:%M')
        return None


class NotificationTemplateSerializer(serializers.ModelSerializer):
    """Serializer for the NotificationTemplate model."""
    
    type_display = serializers.SerializerMethodField()
    
    class Meta:
        model = NotificationTemplate
        fields = [
            'id', 'name', 'type', 'type_display', 'subject', 
            'body', 'is_active', 'created_at', 'updated_at'
        ]
    
    def get_type_display(self, obj):
        """Get the display name of the notification type."""
        return obj.get_type_display()


class SMSProviderSerializer(serializers.ModelSerializer):
    """Serializer for the SMSProvider model."""
    
    provider_display = serializers.SerializerMethodField()
    
    class Meta:
        model = SMSProvider
        fields = [
            'id', 'name', 'provider', 'provider_display', 
            'api_key', 'api_secret', 'sender_id', 
            'is_active', 'config', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'api_key': {'write_only': True},
            'api_secret': {'write_only': True},
        }
    
    def get_provider_display(self, obj):
        """Get the display name of the provider."""
        return obj.get_provider_display()


class NotificationEventSerializer(serializers.ModelSerializer):
    """Serializer for the NotificationEvent model."""
    
    event_type_display = serializers.SerializerMethodField()
    email_template_name = serializers.SerializerMethodField()
    sms_template_name = serializers.SerializerMethodField()
    push_template_name = serializers.SerializerMethodField()
    
    class Meta:
        model = NotificationEvent
        fields = [
            'id', 'name', 'event_type', 'event_type_display',
            'email_template', 'email_template_name',
            'sms_template', 'sms_template_name',
            'push_template', 'push_template_name',
            'is_active', 'created_at', 'updated_at'
        ]
    
    def get_event_type_display(self, obj):
        """Get the display name of the event type."""
        return obj.get_event_type_display()
    
    def get_email_template_name(self, obj):
        """Get the name of the email template."""
        if obj.email_template:
            return obj.email_template.name
        return None
    
    def get_sms_template_name(self, obj):
        """Get the name of the SMS template."""
        if obj.sms_template:
            return obj.sms_template.name
        return None
    
    def get_push_template_name(self, obj):
        """Get the name of the push template."""
        if obj.push_template:
            return obj.push_template.name
        return None 