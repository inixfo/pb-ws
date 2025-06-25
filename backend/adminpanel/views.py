from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Sum, Avg, Q, F
from datetime import datetime, timedelta
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from products.models import Product, Category, Brand
from products.serializers import ProductSerializer
from vendors.models import VendorProfile, VendorApproval
from vendors.serializers import VendorProfileSerializer, VendorApprovalAdminSerializer
from orders.models import Order
from orders.serializers import OrderSerializer
from users.models import User
from users.permissions import IsAdminUser
from users.serializers import UserSerializer
from .models import SiteSettings
from .serializers import SiteSettingsSerializer


class DashboardViewSet(viewsets.ViewSet):
    """ViewSet for admin dashboard data."""
    
    permission_classes = [IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get summary data for the admin dashboard."""
        # Get counts
        total_products = Product.objects.count()
        pending_products = Product.objects.filter(is_approved=False).count()
        total_vendors = VendorProfile.objects.count()
        pending_vendors = VendorProfile.objects.filter(status='pending').count()
        total_orders = Order.objects.count()
        total_users = User.objects.count()
        
        # Revenue calculations
        completed_orders = Order.objects.filter(status='completed')
        total_revenue = completed_orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        # Recent activity
        recent_orders = Order.objects.order_by('-created_at')[:5]
        recent_vendors = VendorProfile.objects.order_by('-created_at')[:5]
        recent_products = Product.objects.order_by('-created_at')[:5]
        
        # Get data for the last 7 days
        last_week = datetime.now() - timedelta(days=7)
        orders_by_day = []
        revenue_by_day = []
        
        for i in range(7):
            day = last_week + timedelta(days=i)
            next_day = day + timedelta(days=1)
            day_orders = Order.objects.filter(created_at__gte=day, created_at__lt=next_day)
            day_revenue = day_orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            
            orders_by_day.append({
                'date': day.strftime('%Y-%m-%d'),
                'count': day_orders.count()
            })
            
            revenue_by_day.append({
                'date': day.strftime('%Y-%m-%d'),
                'amount': day_revenue
            })
        
        # Top categories
        top_categories = Category.objects.annotate(
            product_count=Count('products')
        ).order_by('-product_count')[:5]
        
        # Top brands
        top_brands = Brand.objects.annotate(
            product_count=Count('products')
        ).order_by('-product_count')[:5]
        
        return Response({
            'counts': {
                'products': total_products,
                'pending_products': pending_products,
                'vendors': total_vendors,
                'pending_vendors': pending_vendors,
                'orders': total_orders,
                'users': total_users,
            },
            'revenue': {
                'total': total_revenue,
                'by_day': revenue_by_day
            },
            'activity': {
                'orders_by_day': orders_by_day,
            },
            'top_categories': [
                {'name': cat.name, 'count': cat.product_count}
                for cat in top_categories
            ],
            'top_brands': [
                {'name': brand.name, 'count': brand.product_count}
                for brand in top_brands
            ]
        })


class ProductApprovalViewSet(viewsets.ModelViewSet):
    """ViewSet for product approval operations."""
    
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """Filter products based on query parameters."""
        queryset = Product.objects.all().order_by('-created_at')
        
        # Filter by approval status
        is_approved = self.request.query_params.get('is_approved', None)
        if is_approved is not None:
            is_approved = is_approved.lower() == 'true'
            queryset = queryset.filter(is_approved=is_approved)
        
        # Filter by vendor
        vendor_id = self.request.query_params.get('vendor_id', None)
        if vendor_id:
            queryset = queryset.filter(vendor_id=vendor_id)
        
        # Filter by category
        category_id = self.request.query_params.get('category_id', None)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a product."""
        product = self.get_object()
        product.is_approved = True
        product.save()
        
        serializer = self.get_serializer(product)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a product."""
        product = self.get_object()
        product.is_approved = False
        product.save()
        
        serializer = self.get_serializer(product)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending products."""
        products = Product.objects.filter(is_approved=False).order_by('-created_at')
        page = self.paginate_queryset(products)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def bulk_approve(self, request):
        """Bulk approve products."""
        product_ids = request.data.get('product_ids', [])
        if not product_ids:
            return Response(
                {'error': 'No product IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        products = Product.objects.filter(id__in=product_ids)
        updated_count = products.update(is_approved=True)
        
        return Response({
            'message': f'{updated_count} products approved successfully',
            'approved_count': updated_count
        })


class VendorManagementViewSet(viewsets.ModelViewSet):
    """ViewSet for vendor management operations."""
    
    queryset = VendorProfile.objects.all().order_by('-created_at')
    serializer_class = VendorProfileSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """Filter vendors based on query parameters."""
        queryset = VendorProfile.objects.all().order_by('-created_at')
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by is_featured
        is_featured = self.request.query_params.get('is_featured', None)
        if is_featured is not None:
            is_featured = is_featured.lower() == 'true'
            queryset = queryset.filter(is_featured=is_featured)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a vendor."""
        vendor = self.get_object()
        
        # Find latest approval request or create new one
        approval = VendorApproval.objects.filter(vendor=vendor).order_by('-created_at').first()
        if not approval:
            approval = VendorApproval.objects.create(
                vendor=vendor,
                admin_user=request.user
            )
        
        # Update status
        approval.status = 'approved'
        approval.admin_user = request.user
        approval.admin_notes = request.data.get('admin_notes', '')
        approval.save()
        
        # Update vendor status
        vendor.status = 'approved'
        vendor.save()
        
        serializer = self.get_serializer(vendor)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a vendor."""
        vendor = self.get_object()
        
        # Find latest approval request or create new one
        approval = VendorApproval.objects.filter(vendor=vendor).order_by('-created_at').first()
        if not approval:
            approval = VendorApproval.objects.create(
                vendor=vendor,
                admin_user=request.user
            )
        
        # Update status
        approval.status = 'rejected'
        approval.admin_user = request.user
        approval.admin_notes = request.data.get('admin_notes', '')
        approval.save()
        
        # Update vendor status
        vendor.status = 'rejected'
        vendor.save()
        
        serializer = self.get_serializer(vendor)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspend a vendor."""
        vendor = self.get_object()
        vendor.status = 'suspended'
        vendor.save()
        
        serializer = self.get_serializer(vendor)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def feature(self, request, pk=None):
        """Set a vendor as featured."""
        vendor = self.get_object()
        vendor.is_featured = True
        vendor.save()
        
        serializer = self.get_serializer(vendor)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def unfeature(self, request, pk=None):
        """Unset a vendor as featured."""
        vendor = self.get_object()
        vendor.is_featured = False
        vendor.save()
        
        serializer = self.get_serializer(vendor)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending vendors."""
        vendors = VendorProfile.objects.filter(status='pending').order_by('-created_at')
        page = self.paginate_queryset(vendors)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(vendors, many=True)
        return Response(serializer.data)


class OrderManagementViewSet(viewsets.ModelViewSet):
    """ViewSet for order management operations."""
    
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """Filter orders based on query parameters."""
        queryset = Order.objects.all().order_by('-created_at')
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by vendor
        vendor_id = self.request.query_params.get('vendor_id', None)
        if vendor_id:
            queryset = queryset.filter(items__product__vendor_id=vendor_id).distinct()
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        
        end_date = self.request.query_params.get('end_date', None)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get order statistics."""
        # Get counts by status
        order_counts = {}
        for status_choice in Order.STATUS_CHOICES:
            status_code = status_choice[0]
            order_counts[status_code] = Order.objects.filter(status=status_code).count()
        
        # Get total revenue
        total_revenue = Order.objects.filter(status='completed').aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        return Response({
            'counts_by_status': order_counts,
            'total_revenue': total_revenue,
            'total_orders': Order.objects.count(),
        })


class SystemSettingsViewSet(viewsets.ViewSet):
    """ViewSet for system settings."""
    
    permission_classes = [IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def user_stats(self, request):
        """Get user statistics."""
        # Get counts by role
        user_counts = {}
        roles = ['customer', 'vendor', 'admin']
        for role in roles:
            user_counts[role] = User.objects.filter(role=role).count()
        
        # Get new users in last 30 days
        thirty_days_ago = datetime.now() - timedelta(days=30)
        new_users = User.objects.filter(date_joined__gte=thirty_days_ago).count()
        
        return Response({
            'counts_by_role': user_counts,
            'total_users': User.objects.count(),
            'new_users_last_30_days': new_users,
        })
    
    @action(detail=False, methods=['get'])
    def category_stats(self, request):
        """Get category statistics."""
        categories = Category.objects.annotate(
            product_count=Count('products'),
            avg_price=Avg('products__price')
        ).values('id', 'name', 'product_count', 'avg_price')
        
        return Response(categories)


class UserManagementViewSet(viewsets.ModelViewSet):
    """ViewSet for user management operations."""
    
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """Filter users based on query parameters."""
        queryset = User.objects.all().order_by('-date_joined')
        
        # Filter by role
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        
        # Filter by is_active
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active)
        
        # Search by email or name
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Create a new user with optional vendor profile."""
        # Extract vendor profile data if present
        vendor_profile_data = None
        if 'vendor_profile' in request.data:
            vendor_profile_data = request.data.pop('vendor_profile')
        
        # Create the user
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # If this user is a vendor and we have vendor profile data
        if user.role == 'vendor' and vendor_profile_data:
            # Mark as created by admin for auto-approval
            user._created_by_admin = True
            user.save()
            
            # If vendor profile is already created by signal, update it
            from vendors.models import VendorProfile
            
            try:
                vendor_profile = VendorProfile.objects.get(user=user)
                
                # Update fields
                for key, value in vendor_profile_data.items():
                    if hasattr(vendor_profile, key):
                        setattr(vendor_profile, key, value)
                
                vendor_profile.status = 'approved'  # Admin created, so auto-approve
                vendor_profile.save()
            except VendorProfile.DoesNotExist:
                # Should not happen due to signal, but just in case
                pass
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a user account."""
        user = self.get_object()
        user.is_active = True
        user.save()
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a user account."""
        user = self.get_object()
        user.is_active = False
        user.save()
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get user statistics."""
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        inactive_users = User.objects.filter(is_active=False).count()
        
        # Count by role
        admin_count = User.objects.filter(role='admin').count()
        vendor_count = User.objects.filter(role='vendor').count()
        customer_count = User.objects.filter(role='user').count()
        
        # New users in last 30 days
        thirty_days_ago = datetime.now() - timedelta(days=30)
        new_users = User.objects.filter(date_joined__gte=thirty_days_ago).count()
        
        return Response({
            'total': total_users,
            'active': active_users,
            'inactive': inactive_users,
            'admin_count': admin_count,
            'vendor_count': vendor_count,
            'customer_count': customer_count,
            'new_users_last_30_days': new_users
        })


class SiteSettingsView(APIView):
    """API view to get site settings."""
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get site settings."""
        settings = SiteSettings.get_settings()
        serializer = SiteSettingsSerializer(settings)
        return Response(serializer.data)
