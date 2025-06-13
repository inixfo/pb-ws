from rest_framework import permissions


class IsAdminOrVendorReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow:
    - Admin users full access
    - Vendors read-only access to their own data
    """

    def has_permission(self, request, view):
        # Allow admin users full access
        if request.user.is_staff:
            return True
        
        # Allow authenticated vendors read-only access
        if request.user.is_authenticated and hasattr(request.user, 'vendor_profile'):
            return request.method in permissions.SAFE_METHODS
        
        return False
    
    def has_object_permission(self, request, view, obj):
        # Allow admin users full access
        if request.user.is_staff:
            return True
        
        # For vendors, check if the object belongs to them
        if hasattr(request.user, 'vendor_profile'):
            vendor = request.user.vendor_profile
            
            # For SalesMetric
            if hasattr(obj, 'vendor') and obj.vendor == vendor:
                return request.method in permissions.SAFE_METHODS
            
            # For ProductView and CartEvent
            if hasattr(obj, 'product') and obj.product.vendor == vendor:
                return request.method in permissions.SAFE_METHODS
        
        return False 