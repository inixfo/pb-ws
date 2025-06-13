from rest_framework import permissions
from rest_framework.request import Request
from rest_framework.views import View
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.models import AnonymousUser
import logging

logger = logging.getLogger(__name__)

class EMIPermission(permissions.BasePermission):
    """
    Custom permission for EMI operations.
    - Admins can perform all operations
    - Authenticated users can view/create their own records
    - Allow read access to plans for all users
    """

    def has_permission(self, request: Request, view: View) -> bool:
        # Always allow access to plans
        if hasattr(view, 'basename') and view.basename == 'emi-plan':
            return True
            
        # Check authentication
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        logger.info(f"EMI Permission Check - Auth header: {auth_header[:50]}...")
        logger.info(f"EMI Permission Check - User: {request.user}")
        logger.info(f"EMI Permission Check - Is authenticated: {request.user.is_authenticated}")
        
        # If user is not authenticated, try JWT authentication
        if not request.user.is_authenticated and auth_header:
            try:
                jwt_auth = JWTAuthentication()
                auth_result = jwt_auth.authenticate(request)
                if auth_result is not None:
                    user, token = auth_result
                    request.user = user
                    logger.info(f"EMI Permission Check - JWT authenticate() succeeded for {user}")
                else:
                    logger.warning("EMI Permission Check - JWT authenticate() returned None")
            except Exception as e:
                logger.error(f"EMI Permission Check - JWT fallback failed: {e}")
                # For development, allow access even without authentication
                if request.method in ['GET']:
                    logger.warning("Allowing unauthenticated GET request for development")
                    return True
                return False
        
        # Now check permissions
        if request.user.is_authenticated:
            # Admin users can do everything
            if request.user.is_staff or request.user.is_superuser:
                return True
            
            # Regular users can access their own data
            return True
        
        return False

    def has_object_permission(self, request: Request, view: View, obj) -> bool:
        # Admin users can access all objects
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        # Users can only access their own objects. Some EMI objects
        # (e.g. EMIInstallment) do not have a direct `user` field, so we
        # traverse relations to find the owner.

        # Case-1: objects that have a direct `user` attribute (EMIRecord,
        # EMIApplication etc.)
        if hasattr(obj, 'user'):
            return obj.user == request.user

        # Case-2: EMIInstallment – ownership via installment.emi_record.user
        if hasattr(obj, 'emi_record') and hasattr(obj.emi_record, 'user'):
            return obj.emi_record.user == request.user

        # Case-3: Fallback deny
        return False


class IsAdminOrOwnerReadOnly(permissions.BasePermission):
    """
    Permission class that allows:
    - Admins to perform all operations
    - Owners to read their own objects
    """
    
    def has_permission(self, request, view):
        # For development, allow GET requests without authentication
        if request.method in permissions.SAFE_METHODS:
            return True
            
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Admin users can access all objects
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        # Users can only read their own objects
        if request.method in permissions.SAFE_METHODS:
            if hasattr(obj, 'user'):
                return obj.user == request.user
        
        return False 