from django.shortcuts import render
from django.db.models import Count, Sum, Avg, F, Q, ExpressionWrapper, DecimalField
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth, TruncYear
from django.utils import timezone
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from datetime import timedelta, datetime
import pandas as pd

from .models import PageView, ProductView, SearchQuery, CartEvent, SalesMetric
from .serializers import (
    PageViewSerializer, ProductViewSerializer, SearchQuerySerializer,
    CartEventSerializer, SalesMetricSerializer
)
from .permissions import IsAdminOrVendorReadOnly
from products.models import Product, Category
from orders.models import Order, OrderItem


class AnalyticsPagination(PageNumberPagination):
    """Custom pagination for analytics data."""
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 1000


class PageViewViewSet(viewsets.ModelViewSet):
    """API endpoint for page views."""
    queryset = PageView.objects.all().order_by('-timestamp')
    serializer_class = PageViewSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = AnalyticsPagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['timestamp', 'page_type']
    
    def get_queryset(self):
        """Return page views based on filters."""
        queryset = super().get_queryset()
        
        # Filter by page type
        page_type = self.request.query_params.get('page_type')
        if page_type:
            queryset = queryset.filter(page_type=page_type)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get summary statistics for page views."""
        # Get date range
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)  # Default to last 30 days
        
        if request.query_params.get('start_date'):
            start_date = datetime.fromisoformat(request.query_params.get('start_date'))
        if request.query_params.get('end_date'):
            end_date = datetime.fromisoformat(request.query_params.get('end_date'))
        
        # Get page views in date range
        queryset = PageView.objects.filter(timestamp__gte=start_date, timestamp__lte=end_date)
        
        # Calculate summary statistics
        summary = {
            'total_views': queryset.count(),
            'unique_visitors': queryset.values('session_id').distinct().count(),
            'by_page_type': queryset.values('page_type').annotate(
                count=Count('id')
            ).order_by('-count'),
            'daily_views': queryset.annotate(
                date=TruncDate('timestamp')
            ).values('date').annotate(
                count=Count('id')
            ).order_by('date')
        }
        
        return Response(summary)


class ProductViewViewSet(viewsets.ModelViewSet):
    """API endpoint for product views."""
    queryset = ProductView.objects.all().order_by('-timestamp')
    serializer_class = ProductViewSerializer
    permission_classes = [IsAdminOrVendorReadOnly]
    pagination_class = AnalyticsPagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['timestamp', 'view_duration']
    
    def get_queryset(self):
        """Return product views based on filters."""
        queryset = super().get_queryset()
        
        # Filter by product
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)
        
        # For vendors, only show their products
        if not self.request.user.is_staff and hasattr(self.request.user, 'vendor_profile'):
            vendor = self.request.user.vendor_profile
            queryset = queryset.filter(product__vendor=vendor)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def popular_products(self, request):
        """Get most viewed products."""
        # Get date range
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)  # Default to last 30 days
        
        if request.query_params.get('start_date'):
            start_date = datetime.fromisoformat(request.query_params.get('start_date'))
        if request.query_params.get('end_date'):
            end_date = datetime.fromisoformat(request.query_params.get('end_date'))
        
        # Get product views in date range
        queryset = ProductView.objects.filter(timestamp__gte=start_date, timestamp__lte=end_date)
        
        # For vendors, only show their products
        if not request.user.is_staff and hasattr(request.user, 'vendor_profile'):
            vendor = request.user.vendor_profile
            queryset = queryset.filter(product__vendor=vendor)
        
        # Get popular products
        popular_products = queryset.values('product').annotate(
            views=Count('id'),
            avg_duration=Avg('view_duration')
        ).order_by('-views')[:10]
        
        # Enrich with product data
        for item in popular_products:
            product = Product.objects.get(id=item['product'])
            item['name'] = product.name
            item['price'] = float(product.price)
            item['rating'] = product.rating
        
        return Response(popular_products)


class SearchQueryViewSet(viewsets.ModelViewSet):
    """API endpoint for search queries."""
    queryset = SearchQuery.objects.all().order_by('-timestamp')
    serializer_class = SearchQuerySerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = AnalyticsPagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['timestamp', 'results_count']
    
    @action(detail=False, methods=['get'])
    def popular_searches(self, request):
        """Get most popular search queries."""
        # Get date range
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)  # Default to last 30 days
        
        if request.query_params.get('start_date'):
            start_date = datetime.fromisoformat(request.query_params.get('start_date'))
        if request.query_params.get('end_date'):
            end_date = datetime.fromisoformat(request.query_params.get('end_date'))
        
        # Get search queries in date range
        queryset = SearchQuery.objects.filter(timestamp__gte=start_date, timestamp__lte=end_date)
        
        # Get popular searches
        popular_searches = queryset.values('query').annotate(
            count=Count('id'),
            avg_results=Avg('results_count'),
            click_rate=Count('clicked_product') * 100.0 / Count('id')
        ).order_by('-count')[:20]
        
        return Response(popular_searches)
    
    @action(detail=False, methods=['get'])
    def zero_results(self, request):
        """Get search queries with zero results."""
        # Get date range
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)  # Default to last 30 days
        
        if request.query_params.get('start_date'):
            start_date = datetime.fromisoformat(request.query_params.get('start_date'))
        if request.query_params.get('end_date'):
            end_date = datetime.fromisoformat(request.query_params.get('end_date'))
        
        # Get search queries with zero results
        queryset = SearchQuery.objects.filter(
            timestamp__gte=start_date,
            timestamp__lte=end_date,
            results_count=0
        )
        
        # Group by query
        zero_results = queryset.values('query').annotate(
            count=Count('id')
        ).order_by('-count')[:20]
        
        return Response(zero_results)


class CartEventViewSet(viewsets.ModelViewSet):
    """API endpoint for cart events."""
    queryset = CartEvent.objects.all().order_by('-timestamp')
    serializer_class = CartEventSerializer
    permission_classes = [IsAdminOrVendorReadOnly]
    pagination_class = AnalyticsPagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['timestamp', 'event_type']
    
    def get_queryset(self):
        """Return cart events based on filters."""
        queryset = super().get_queryset()
        
        # Filter by event type
        event_type = self.request.query_params.get('event_type')
        if event_type:
            queryset = queryset.filter(event_type=event_type)
        
        # Filter by product
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)
        
        # For vendors, only show their products
        if not self.request.user.is_staff and hasattr(self.request.user, 'vendor_profile'):
            vendor = self.request.user.vendor_profile
            queryset = queryset.filter(product__vendor=vendor)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def cart_abandonment(self, request):
        """Get cart abandonment statistics."""
        # Get date range
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)  # Default to last 30 days
        
        if request.query_params.get('start_date'):
            start_date = datetime.fromisoformat(request.query_params.get('start_date'))
        if request.query_params.get('end_date'):
            end_date = datetime.fromisoformat(request.query_params.get('end_date'))
        
        # Get cart events in date range
        queryset = CartEvent.objects.filter(timestamp__gte=start_date, timestamp__lte=end_date)
        
        # For vendors, only show their products
        if not request.user.is_staff and hasattr(request.user, 'vendor_profile'):
            vendor = request.user.vendor_profile
            queryset = queryset.filter(product__vendor=vendor)
        
        # Count events by type
        add_count = queryset.filter(event_type='add').count()
        checkout_count = queryset.filter(event_type='checkout').count()
        abandon_count = queryset.filter(event_type='abandon').count()
        
        # Calculate abandonment rate
        total_carts = checkout_count + abandon_count
        abandonment_rate = (abandon_count / total_carts * 100) if total_carts > 0 else 0
        
        # Most abandoned products
        abandoned_products = queryset.filter(event_type='abandon').values('product').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Enrich with product data
        for item in abandoned_products:
            product = Product.objects.get(id=item['product'])
            item['name'] = product.name
            item['price'] = float(product.price)
        
        return Response({
            'add_to_cart_count': add_count,
            'checkout_count': checkout_count,
            'abandon_count': abandon_count,
            'abandonment_rate': abandonment_rate,
            'most_abandoned_products': abandoned_products
        })


class SalesMetricViewSet(viewsets.ModelViewSet):
    """API endpoint for sales metrics."""
    queryset = SalesMetric.objects.all().order_by('-period_start')
    serializer_class = SalesMetricSerializer
    permission_classes = [IsAdminOrVendorReadOnly]
    pagination_class = AnalyticsPagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['period_start', 'total_sales']
    
    def get_queryset(self):
        """Return sales metrics based on filters."""
        queryset = super().get_queryset()
        
        # Filter by period type
        period_type = self.request.query_params.get('period_type')
        if period_type:
            queryset = queryset.filter(period_type=period_type)
        
        # Filter by category
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(period_start__gte=start_date)
        if end_date:
            queryset = queryset.filter(period_end__lte=end_date)
        
        # For vendors, only show their metrics
        if not self.request.user.is_staff and hasattr(self.request.user, 'vendor_profile'):
            vendor = self.request.user.vendor_profile
            queryset = queryset.filter(vendor=vendor)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate sales metrics for a specific period."""
        if not request.user.is_staff:
            return Response(
                {'error': 'Only admin users can generate sales metrics'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get parameters
        period_type = request.data.get('period_type', 'monthly')
        start_date_str = request.data.get('start_date')
        end_date_str = request.data.get('end_date')
        
        if not start_date_str:
            return Response(
                {'error': 'Start date is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse dates
        try:
            start_date = datetime.fromisoformat(start_date_str)
            end_date = datetime.fromisoformat(end_date_str) if end_date_str else timezone.now()
        except ValueError:
            return Response(
                {'error': 'Invalid date format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate metrics
        try:
            metrics = self._generate_metrics(period_type, start_date, end_date)
            return Response({
                'status': 'success',
                'metrics_generated': len(metrics),
                'period_type': period_type,
                'start_date': start_date,
                'end_date': end_date
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _generate_metrics(self, period_type, start_date, end_date):
        """Generate sales metrics for the given period."""
        # Get all orders in the date range
        orders = Order.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date,
            status__in=['completed', 'delivered']
        )
        
        # No orders, no metrics
        if not orders.exists():
            return []
        
        # Create a DataFrame from orders
        order_data = []
        for order in orders:
            for item in order.items.all():
                order_data.append({
                    'order_id': order.id,
                    'user_id': order.user_id,
                    'created_at': order.created_at,
                    'product_id': item.product_id,
                    'category_id': item.product.category_id if item.product else None,
                    'vendor_id': item.product.vendor_id if item.product else None,
                    'quantity': item.quantity,
                    'price': float(item.price),
                    'total': float(item.price) * item.quantity
                })
        
        df = pd.DataFrame(order_data)
        
        # Add period column based on period_type
        if period_type == 'daily':
            df['period_start'] = df['created_at'].dt.date
            df['period_end'] = df['period_start']
        elif period_type == 'weekly':
            df['period_start'] = df['created_at'].dt.to_period('W').dt.start_time.dt.date
            df['period_end'] = df['created_at'].dt.to_period('W').dt.end_time.dt.date
        elif period_type == 'monthly':
            df['period_start'] = df['created_at'].dt.to_period('M').dt.start_time.dt.date
            df['period_end'] = df['created_at'].dt.to_period('M').dt.end_time.dt.date
        elif period_type == 'yearly':
            df['period_start'] = df['created_at'].dt.to_period('Y').dt.start_time.dt.date
            df['period_end'] = df['created_at'].dt.to_period('Y').dt.end_time.dt.date
        
        # Generate overall metrics
        overall_metrics = []
        for period_start, period_data in df.groupby('period_start'):
            period_end = period_data['period_end'].iloc[0]
            
            # Calculate metrics
            total_sales = period_data['total'].sum()
            total_orders = period_data['order_id'].nunique()
            avg_order_value = total_sales / total_orders if total_orders > 0 else 0
            total_products = period_data['quantity'].sum()
            
            # Find top selling product
            product_sales = period_data.groupby('product_id')['quantity'].sum()
            top_product_id = product_sales.idxmax() if not product_sales.empty else None
            
            # Count customers
            users = period_data['user_id'].unique()
            # This is simplified - in reality you'd need to check if they ordered before this period
            new_customers = len(users)
            returning_customers = 0
            
            # Create or update metric
            metric, created = SalesMetric.objects.update_or_create(
                period_type=period_type,
                period_start=period_start,
                period_end=period_end,
                category=None,
                vendor=None,
                defaults={
                    'total_sales': total_sales,
                    'total_orders': total_orders,
                    'average_order_value': avg_order_value,
                    'total_products_sold': total_products,
                    'top_selling_product_id': top_product_id,
                    'new_customers': new_customers,
                    'returning_customers': returning_customers
                }
            )
            overall_metrics.append(metric)
        
        # Generate metrics by category
        category_metrics = []
        for (period_start, category_id), period_cat_data in df.groupby(['period_start', 'category_id']):
            if not category_id:
                continue
                
            period_end = period_cat_data['period_end'].iloc[0]
            
            # Calculate metrics
            total_sales = period_cat_data['total'].sum()
            total_orders = period_cat_data['order_id'].nunique()
            avg_order_value = total_sales / total_orders if total_orders > 0 else 0
            total_products = period_cat_data['quantity'].sum()
            
            # Find top selling product
            product_sales = period_cat_data.groupby('product_id')['quantity'].sum()
            top_product_id = product_sales.idxmax() if not product_sales.empty else None
            
            # Create or update metric
            try:
                category = Category.objects.get(id=category_id)
                metric, created = SalesMetric.objects.update_or_create(
                    period_type=period_type,
                    period_start=period_start,
                    period_end=period_end,
                    category=category,
                    vendor=None,
                    defaults={
                        'total_sales': total_sales,
                        'total_orders': total_orders,
                        'average_order_value': avg_order_value,
                        'total_products_sold': total_products,
                        'top_selling_product_id': top_product_id,
                        'new_customers': 0,  # Not tracking by category
                        'returning_customers': 0  # Not tracking by category
                    }
                )
                category_metrics.append(metric)
            except Category.DoesNotExist:
                continue
        
        # Generate metrics by vendor
        vendor_metrics = []
        for (period_start, vendor_id), period_vendor_data in df.groupby(['period_start', 'vendor_id']):
            if not vendor_id:
                continue
                
            period_end = period_vendor_data['period_end'].iloc[0]
            
            # Calculate metrics
            total_sales = period_vendor_data['total'].sum()
            total_orders = period_vendor_data['order_id'].nunique()
            avg_order_value = total_sales / total_orders if total_orders > 0 else 0
            total_products = period_vendor_data['quantity'].sum()
            
            # Find top selling product
            product_sales = period_vendor_data.groupby('product_id')['quantity'].sum()
            top_product_id = product_sales.idxmax() if not product_sales.empty else None
            
            # Create or update metric
            try:
                from vendors.models import VendorProfile
                vendor = VendorProfile.objects.get(id=vendor_id)
                metric, created = SalesMetric.objects.update_or_create(
                    period_type=period_type,
                    period_start=period_start,
                    period_end=period_end,
                    category=None,
                    vendor=vendor,
                    defaults={
                        'total_sales': total_sales,
                        'total_orders': total_orders,
                        'average_order_value': avg_order_value,
                        'total_products_sold': total_products,
                        'top_selling_product_id': top_product_id,
                        'new_customers': 0,  # Not tracking by vendor
                        'returning_customers': 0  # Not tracking by vendor
                    }
                )
                vendor_metrics.append(metric)
            except Exception:
                continue
        
        return overall_metrics + category_metrics + vendor_metrics


class DashboardView(APIView):
    """API endpoint for dashboard summary data."""
    permission_classes = [IsAdminOrVendorReadOnly]
    
    def get(self, request):
        """Get dashboard summary data."""
        # Get date range
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)  # Default to last 30 days
        
        if request.query_params.get('start_date'):
            start_date = datetime.fromisoformat(request.query_params.get('start_date'))
        if request.query_params.get('end_date'):
            end_date = datetime.fromisoformat(request.query_params.get('end_date'))
        
        # For vendors, only show their data
        vendor_filter = {}
        if not request.user.is_staff and hasattr(request.user, 'vendor_profile'):
            vendor = request.user.vendor_profile
            vendor_filter = {'vendor': vendor}
        
        # Get sales data
        sales_data = self._get_sales_data(start_date, end_date, vendor_filter)
        
        # Get product data
        product_data = self._get_product_data(start_date, end_date, vendor_filter)
        
        # Get customer data
        customer_data = self._get_customer_data(start_date, end_date, vendor_filter)
        
        return Response({
            'sales': sales_data,
            'products': product_data,
            'customers': customer_data
        })
    
    def _get_sales_data(self, start_date, end_date, vendor_filter):
        """Get sales summary data."""
        # Get orders in date range
        orders = Order.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date,
            status__in=['completed', 'delivered']
        )
        
        # Apply vendor filter if needed
        if vendor_filter and 'vendor' in vendor_filter:
            orders = orders.filter(items__product__vendor=vendor_filter['vendor'])
        
        # Calculate sales metrics
        total_sales = sum(order.total_amount for order in orders)
        total_orders = orders.count()
        avg_order_value = total_sales / total_orders if total_orders > 0 else 0
        
        # Get daily sales
        daily_sales = orders.annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            sales=Sum('total_amount'),
            orders=Count('id')
        ).order_by('date')
        
        return {
            'total_sales': float(total_sales),
            'total_orders': total_orders,
            'average_order_value': float(avg_order_value),
            'daily_sales': list(daily_sales)
        }
    
    def _get_product_data(self, start_date, end_date, vendor_filter):
        """Get product summary data."""
        # Get order items in date range
        order_items = OrderItem.objects.filter(
            order__created_at__gte=start_date,
            order__created_at__lte=end_date,
            order__status__in=['completed', 'delivered']
        )
        
        # Apply vendor filter if needed
        if vendor_filter and 'vendor' in vendor_filter:
            order_items = order_items.filter(product__vendor=vendor_filter['vendor'])
        
        # Calculate product metrics
        total_products_sold = order_items.aggregate(Sum('quantity'))['quantity__sum'] or 0
        
        # Get top selling products
        top_products = order_items.values('product').annotate(
            sold=Sum('quantity'),
            revenue=Sum(F('price') * F('quantity'))
        ).order_by('-sold')[:10]
        
        # Enrich with product data
        top_products_enriched = []
        for item in top_products:
            try:
                product = Product.objects.get(id=item['product'])
                top_products_enriched.append({
                    'id': product.id,
                    'name': product.name,
                    'sold': item['sold'],
                    'revenue': float(item['revenue'])
                })
            except Product.DoesNotExist:
                continue
        
        return {
            'total_products_sold': total_products_sold,
            'top_selling_products': top_products_enriched
        }
    
    def _get_customer_data(self, start_date, end_date, vendor_filter):
        """Get customer summary data."""
        # Get orders in date range
        orders = Order.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date,
            status__in=['completed', 'delivered']
        )
        
        # Apply vendor filter if needed
        if vendor_filter and 'vendor' in vendor_filter:
            orders = orders.filter(items__product__vendor=vendor_filter['vendor'])
        
        # Count unique customers
        unique_customers = orders.values('user').distinct().count()
        
        # Get top customers
        top_customers = orders.values('user').annotate(
            orders=Count('id'),
            spent=Sum('total_amount')
        ).order_by('-spent')[:10]
        
        # Enrich with user data
        top_customers_enriched = []
        for item in top_customers:
            try:
                user = User.objects.get(id=item['user'])
                top_customers_enriched.append({
                    'id': user.id,
                    'name': user.get_full_name() or user.email,
                    'email': user.email,
                    'orders': item['orders'],
                    'spent': float(item['spent'])
                })
            except User.DoesNotExist:
                continue
        
        return {
            'unique_customers': unique_customers,
            'top_customers': top_customers_enriched
        }
