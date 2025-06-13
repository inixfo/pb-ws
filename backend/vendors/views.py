from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q

from .models import VendorProfile, StoreSettings, VendorApproval, VendorBankAccount
from .serializers import (
    VendorProfileSerializer, VendorProfileCreateSerializer,
    StoreSettingsSerializer, VendorApprovalSerializer,
    VendorApprovalAdminSerializer, VendorBankAccountSerializer,
    VendorPublicProfileSerializer
)
from users.permissions import IsOwnerOrAdmin


class IsVendorOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of a vendor profile or admins to access it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Check if user is the owner of the vendor profile or an admin
        return obj.user == request.user or request.user.is_staff or request.user.role == 'admin'


class VendorProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for vendor profiles."""
    
    serializer_class = VendorProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return vendor profiles based on user role."""
        user = self.request.user
        
        # Admin can see all vendor profiles
        if user.is_staff or user.role == 'admin':
            return VendorProfile.objects.all()
        
        # Vendors can only see their own profile
        return VendorProfile.objects.filter(user=user)
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return VendorProfileCreateSerializer
        return VendorProfileSerializer
    
    def get_permissions(self):
        """Return appropriate permissions based on action."""
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsVendorOwnerOrAdmin()]
        return [permissions.IsAuthenticated()]
    
    def create(self, request, *args, **kwargs):
        """Create a new vendor profile."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.context['request'] = request
        vendor_profile = serializer.save()
        
        # Create initial approval request
        VendorApproval.objects.create(vendor=vendor_profile)
        
        return Response(
            VendorProfileSerializer(vendor_profile).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """Get the current user's vendor profile."""
        try:
            vendor_profile = VendorProfile.objects.get(user=request.user)
            serializer = VendorProfileSerializer(vendor_profile)
            return Response(serializer.data)
        except VendorProfile.DoesNotExist:
            # Create default vendor profile if user is a vendor
            if request.user.role == 'vendor':
                vendor_profile = VendorProfile.objects.create(
                    user=request.user,
                    company_name=f"{request.user.first_name}'s Company",
                    business_email=request.user.email,
                    business_phone=request.user.phone or "",
                    business_address="",
                    city="",
                    state="",
                    postal_code="",
                    country=""
                )
                
                # Create default store settings
                StoreSettings.objects.create(
                    vendor=vendor_profile,
                    store_name=vendor_profile.company_name
                )
                
                # Create initial approval request
                VendorApproval.objects.create(vendor=vendor_profile)
                
                serializer = VendorProfileSerializer(vendor_profile)
                return Response(serializer.data)
            else:
                return Response(
                    {'error': 'Vendor profile not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
    
    @action(detail=False, methods=['get'])
    def approved(self, request):
        """Get all approved vendor profiles."""
        vendor_profiles = VendorProfile.objects.filter(status='approved')
        page = self.paginate_queryset(vendor_profiles)
        
        if page is not None:
            serializer = VendorPublicProfileSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = VendorPublicProfileSerializer(vendor_profiles, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def public_profile(self, request, pk=None):
        """Get public profile of a vendor."""
        vendor_profile = self.get_object()
        serializer = VendorPublicProfileSerializer(vendor_profile)
        return Response(serializer.data)


class StoreSettingsViewSet(viewsets.ModelViewSet):
    """ViewSet for vendor store settings."""
    
    serializer_class = StoreSettingsSerializer
    permission_classes = [permissions.IsAuthenticated, IsVendorOwnerOrAdmin]
    
    def get_queryset(self):
        """Return store settings based on user role."""
        user = self.request.user
        
        # Admin can see all store settings
        if user.is_staff or user.role == 'admin':
            return StoreSettings.objects.all()
        
        # Vendors can only see their own store settings
        try:
            vendor_profile = VendorProfile.objects.get(user=user)
            return StoreSettings.objects.filter(vendor=vendor_profile)
        except VendorProfile.DoesNotExist:
            return StoreSettings.objects.none()
    
    @action(detail=False, methods=['get'])
    def my_store(self, request):
        """Get the current user's store settings."""
        try:
            vendor_profile = VendorProfile.objects.get(user=request.user)
            store_settings = StoreSettings.objects.get(vendor=vendor_profile)
            serializer = StoreSettingsSerializer(store_settings)
            return Response(serializer.data)
        except (VendorProfile.DoesNotExist, StoreSettings.DoesNotExist):
            return Response(
                {'error': 'Store settings not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class VendorApprovalViewSet(viewsets.ModelViewSet):
    """ViewSet for vendor approval requests."""
    
    serializer_class = VendorApprovalSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return approval requests based on user role."""
        user = self.request.user
        
        # Admin can see all approval requests
        if user.is_staff or user.role == 'admin':
            return VendorApproval.objects.all()
        
        # Vendors can only see their own approval requests
        try:
            vendor_profile = VendorProfile.objects.get(user=user)
            return VendorApproval.objects.filter(vendor=vendor_profile)
        except VendorProfile.DoesNotExist:
            return VendorApproval.objects.none()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on user role."""
        user = self.request.user
        if user.is_staff or user.role == 'admin':
            return VendorApprovalAdminSerializer
        return VendorApprovalSerializer
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a vendor approval request (admin only)."""
        if not request.user.is_staff and request.user.role != 'admin':
            return Response(
                {'error': 'Only administrators can approve vendors'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        approval = self.get_object()
        approval.status = 'approved'
        approval.admin_user = request.user
        approval.admin_notes = request.data.get('admin_notes', '')
        approval.save()
        
        # Update vendor profile status
        vendor = approval.vendor
        vendor.status = 'approved'
        vendor.save()
        
        return Response(
            VendorApprovalAdminSerializer(approval).data
        )
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a vendor approval request (admin only)."""
        if not request.user.is_staff and request.user.role != 'admin':
            return Response(
                {'error': 'Only administrators can reject vendors'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        approval = self.get_object()
        approval.status = 'rejected'
        approval.admin_user = request.user
        approval.admin_notes = request.data.get('admin_notes', '')
        approval.save()
        
        # Update vendor profile status
        vendor = approval.vendor
        vendor.status = 'rejected'
        vendor.save()
        
        return Response(
            VendorApprovalAdminSerializer(approval).data
        )


class VendorBankAccountViewSet(viewsets.ModelViewSet):
    """ViewSet for vendor bank accounts."""
    
    serializer_class = VendorBankAccountSerializer
    permission_classes = [permissions.IsAuthenticated, IsVendorOwnerOrAdmin]
    
    def get_queryset(self):
        """Return bank accounts based on user role."""
        user = self.request.user
        
        # Admin can see all bank accounts
        if user.is_staff or user.role == 'admin':
            return VendorBankAccount.objects.all()
        
        # Vendors can only see their own bank account
        try:
            vendor_profile = VendorProfile.objects.get(user=user)
            return VendorBankAccount.objects.filter(vendor=vendor_profile)
        except VendorProfile.DoesNotExist:
            return VendorBankAccount.objects.none()
    
    def perform_create(self, serializer):
        """Set vendor when creating bank account."""
        try:
            vendor_profile = VendorProfile.objects.get(user=self.request.user)
            serializer.save(vendor=vendor_profile)
        except VendorProfile.DoesNotExist:
            raise serializers.ValidationError("Vendor profile not found")
    
    @action(detail=False, methods=['get'])
    def my_bank_account(self, request):
        """Get the current user's bank account."""
        try:
            vendor_profile = VendorProfile.objects.get(user=request.user)
            bank_account = VendorBankAccount.objects.get(vendor=vendor_profile)
            serializer = VendorBankAccountSerializer(bank_account)
            return Response(serializer.data)
        except (VendorProfile.DoesNotExist, VendorBankAccount.DoesNotExist):
            return Response(
                {'error': 'Bank account not found'},
                status=status.HTTP_404_NOT_FOUND
            )
