from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Notification, NotificationTemplate, NotificationEvent, SMSProvider
from .serializers import (
    NotificationSerializer, 
    NotificationTemplateSerializer,
    NotificationEventSerializer,
    SMSProviderSerializer
)
from .notification_service import NotificationService


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for viewing notifications."""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return notifications for the current user."""
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def unread(self):
        """Return unread notifications."""
        queryset = self.get_queryset().filter(status='sent')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a notification as read."""
        notification = self.get_object()
        notification.status = 'delivered'
        notification.save()
        return Response({'status': 'success'})
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Mark all notifications as read."""
        self.get_queryset().filter(status='sent').update(status='delivered')
        return Response({'status': 'success'})


class AdminNotificationTemplateViewSet(viewsets.ModelViewSet):
    """API endpoint for managing notification templates (admin only)."""
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [permissions.IsAdminUser]


class AdminNotificationEventViewSet(viewsets.ModelViewSet):
    """API endpoint for managing notification events (admin only)."""
    queryset = NotificationEvent.objects.all()
    serializer_class = NotificationEventSerializer
    permission_classes = [permissions.IsAdminUser]
    
    @action(detail=True, methods=['post'])
    def test_notification(self, request, pk=None):
        """Test a notification event."""
        event = self.get_object()
        user = request.user
        
        # Get optional parameters
        email = request.data.get('email', user.email)
        phone = request.data.get('phone')
        context = request.data.get('context', {})
        
        # Add test context if not provided
        if not context:
            context = {
                'test': True,
                'message': 'This is a test notification',
                'user': {
                    'name': user.get_full_name() or user.email,
                    'email': user.email
                }
            }
        
        # Send test notification
        result = NotificationService.send_event_notification(
            event.event_type, user, context, email, phone
        )
        
        return Response({
            'status': 'success', 
            'message': f'Test notification sent for event: {event.name}',
            'result': result
        })


class AdminSMSProviderViewSet(viewsets.ModelViewSet):
    """API endpoint for managing SMS providers (admin only)."""
    queryset = SMSProvider.objects.all()
    serializer_class = SMSProviderSerializer
    permission_classes = [permissions.IsAdminUser]
    
    @action(detail=True, methods=['post'])
    def test_sms(self, request, pk=None):
        """Test an SMS provider."""
        provider = self.get_object()
        
        # Get required parameters
        phone = request.data.get('phone')
        message = request.data.get('message', 'This is a test SMS from Phone Bay')
        
        if not phone:
            return Response(
                {'error': 'Phone number is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Import here to avoid circular import
        from .services import SMSService
        
        # Temporarily set this provider as active
        was_active = provider.is_active
        if not was_active:
            # Deactivate all providers
            SMSProvider.objects.all().update(is_active=False)
            # Activate this provider
            provider.is_active = True
            provider.save()
        
        try:
            # Send test SMS
            result = SMSService.send_sms(phone, message, request.user)
            
            return Response({
                'status': result.status,
                'message': 'Test SMS sent' if result.status == 'sent' else result.error_message,
                'notification_id': result.id
            })
        finally:
            # Restore previous state if needed
            if not was_active:
                provider.is_active = False
                provider.save()
