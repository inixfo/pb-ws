from django.shortcuts import render, get_object_or_404
from django.db.models import Count, Avg, Q
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action, api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import Review, ReviewVote, ReviewReply
from .serializers import (
    ReviewSerializer, ReviewVoteSerializer, ReviewReplySerializer,
    ReviewCreateSerializer, ReviewSummarySerializer
)
from .permissions import IsReviewOwnerOrReadOnly, IsReplyOwnerOrReadOnly
from products.models import Product


class ReviewPagination(PageNumberPagination):
    """Custom pagination for reviews."""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class ReviewViewSet(viewsets.ModelViewSet):
    """API endpoint for reviews."""
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsReviewOwnerOrReadOnly]
    pagination_class = ReviewPagination
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ['created_at', 'rating', 'helpful_votes']
    ordering = ['-created_at']
    search_fields = ['title', 'comment']
    
    def get_queryset(self):
        """Return reviews based on filters."""
        queryset = Review.objects.all()
        
        # Filter by product if specified
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        # Filter by status (default to approved for non-staff)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            if self.request.user.is_staff:
                queryset = queryset.filter(status=status_filter)
        elif not self.request.user.is_staff:
            queryset = queryset.filter(status='approved')
        
        # Filter by verified purchase
        verified = self.request.query_params.get('verified')
        if verified == 'true':
            queryset = queryset.filter(is_verified_purchase=True)
        
        # Filter by rating
        rating = self.request.query_params.get('rating')
        if rating:
            queryset = queryset.filter(rating=rating)
        
        # Filter by user (for user's review history)
        user_id = self.request.query_params.get('user')
        if user_id and (self.request.user.is_staff or str(self.request.user.id) == user_id):
            queryset = queryset.filter(user_id=user_id)
        
        return queryset
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return ReviewCreateSerializer
        elif self.action == 'list' and self.request.query_params.get('summary') == 'true':
            return ReviewSummarySerializer
        return ReviewSerializer
    
    def perform_create(self, serializer):
        """Set user when creating a review."""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        """Vote on a review (helpful/unhelpful)."""
        review = self.get_object()
        
        # Get vote type from request data
        vote_type = request.data.get('vote')
        if vote_type not in ['helpful', 'unhelpful']:
            return Response(
                {'error': 'Invalid vote type. Use "helpful" or "unhelpful".'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create or update vote
        try:
            vote, created = ReviewVote.objects.update_or_create(
                review=review,
                user=request.user,
                defaults={'vote': vote_type}
            )
            
            serializer = ReviewVoteSerializer(vote)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        """Add a reply to a review."""
        review = self.get_object()
        
        serializer = ReviewReplySerializer(
            data={'review': review.id, 'comment': request.data.get('comment')},
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get review summary for a product."""
        product_id = request.query_params.get('product')
        if not product_id:
            return Response(
                {'error': 'Product ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get product
        product = get_object_or_404(Product, id=product_id)
        
        # Get approved reviews for this product
        reviews = Review.objects.filter(product=product, status='approved')
        
        # Calculate statistics
        stats = {
            'total_reviews': reviews.count(),
            'average_rating': reviews.aggregate(avg=Avg('rating'))['avg'] or 0,
            'rating_distribution': {
                '5': reviews.filter(rating=5).count(),
                '4': reviews.filter(rating=4).count(),
                '3': reviews.filter(rating=3).count(),
                '2': reviews.filter(rating=2).count(),
                '1': reviews.filter(rating=1).count(),
            },
            'verified_purchases': reviews.filter(is_verified_purchase=True).count(),
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def my_reviews(self, request):
        """Get the current user's reviews."""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        reviews = Review.objects.filter(user=request.user)
        page = self.paginate_queryset(reviews)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def moderate(self, request, pk=None):
        """Moderate a review (approve/reject)."""
        review = self.get_object()
        
        # Get moderation action
        action = request.data.get('action')
        if action not in ['approve', 'reject']:
            return Response(
                {'error': 'Invalid action. Use "approve" or "reject".'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update review status
        review.status = 'approved' if action == 'approve' else 'rejected'
        review.admin_note = request.data.get('note', '')
        review.admin_user = request.user
        review.save()
        
        serializer = self.get_serializer(review)
        return Response(serializer.data)
        
    @action(detail=False, methods=['get'])
    def can_review(self, request):
        """Check if the current user can review a product."""
        if not request.user.is_authenticated:
            return Response(
                {'can_review': False, 'reason': 'Authentication required'},
                status=status.HTTP_200_OK
            )
            
        product_id = request.query_params.get('product')
        if not product_id:
            return Response(
                {'error': 'Product ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Get product
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Check if user has already reviewed this product
        has_reviewed = Review.objects.filter(
            product=product, 
            user=request.user
        ).exists()
        
        if has_reviewed:
            return Response(
                {'can_review': False, 'reason': 'You have already reviewed this product'},
                status=status.HTTP_200_OK
            )
            
        # Check if user has purchased the product
        from orders.models import OrderItem
        has_purchased = OrderItem.objects.filter(
            order__user=request.user,
            product=product,
            order__status__in=['delivered', 'completed']
        ).exists()
        
        if not has_purchased:
            return Response(
                {'can_review': False, 'reason': 'You need to purchase this product before leaving a review'},
                status=status.HTTP_200_OK
            )
            
        return Response(
            {'can_review': True},
            status=status.HTTP_200_OK
        )


class ReviewReplyViewSet(viewsets.ModelViewSet):
    """API endpoint for review replies."""
    serializer_class = ReviewReplySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsReplyOwnerOrReadOnly]
    
    def get_queryset(self):
        """Return replies based on filters."""
        queryset = ReviewReply.objects.all()
        
        # Filter by review if specified
        review_id = self.request.query_params.get('review')
        if review_id:
            queryset = queryset.filter(review_id=review_id)
        
        # Filter by user
        user_id = self.request.query_params.get('user')
        if user_id and (self.request.user.is_staff or str(self.request.user.id) == user_id):
            queryset = queryset.filter(user_id=user_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set user when creating a reply."""
        # User type (admin/vendor) is handled in the serializer
        serializer.save(user=self.request.user)

# Add this standalone view function for checking if user can review
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
def check_can_review(request):
    """Check if the current user can review a product."""
    # Debug all request headers
    print("===== REQUEST HEADERS =====")
    for key, value in request.META.items():
        if key.startswith('HTTP_'):
            print(f"{key}: {value}")
    print("===========================")
    
    # Debug auth header specifically
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    print(f"Auth header: {auth_header}")
    
    # Try to extract token for manual verification if needed
    token = None
    if auth_header.startswith('Bearer '):
        token = auth_header[7:]
        print(f"Token extracted: {token[:10]}...")
    
    # Debug authentication status
    print(f"Is authenticated: {request.user.is_authenticated}")
    if request.user.is_authenticated:
        print(f"Authenticated user: {request.user.email}")
    else:
        print("User is not authenticated")
        # Try manual authentication with the token
        if token:
            from rest_framework_simplejwt.tokens import AccessToken
            try:
                # Manually validate token
                token_obj = AccessToken(token)
                user_id = token_obj['user_id']
                from django.contrib.auth import get_user_model
                User = get_user_model()
                user = User.objects.get(id=user_id)
                print(f"Manual token validation successful: {user.email}")
                # Set user for this request
                request.user = user
            except Exception as e:
                print(f"Manual token validation failed: {str(e)}")
    
    # After all authentication attempts, check if user is authenticated
    if not request.user.is_authenticated:
        return Response(
            {'can_review': False, 'reason': 'Authentication required', 'status': 'unauthenticated'},
            status=status.HTTP_200_OK
        )
    
    # Get product ID from query parameters
    product_id = request.query_params.get('product')
    if not product_id:
        return Response(
            {'error': 'Product ID is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get product
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response(
            {'error': 'Product not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if user has already reviewed this product
    has_reviewed = Review.objects.filter(
        product=product, 
        user=request.user
    ).exists()
    
    if has_reviewed:
        return Response(
            {'can_review': False, 'reason': 'You have already reviewed this product'},
            status=status.HTTP_200_OK
        )
    
    # Check if user has purchased the product
    from orders.models import OrderItem
    has_purchased = OrderItem.objects.filter(
        order__user=request.user,
        product=product,
        order__status__in=['delivered', 'completed']
    ).exists()
    
    if not has_purchased:
        return Response(
            {'can_review': False, 'reason': 'You need to purchase this product before leaving a review'},
            status=status.HTTP_200_OK
        )
    
    return Response(
        {'can_review': True},
        status=status.HTTP_200_OK
    )
