from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import ContactInfo, ContactSubmission, Newsletter
from .serializers import (
    ContactInfoSerializer, 
    ContactSubmissionSerializer,
    ContactSubmissionDetailSerializer,
    NewsletterSerializer
)


class ContactInfoViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for retrieving contact information."""
    queryset = ContactInfo.objects.filter(is_active=True)
    serializer_class = ContactInfoSerializer
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get the active contact information."""
        contact_info = ContactInfo.objects.filter(is_active=True).first()
        if contact_info:
            serializer = self.get_serializer(contact_info)
            return Response(serializer.data)
        return Response({}, status=status.HTTP_404_NOT_FOUND)


class ContactSubmissionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing contact submissions."""
    queryset = ContactSubmission.objects.all()
    permission_classes = [permissions.IsAdminUser]  # Admin-only for all methods except create
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return ContactSubmissionSerializer
        return ContactSubmissionDetailSerializer
    
    def get_permissions(self):
        """Allow anyone to create a submission, but only admins to view/edit them."""
        if self.action == 'create':
            return [permissions.AllowAny()]
        return super().get_permissions()
    
    def create(self, request, *args, **kwargs):
        """Create a new contact submission."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {"message": "Your message has been sent. We'll get back to you soon."},
            status=status.HTTP_201_CREATED, 
            headers=headers
        )


class NewsletterViewSet(viewsets.ModelViewSet):
    """ViewSet for managing newsletter subscriptions."""
    queryset = Newsletter.objects.all()
    serializer_class = NewsletterSerializer
    permission_classes = [permissions.IsAdminUser]  # Admin-only for all methods except create
    
    def get_permissions(self):
        """Allow anyone to subscribe, but only admins to view/edit them."""
        if self.action == 'create':
            return [permissions.AllowAny()]
        return super().get_permissions()
    
    def create(self, request, *args, **kwargs):
        """Create a new newsletter subscription."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {"message": "You've been successfully subscribed to our newsletter."},
            status=status.HTTP_201_CREATED, 
            headers=headers
        )
