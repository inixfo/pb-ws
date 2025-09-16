from django.shortcuts import render
from rest_framework import viewsets, generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Avg, Count, Q, ProtectedError, Case, When, Value, IntegerField, F
from django.shortcuts import get_object_or_404
from django.utils.text import slugify
import pandas as pd
import io
from django.http import Http404
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from django.http import HttpResponse
from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from fuzzywuzzy import process
from urllib.parse import quote

from .models import Category, Brand, ProductField, Product, ProductImage, SKU, ProductVariation
from .serializers import (
    CategorySerializer, BrandSerializer, ProductFieldSerializer,
    ProductListSerializer, ProductDetailSerializer, ProductCreateUpdateSerializer,
    ProductImageSerializer, ProductVariationSerializer
)
from users.permissions import IsVendorOwnerOrAdmin, IsUserOwnerOrAdmin, IsApprovedVendorOrAdmin
from reviews.models import Review
from reviews.serializers import ReviewSerializer
from .filters import ProductFilter
from .pagination import StandardResultsSetPagination


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and editing categories."""
    
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']
    
    def get_permissions(self):
        """Return appropriate permissions based on action."""
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return super().get_permissions()
    
    def list(self, request, *args, **kwargs):
        """Override list to include product counts if requested."""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Check if we should include product counts
        include_counts = request.query_params.get('with_product_count', '').lower() == 'true'
        
        if include_counts:
            # Annotate with product counts
            queryset = queryset.annotate(
                product_count=models.Count('products', filter=models.Q(products__is_available=True, products__is_approved=True))
            )
            
            # Get all categories
            serializer = self.get_serializer(queryset, many=True)
            result_data = serializer.data
            
            # Add count to the serialized data
            for item in result_data:
                category = queryset.get(id=item['id'])
                item['count'] = category.product_count
                
                # Include products from subcategories
                subcategories = Category.objects.filter(parent_id=category.id)
                if subcategories.exists():
                    subcategory_count = Product.objects.filter(
                        category__in=subcategories,
                        is_available=True,
                        is_approved=True
                    ).count()
                    item['count'] += subcategory_count
            
            return Response({
                'results': result_data
            })
        
        return super().list(request, *args, **kwargs)
    
    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to include product counts if requested."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        
        # Check if we should include product counts
        include_counts = request.query_params.get('with_product_count', '').lower() == 'true'
        
        if include_counts:
            # Count products in this category
            category_count = Product.objects.filter(
                category=instance,
                is_available=True,
                is_approved=True
            ).count()
            
            # Count products in subcategories
            subcategories = Category.objects.filter(parent=instance)
            subcategory_count = 0
            if subcategories.exists():
                subcategory_count = Product.objects.filter(
                    category__in=subcategories,
                    is_available=True,
                    is_approved=True
                ).count()
            
            data['count'] = category_count + subcategory_count
        
        return Response(data)


class BrandViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and editing brands."""
    
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']
    
    def get_permissions(self):
        """Return appropriate permissions based on action."""
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return super().get_permissions()
    
    def get_queryset(self):
        """Filter brands and prefetch related objects as needed."""
        queryset = super().get_queryset()
        
        # Check if we should include categories
        if self.request.query_params.get('with_categories') == 'true':
            queryset = queryset.prefetch_related('categories')
            
        # Filter by category if specified
        category_slug = self.request.query_params.get('category')
        if category_slug:
            queryset = queryset.filter(categories__slug=category_slug)
            
        return queryset
        
    def list(self, request, *args, **kwargs):
        """Override list to include counts of products per brand."""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Calculate product counts for each brand if requested
        include_counts = request.query_params.get('with_counts', 'false').lower() == 'true'
        if include_counts:
            from django.db.models import Count
            queryset = queryset.annotate(count=Count('products'))
            
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ProductFieldViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and editing product fields."""
    
    queryset = ProductField.objects.all()
    serializer_class = ProductFieldSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        """Filter product fields by category if provided."""
        queryset = super().get_queryset()
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset
    
    def list(self, request, *args, **kwargs):
        """Override list method to disable pagination when filtering by category."""
        category_id = request.query_params.get('category')
        if category_id:
            # Disable pagination when filtering by category
            self.pagination_class = None
        return super().list(request, *args, **kwargs)


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and editing products."""
    
    queryset = Product.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'specifications']
    ordering_fields = ['created_at', 'price', 'name']
    ordering = ['-created_at']
    pagination_class = StandardResultsSetPagination
    permission_classes = [permissions.AllowAny]  # Allow anonymous access by default

    def get_serializer_class(self):
        """Get the appropriate serializer class based on the action."""
        if self.action == 'retrieve':
            return ProductDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProductCreateUpdateSerializer
        elif self.action in ['list', 'trending', 'special_offers', 'best_sellers', 'todays_deal', 'new_arrivals']:
            return ProductListSerializer
        return ProductSerializer
    
    def get_queryset(self):
        """Return appropriate queryset."""
        queryset = Product.objects.all()
        
        # Always prefetch related fields for better performance
        queryset = queryset.prefetch_related(
            'images', 
            'emi_plans',
            'variations',  # Explicitly prefetch variations
            'skus'
        ).select_related('category', 'brand', 'vendor')
        
        # Annotate with review statistics
        queryset = queryset.annotate(
            avg_review_rating=Avg('product_reviews__rating'),
            review_count=Count('product_reviews', filter=Q(product_reviews__status='approved'))
        )
        
        # Filter by category_slug (special case handling)
        category_slug = self.request.query_params.get('category_slug')
        if category_slug:
            try:
                print(f"Filtering by category_slug in get_queryset: {category_slug}")
                
                # Find the category with this slug
                category = Category.objects.filter(slug=category_slug).first()
                
                if category:
                    # Include subcategories
                    category_ids = [category.id]
                    subcategories = Category.objects.filter(parent=category)
                    category_ids.extend(subcategories.values_list('id', flat=True))
                    
                    print(f"Category IDs for filtering: {category_ids}")
                    queryset = queryset.filter(category_id__in=category_ids)
                    print(f"After category filtering, queryset has {queryset.count()} products")
                else:
                    # Try parent/child relationships
                    found = False
                    for parent_category in Category.objects.filter(parent__isnull=True):
                        child_category = Category.objects.filter(parent=parent_category, slug=category_slug).first()
                        if child_category:
                            found = True
                            queryset = queryset.filter(category=child_category)
                            print(f"Found child category {child_category.name}, filtered to {queryset.count()} products")
                            break
                    
                    # If category still not found, try partial slug match
                    if not found:
                        print(f"Category not found by exact slug, trying partial match")
                        # Try a more flexible approach (partial match)
                        similar_categories = Category.objects.filter(slug__contains=category_slug)
                        if similar_categories.exists():
                            category_ids = list(similar_categories.values_list('id', flat=True))
                            queryset = queryset.filter(category_id__in=category_ids)
                            print(f"Found {similar_categories.count()} similar categories, filtered to {queryset.count()} products")
                
            except Exception as e:
                print(f"Error filtering by category_slug: {str(e)}")
        
        # Filter out unapproved products for non-admin users
        user = self.request.user
        if not user.is_authenticated or not user.is_staff:
            queryset = queryset.filter(is_approved=True, is_available=True)
        
        # If this is a vendor, only show their products
        if user.is_authenticated and hasattr(user, 'role') and user.role == 'vendor' and not user.is_staff:
            queryset = queryset.filter(vendor=user)
        
        return queryset
    
    def get_object(self):
        """
        Returns the object the view is displaying.
        Override to support lookup by ID or slug.
        """
        queryset = self.filter_queryset(self.get_queryset())
        
        # Get the lookup value
        lookup = self.kwargs.get(self.lookup_field)
        
        # Check if lookup has 'id-' prefix, which indicates an explicit ID lookup
        if lookup and lookup.startswith('id-'):
            try:
                # Extract the ID after the 'id-' prefix
                id_value = lookup[3:]  # Skip the 'id-' part
                # Ensure the ID is converted to an integer
                obj = queryset.get(id=int(id_value))
                return obj
            except (Product.DoesNotExist, ValueError):
                raise Http404('Product not found')
        
        try:
            # First try to get by numeric ID
            if lookup.isdigit():
                obj = queryset.get(id=lookup)
            else:
                # Then try to get by slug
                obj = queryset.get(slug=lookup)
            return obj
        except (Product.DoesNotExist, ValueError):
            raise Http404('Product not found')
    
    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a product instance with additional data including variations.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        # Get the serialized data
        data = serializer.data
        
        # Add variations data explicitly
        variations = ProductVariation.objects.filter(product=instance, is_active=True)
        variations_serializer = ProductVariationSerializer(variations, many=True)
        data['variations'] = variations_serializer.data
        data['has_variations'] = bool(variations.exists())
        
        # Add min and max prices if variations exist
        if variations.exists():
            data['min_price'] = variations.order_by('price').first().price
            data['max_price'] = variations.order_by('-price').first().price
        
        # Add EMI plans data if EMI is available for this product
        if instance.emi_available:
            from emi.models import EMIPlan
            from emi.serializers import EMIPlanSerializer
            
            # Get EMI plans for this product
            emi_plans = instance.emi_plans.filter(is_active=True)
            if not emi_plans.exists():
                # If no specific plans are set, get all active EMI plans
                emi_plans = EMIPlan.objects.filter(is_active=True)
                
                # Filter plans by price eligibility
                product_price = instance.price
                emi_plans = emi_plans.filter(min_price__lte=product_price)
                emi_plans = emi_plans.filter(
                    models.Q(max_price__isnull=True) | models.Q(max_price__gte=product_price)
                )
            
            # Serialize EMI plans
            emi_plans_serializer = EMIPlanSerializer(emi_plans, many=True)
            data['emi_plans'] = emi_plans_serializer.data
        
        return Response(data)
    
    def get_permissions(self):
        """Return appropriate permissions based on action."""
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'bulk_upload', 'template']:
            return [permissions.IsAuthenticated(), IsVendorOwnerOrAdmin()]
        # For all other actions (including list, retrieve, filter_options), allow anonymous access
        return [permissions.AllowAny()]
    
    def perform_create(self, serializer):
        """Set vendor to current user when creating a product."""
        # Generate slug if not provided
        if 'slug' not in serializer.validated_data:
            name = serializer.validated_data.get('name', '')
            serializer.validated_data['slug'] = slugify(name)
        
        serializer.save(vendor=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def review(self, request, pk=None):
        """Add a review to a product."""
        product = self.get_object()
        
        # Check if user has already reviewed this product
        existing_review = Review.objects.filter(product=product, user=request.user).first()
        if existing_review:
            return Response(
                {'error': 'You have already reviewed this product'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(product=product, user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def fields(self, request, pk=None):
        """Get the fields for a product's category."""
        product = self.get_object()
        fields = ProductField.objects.filter(category=product.category)
        serializer = ProductFieldSerializer(fields, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def bulk_upload(self, request):
        """Bulk upload products via CSV or Excel file."""
        try:
            # Check if file is provided
            if 'file' not in request.FILES:
                return Response(
                    {'error': 'No file provided. Please upload a CSV or Excel file.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            file = request.FILES['file']
            category_id = request.data.get('category_id')
            brand_id = request.data.get('brand_id')
            
            # Check if category and brand are provided
            if not category_id or not brand_id:
                return Response(
                    {'error': 'Category ID and Brand ID are required for bulk upload.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate file extension
            filename = file.name.lower()
            if not (filename.endswith('.csv') or filename.endswith('.xlsx') or filename.endswith('.xls')):
                return Response(
                    {'error': 'Invalid file format. Please upload a CSV or Excel file.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Read file data
            if filename.endswith('.csv'):
                df = pd.read_csv(file)
            else:  # Excel file
                df = pd.read_excel(file)
            
            # Validate required columns
            required_columns = ['name', 'description', 'base_price', 'stock_quantity']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                return Response(
                    {'error': f'Missing required columns: {", ".join(missing_columns)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify category and brand exist
            category = get_object_or_404(Category, id=category_id)
            brand = get_object_or_404(Brand, id=brand_id)
            
            # Process the data and create products
            created_count = 0
            errors = []
            
            for index, row in df.iterrows():
                try:
                    # Prepare product data
                    product_data = {
                        'name': row['name'],
                        'description': row['description'],
                        'base_price': float(row['base_price']),
                        'stock_quantity': int(row['stock_quantity']),
                        'category': category,
                        'brand': brand,
                        'vendor': request.user,
                        'is_available': True,
                        'is_approved': request.user.is_staff  # Auto-approve if admin
                    }
                    
                    # Handle optional fields
                    if 'sale_price' in df.columns and not pd.isna(row['sale_price']):
                        product_data['sale_price'] = float(row['sale_price'])
                    
                    if 'emi_available' in df.columns and not pd.isna(row['emi_available']):
                        product_data['emi_available'] = row['emi_available'].lower() in ['true', 'yes', '1']
                    
                    for promo_field in ['is_trending', 'is_special_offer', 'is_best_seller', 'is_todays_deal']:
                        if promo_field in df.columns and not pd.isna(row[promo_field]):
                            product_data[promo_field] = row[promo_field].lower() in ['true', 'yes', '1']
                    
                    # Generate slug if not provided
                    slug = slugify(row['name'])
                    base_slug = slug
                    counter = 1
                    
                    # Ensure slug is unique
                    while Product.objects.filter(slug=slug).exists():
                        slug = f"{base_slug}-{counter}"
                        counter += 1
                    
                    product_data['slug'] = slug
                    
                    # Get specifications
                    specs = {}
                    for col in df.columns:
                        if col.startswith('spec_') and not pd.isna(row[col]):
                            spec_key = col[5:]  # Remove 'spec_' prefix
                            specs[spec_key] = row[col]
                    
                    if specs:
                        product_data['specifications'] = specs
                    
                    # Create the product
                    product = Product.objects.create(**product_data)
                    created_count += 1
                    
                except Exception as e:
                    errors.append(f"Row {index + 2}: {str(e)}")
            
            # Return response with results
            return Response({
                'message': f'Bulk upload completed. {created_count} products created.',
                'created_count': created_count,
                'errors': errors
            }, status=status.HTTP_201_CREATED if created_count > 0 else status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {'error': f'An error occurred during bulk upload: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def template(self, request):
        """Download a template CSV file for bulk upload."""
        # Create template DataFrame
        template_data = {
            'name': ['Sample Product 1', 'Sample Product 2'],
            'description': ['Description for Sample Product 1', 'Description for Sample Product 2'],
            'base_price': [999.99, 1299.99],
            'sale_price': [899.99, 1199.99],
            'stock_quantity': [100, 50],
            'emi_available': ['Yes', 'No'],
            'is_trending': ['No', 'Yes'],
            'is_special_offer': ['Yes', 'No'],
            'is_best_seller': ['No', 'Yes'],
            'is_todays_deal': ['Yes', 'No'],
            'spec_color': ['Black', 'White'],
            'spec_storage': ['128GB', '256GB'],
            'spec_ram': ['6GB', '8GB'],
            'spec_processor': ['Snapdragon 888', 'MediaTek Dimensity 1200']
        }
        
        df = pd.DataFrame(template_data)
        
        # Convert DataFrame to CSV
        csv_data = df.to_csv(index=False)
        
        # Create HttpResponse with CSV content
        response = HttpResponse(csv_data, content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="product_upload_template.csv"'
        
        return response
    
    @action(detail=False, methods=['get'])
    def trending(self, request):
        """Get trending products."""
        try:
            # Get base queryset - pass it through get_queryset to apply default filters
            base_queryset = self.get_queryset()
            
            # Ensure we only get trending products that are approved and available
            queryset = base_queryset.filter(
                is_trending=True,
                is_approved=True,
                is_available=True
            )
            
            print(f"Found {queryset.count()} trending products.")
            
            # Apply pagination
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                response = self.get_paginated_response(serializer.data)
                # Add cache control headers
                response["Cache-Control"] = "no-cache, no-store, must-revalidate"
                response["Pragma"] = "no-cache"
                response["Expires"] = "0"
                return response
            
            serializer = self.get_serializer(queryset, many=True)
            response = Response(serializer.data)
            # Add cache control headers
            response["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response["Pragma"] = "no-cache"
            response["Expires"] = "0"
            return response
        except Exception as e:
            import traceback
            print(f"Error in trending products: {str(e)}")
            traceback.print_exc()
            # Return empty array instead of 500 error
            return Response({"results": [], "count": 0})
    
    @action(detail=False, methods=['get'])
    def special_offers(self, request):
        """Get special offer products."""
        try:
            # Get base queryset - pass it through get_queryset to apply default filters
            base_queryset = self.get_queryset()
            
            # Ensure we only get special offer products that are approved and available
            queryset = base_queryset.filter(
                is_special_offer=True,
                is_approved=True,
                is_available=True
            )
            
            print(f"Found {queryset.count()} special offer products.")
            
            # Debug: print all special offer product IDs and names
            for product in queryset:
                print(f"Special offer product: ID={product.id}, Name={product.name}, "
                      f"Approved={product.is_approved}, Available={product.is_available}")
            
            # Apply pagination
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                response = self.get_paginated_response(serializer.data)
                # Add cache control headers
                response["Cache-Control"] = "no-cache, no-store, must-revalidate"
                response["Pragma"] = "no-cache"
                response["Expires"] = "0"
                return response
            
            serializer = self.get_serializer(queryset, many=True)
            response = Response(serializer.data)
            # Add cache control headers
            response["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response["Pragma"] = "no-cache"
            response["Expires"] = "0"
            return response
        except Exception as e:
            import traceback
            print(f"Error in special offers: {str(e)}")
            traceback.print_exc()
            # Return empty array instead of 500 error
            return Response({"results": [], "count": 0})
    
    @action(detail=False, methods=['get'])
    def best_sellers(self, request):
        """Get best seller products."""
        try:
            # Get base queryset - pass it through get_queryset to apply default filters
            base_queryset = self.get_queryset()
            
            # Ensure we only get best seller products that are approved and available
            queryset = base_queryset.filter(
                is_best_seller=True,
                is_approved=True,
                is_available=True
            )
            
            print(f"Found {queryset.count()} best seller products.")
            
            # Apply pagination
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                response = self.get_paginated_response(serializer.data)
                # Add cache control headers
                response["Cache-Control"] = "no-cache, no-store, must-revalidate"
                response["Pragma"] = "no-cache"
                response["Expires"] = "0"
                return response
            
            serializer = self.get_serializer(queryset, many=True)
            response = Response(serializer.data)
            # Add cache control headers
            response["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response["Pragma"] = "no-cache"
            response["Expires"] = "0"
            return response
        except Exception as e:
            import traceback
            print(f"Error in best sellers: {str(e)}")
            traceback.print_exc()
            # Return empty array instead of 500 error
            return Response({"results": [], "count": 0})
    
    @action(detail=False, methods=['get'])
    def todays_deal(self, request):
        """Get today's deal products."""
        try:
            # Get base queryset - pass it through get_queryset to apply default filters
            base_queryset = self.get_queryset()
            
            # Ensure we only get today's deal products that are approved and available
            queryset = base_queryset.filter(
                is_todays_deal=True,
                is_approved=True,
                is_available=True
            )
            
            print(f"Found {queryset.count()} today's deal products.")
            
            # Apply pagination
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                response = self.get_paginated_response(serializer.data)
                # Add cache control headers
                response["Cache-Control"] = "no-cache, no-store, must-revalidate"
                response["Pragma"] = "no-cache"
                response["Expires"] = "0"
                return response
            
            serializer = self.get_serializer(queryset, many=True)
            response = Response(serializer.data)
            # Add cache control headers
            response["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response["Pragma"] = "no-cache"
            response["Expires"] = "0"
            return response
        except Exception as e:
            import traceback
            print(f"Error in today's deals: {str(e)}")
            traceback.print_exc()
            # Return empty array instead of 500 error
            return Response({"results": [], "count": 0})
    
    @action(detail=False, methods=['get'])
    def new_arrivals(self, request):
        """Get new arrival products."""
        try:
            queryset = self.get_queryset().order_by('-created_at')[:10]
            serializer = self.get_serializer(queryset, many=True)
            response = Response(serializer.data)
            # Add cache control headers
            response["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response["Pragma"] = "no-cache"
            response["Expires"] = "0"
            return response
        except Exception as e:
            import traceback
            print(f"Error in new arrivals: {str(e)}")
            traceback.print_exc()
            # Return empty array instead of 500 error
            return Response({"results": [], "count": 0})
    
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def images(self, request, pk=None):
        """Upload images for a product."""
        product = self.get_object()
        
        # Check if the user is the vendor or admin
        if not (request.user.is_staff or request.user == product.vendor):
            return Response({'error': 'You do not have permission to upload images for this product'}, status=status.HTTP_403_FORBIDDEN)
        
        # Check if image file is provided
        if 'image' not in request.FILES:
            return Response({'error': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get is_primary flag
        is_primary = request.data.get('is_primary', 'false').lower() == 'true'
        
        # If setting as primary, unset any existing primary images
        if is_primary:
            ProductImage.objects.filter(product=product, is_primary=True).update(is_primary=False)
        
        # Create the product image
        image = ProductImage.objects.create(
            product=product,
            image=request.FILES['image'],
            alt_text=request.data.get('alt_text', ''),
            is_primary=is_primary,
            display_order=request.data.get('display_order', 0)
        )
        
        serializer = ProductImageSerializer(image)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def emi_plans(self, request, pk=None):
        """Get available EMI plans for a product."""
        from emi.models import EMIPlan
        from emi.serializers import EMIPlanSerializer, EMICalculationSerializer
        
        product = self.get_object()
        
        # Check if EMI is available for this product
        if not product.emi_available:
            return Response(
                {'error': 'EMI is not available for this product'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get EMI plans for this product
        emi_plans = product.emi_plans.filter(is_active=True)
        if not emi_plans.exists():
            # If no specific plans are set, get all active EMI plans
            emi_plans = EMIPlan.objects.filter(is_active=True)
            
            # Filter plans by price eligibility
            product_price = product.price
            emi_plans = emi_plans.filter(min_price__lte=product_price)
            emi_plans = emi_plans.filter(
                models.Q(max_price__isnull=True) | models.Q(max_price__gte=product_price)
            )
        
        # Serialize EMI plans
        serializer = EMIPlanSerializer(emi_plans, many=True)
        
        # Calculate example EMI for each plan
        result = []
        for plan_data in serializer.data:
            plan = EMIPlan.objects.get(id=plan_data['id'])
            
            # Calculate EMI for 6, 12, and 24 months (or just the plan's duration if fixed)
            tenures = [plan.duration_months]
            if not tenures[0]:
                tenures = [6, 12, 24]
            
            emi_calculations = []
            for tenure in tenures:
                try:
                    calc = plan.calculate_monthly_payment(product.price, tenure)
                    emi_calculations.append({
                        'tenure_months': tenure,
                        'monthly_payment': calc['monthly_payment'],
                        'down_payment': calc['down_payment'],
                        'processing_fee': calc['processing_fee'],
                        'total_payment': calc['total_payment'],
                        'total_interest': calc['total_interest']
                    })
                except Exception as e:
                    # Skip invalid calculations
                    continue
            
            result.append({
                **plan_data,
                'calculations': emi_calculations
            })
        
        return Response(result)

    @action(detail=False, methods=['get'])
    def filter_options(self, request):
        """
        Return available filter options based on category
        """
        try:
            print(f"filter_options called with params: {request.query_params}")
            
            # Get category if specified
            category_id = request.query_params.get('category')
            category_slug = request.query_params.get('category_slug')
            
            category = None
            if category_slug:
                category = Category.objects.filter(slug=category_slug).first()
                if not category:
                    # Try parent categories (to handle nested categories)
                    for parent_category in Category.objects.filter(parent__isnull=True):
                        if Category.objects.filter(parent=parent_category, slug=category_slug).exists():
                            category = parent_category
                            break
            elif category_id:
                category = Category.objects.filter(id=category_id).first()
            
            print(f"Found category: {category}")
            
            # Initialize response
            response_data = {
                'colors': [],
                'brands': [],
                'price_range': {'min': 0, 'max': 10000},
                'custom_filters': {}
            }
            
            # Get product queryset
            products = Product.objects.filter(is_available=True, is_approved=True)
            
            # Filter by category if specified
            if category:
                # Get all subcategories too
                category_ids = [category.id]
                subcategories = Category.objects.filter(parent=category)
                category_ids.extend(subcategories.values_list('id', flat=True))
                
                products = products.filter(category_id__in=category_ids)
            
            # Get price range
            if products.exists():
                # Get min and max price
                min_price = products.aggregate(models.Min('base_price'))['base_price__min'] or 0
                max_price = products.aggregate(models.Max('base_price'))['base_price__max'] or 10000
                
                # If max_price is too close to min_price, add a buffer
                if max_price - min_price < 100:
                    max_price = min_price + 1000  # Add buffer
                
                # Ensure max_price is not too low
                max_price = max(max_price, 1000)
                
                # Add 10% buffer to max_price for better UX
                max_price = float(max_price) * 1.1
                
                response_data['price_range'] = {
                    'min': int(min_price),
                    'max': int(max_price)
                }
                
                print(f"Price range: {response_data['price_range']}")
            else:
                print("No products found for price range calculation")
            
            # Get available brands with counts
            brands_data = []
            brand_counts = products.values('brand').annotate(
                count=models.Count('brand')
            ).order_by('-count')
            
            for brand_data in brand_counts:
                brand_id = brand_data['brand']
                if brand_id is None:
                    continue
                brand = Brand.objects.filter(id=brand_id).first()
                if brand:
                    brands_data.append({
                        'id': brand.id,
                        'name': brand.name,
                        'slug': brand.slug,
                        'count': brand_data['count'],
                        'logo': brand.logo.url if brand.logo else None
                    })
            
            response_data['brands'] = brands_data
            
            # Get available colors
            colors = set()
            for product in products:
                if product.specifications and 'color' in product.specifications:
                    product_color = product.specifications.get('color')
                    if product_color:
                        if isinstance(product_color, list):
                            colors.update(product_color)
                        else:
                            colors.add(product_color)
            
            response_data['colors'] = sorted(list(colors))
            
            # Get custom filter fields for this category
            custom_filters = {}
            if category:
                # Get fields marked as filters
                filter_fields = ProductField.objects.filter(
                    models.Q(category=category) | models.Q(category__isnull=True),
                    is_filter=True
                ).order_by('display_order')
                
                for field in filter_fields:
                    field_values = set()
                    field_key = field.name.lower()
                    
                    # Collect unique values for this field from all products
                    for product in products:
                        if product.specifications and field_key in product.specifications:
                            value = product.specifications.get(field_key)
                            if value:
                                if isinstance(value, list):
                                    field_values.update(value)
                                else:
                                    field_values.add(value)
                    
                    # Add to custom filters if values exist
                    if field_values:
                        custom_filters[field.name] = sorted(list(field_values))
                
            response_data['custom_filters'] = custom_filters
            
            print(f"Returning filter options: {response_data}")
            return Response(response_data)
            
        except Exception as e:
            import traceback
            print(f"Error in filter_options: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {
                    'error': str(e),
                    'colors': [],
                    'brands': [],
                    'price_range': {'min': 0, 'max': 10000},
                    'custom_filters': {}
                },
                status=status.HTTP_200_OK  # Return 200 with empty data instead of error
            )


class SKUViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and editing SKUs."""
    
    queryset = SKU.objects.all()
    serializer_class = None  # Will be set dynamically
    permission_classes = [permissions.IsAuthenticated, IsVendorOwnerOrAdmin]
    
    def get_queryset(self):
        """Filter SKUs based on query parameters and user role."""
        queryset = super().get_queryset()
        
        # Filter by product if specified
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        # Filter by active status if specified
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate a new SKU code."""
        from .models import generate_sku
        
        sku_code = generate_sku()
        
        # Ensure uniqueness
        while SKU.objects.filter(code=sku_code).exists():
            sku_code = generate_sku()
        
        return Response({'code': sku_code}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def advanced_search(request):
    """
    Advanced search endpoint with features like:
    - Exact match prioritization
    - Fuzzy matching for typo correction
    - Did you mean suggestions
    - Search analytics tracking
    - Keyword-based search across all fields
    """
    search_term = request.query_params.get('q', '')
    category = request.query_params.get('category', None)
    page = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('page_size', 12))
    
    if not search_term:
        return Response({
            'results': [],
            'count': 0,
            'suggestions': [],
            'did_you_mean': None
        })
    
    # Start with base queryset
    queryset = Product.objects.filter(is_approved=True)
    
    # Apply category filter if provided
    if category:
        try:
            category_obj = Category.objects.get(slug=category)
            queryset = queryset.filter(category=category_obj)
        except Category.DoesNotExist:
            # Try to match by name if slug doesn't work
            queryset = queryset.filter(category__name__icontains=category)
    
    # Enhanced keyword-based search
    # Split search term into keywords for more comprehensive search
    keywords = search_term.lower().split()
    
    # Build a comprehensive search query using OR logic
    search_query = Q()
    
    for keyword in keywords:
        keyword_query = (
            Q(name__icontains=keyword) |
            Q(description__icontains=keyword) |
            Q(specifications__icontains=keyword) |
            Q(category__name__icontains=keyword) |
            Q(brand__name__icontains=keyword) |
            Q(sku__icontains=keyword) |
            Q(model_number__icontains=keyword)
        )
        search_query |= keyword_query  # Use OR instead of AND
    
    # Also search for the complete search term
    complete_term_query = (
        Q(name__icontains=search_term) | 
        Q(description__icontains=search_term) |
        Q(specifications__icontains=search_term) |
        Q(category__name__icontains=search_term) |
        Q(brand__name__icontains=search_term) |
        Q(sku__icontains=search_term) |
        Q(model_number__icontains=search_term)
    )
    
    # Combine keyword search with complete term search
    final_search_query = search_query | complete_term_query
    
    # Apply the search filter
    queryset = queryset.filter(final_search_query)
    
    # Prioritize exact matches over partial matches
    exact_matches = queryset.filter(
        Q(name__iexact=search_term) | 
        Q(name__istartswith=search_term) |
        Q(sku__iexact=search_term) |
        Q(model_number__iexact=search_term)
    )
    
    # Get partial matches (excluding exact matches)
    partial_matches = queryset.exclude(id__in=exact_matches.values_list('id', flat=True))
    
    # Combine results, preserving the priority order
    results = list(exact_matches) + list(partial_matches)
    total_count = len(results)
    
    # Handle pagination
    start = (page - 1) * page_size
    end = start + page_size
    paginated_results = results[start:end]
    
    # Generate "Did you mean" suggestions if no exact matches were found
    did_you_mean = None
    if not exact_matches and search_term:
        # Get all product names for fuzzy matching
        all_product_names = list(Product.objects.values_list('name', flat=True))
        # Find the closest match using fuzzywuzzy
        matches = process.extract(search_term, all_product_names, limit=1)
        if matches and matches[0][1] > 70:  # Only suggest if similarity > 70%
            did_you_mean = matches[0][0]
    
    # Track search analytics
    try:
        from analytics.models import SearchQuery
        
        # Create search record with session or user info
        session_id = request.session.session_key
        if not session_id:
            request.session.create()
            session_id = request.session.session_key
            
        SearchQuery.objects.create(
            query=search_term,
            user=request.user if request.user.is_authenticated else None,
            session_id=session_id,
            results_count=total_count,
            category_filter=Category.objects.get(slug=category) if category else None,
        )
    except Exception as e:
        print(f"Error recording search analytics: {str(e)}")
    
    # Serialize the results
    from .serializers import ProductListSerializer
    serializer = ProductListSerializer(paginated_results, many=True)
    
    return Response({
        'results': serializer.data,
        'count': total_count,
        'did_you_mean': did_you_mean,
        'suggestions': [],  # Will be populated by autocomplete endpoint
    })

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def autocomplete(request):
    """
    Simplified endpoint for search autocomplete suggestions
    """
    try:
        query = request.query_params.get('q', '')
        limit = int(request.query_params.get('limit', 5))
        
        if not query or len(query) < 2:
            return Response({'suggestions': []})
        
        suggestions = []
        
        # Simple product search - focus on name only to avoid complex queries
        products = Product.objects.filter(
            Q(name__icontains=query) | Q(name__istartswith=query)
        ).filter(is_approved=True).select_related('brand', 'category')[:limit]
        
        # Add product suggestions with basic info
        for product in products:
            # Get price safely - use base_price only to avoid variations complexity
            try:
                product_price = float(product.base_price)
            except:
                product_price = 0.0
            
            # Get image safely
            primary_image = None
            try:
                first_image = product.images.first()
                if first_image and first_image.image:
                    primary_image = first_image.image.url
            except:
                pass
            
            suggestions.append({
                'type': 'product',
                'id': product.id,
                'name': product.name,
                'category': product.category.name if product.category else '',
                'brand': product.brand.name if product.brand else '',
                'price': product_price,
                'image': primary_image,
                'url': f'/products/{product.slug}' if product.slug else f'/products/{product.id}'
            })
        
        return Response({'suggestions': suggestions})
        
    except Exception as e:
        # Return empty suggestions on any error
        return Response({'suggestions': [], 'error': str(e)})
