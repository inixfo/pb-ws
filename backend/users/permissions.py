from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admins to view or edit it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin permissions
        if request.user.is_staff or request.user.role == 'admin':
            return True
        
        # Check if the object has a user attribute
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # For User objects
        return obj == request.user


class IsUserOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission for objects that have a user field.
    Only allow owners of an object or admins to view or edit it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin permissions
        if request.user.is_staff or request.user.role == 'admin':
            return True
        
        # Check if the object belongs to the requesting user
        return obj.user == request.user


class IsVendorOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission for vendor-related objects.
    Only allow vendor owners of an object or admins to view or edit it.
    """
    
    def has_permission(self, request, view):
        # Allow admins and vendors
        return request.user.is_authenticated and (
            request.user.role == 'admin' or
            request.user.role == 'vendor' or
            request.user.is_staff
        )
    
    def has_object_permission(self, request, view, obj):
        # Admin permissions
        if request.user.is_staff or request.user.role == 'admin':
            return True
        
        # Check if the object has a vendor attribute
        if hasattr(obj, 'vendor'):
            # Check if the vendor is the requesting user
            if hasattr(obj.vendor, 'user'):
                return obj.vendor.user == request.user
            return obj.vendor == request.user
        
        # For Vendor objects
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False


class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow access to admin users.
    """
    
    def has_permission(self, request, view):
        # Allow only admins
        return request.user.is_authenticated and (
            request.user.role == 'admin' or
            request.user.is_staff
        ) 


class IsApprovedVendorOrAdmin(permissions.BasePermission):
    """
    Custom permission for vendor-related objects.
    Only allow approved vendor owners of an object or admins to view or edit it.
    """
    
    def has_permission(self, request, view):
        # Allow admins
        if request.user.is_staff or request.user.role == 'admin':
            return True
        
        # For vendors, check if they're approved
        if request.user.is_authenticated and request.user.role == 'vendor':
            try:
                vendor_profile = request.user.vendor_profile
                if vendor_profile.status != 'approved':
                    raise PermissionDenied(detail="Your vendor account must be approved before you can perform this action. Current vendor status: " + vendor_profile.status)
                return True
            except:
                return False
        
        return False
    
    def has_object_permission(self, request, view, obj):
        # Admin permissions
        if request.user.is_staff or request.user.role == 'admin':
            return True
        
        # For vendors, first check if they're approved
        try:
            vendor_profile = request.user.vendor_profile
            if vendor_profile.status != 'approved':
                return False
        except:
            return False
        
        # Check if the object has a vendor attribute
        if hasattr(obj, 'vendor'):
            # Check if the vendor is the requesting user
            if hasattr(obj.vendor, 'user'):
                return obj.vendor.user == request.user
            return obj.vendor == request.user
        
        # For Vendor objects
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False 