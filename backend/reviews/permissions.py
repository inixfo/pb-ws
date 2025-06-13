from rest_framework import permissions


class IsReviewOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of a review to edit it.
    Admins can edit or delete any review.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Admin can edit/delete any review
        if request.user.is_staff:
            return True
        
        # Write permissions are only allowed to the owner
        return obj.user == request.user


class IsReplyOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of a reply to edit it.
    Admins can edit or delete any reply.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Admin can edit/delete any reply
        if request.user.is_staff:
            return True
        
        # Write permissions are only allowed to the owner
        return obj.user == request.user


class IsVendorOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow vendors to respond to reviews on their products.
    Admins can respond to any review.
    """
    
    def has_permission(self, request, view):
        # Admin can always respond
        if request.user.is_staff:
            return True
        
        # Check if user is a vendor
        return hasattr(request.user, 'vendor_profile')
    
    def has_object_permission(self, request, view, obj):
        # Admin can always respond
        if request.user.is_staff:
            return True
        
        # Vendor can only respond to reviews on their products
        if hasattr(request.user, 'vendor_profile'):
            return obj.product.vendor == request.user.vendor_profile
        
        return False 