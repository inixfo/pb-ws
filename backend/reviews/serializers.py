from rest_framework import serializers
from django.db import transaction
from django.utils.text import Truncator
from .models import Review, ReviewVote, ReviewReply
from users.serializers import UserMinimalSerializer


class ReviewReplySerializer(serializers.ModelSerializer):
    """Serializer for review replies."""
    
    user = UserMinimalSerializer(read_only=True)
    user_type = serializers.SerializerMethodField()
    
    class Meta:
        model = ReviewReply
        fields = [
            'id', 'review', 'user', 'user_type', 'comment',
            'is_vendor_reply', 'is_admin_reply', 'created_at'
        ]
        read_only_fields = ['user', 'is_vendor_reply', 'is_admin_reply']
    
    def get_user_type(self, obj):
        """Get the user type (admin, vendor, customer)."""
        if obj.is_admin_reply:
            return 'admin'
        elif obj.is_vendor_reply:
            return 'vendor'
        else:
            return 'customer'
    
    def create(self, validated_data):
        """Create a new reply and set user and role flags."""
        user = self.context['request'].user
        
        # Set flags based on user role
        is_admin = user.is_staff
        is_vendor = hasattr(user, 'vendor_profile')
        
        reply = ReviewReply.objects.create(
            user=user,
            is_admin_reply=is_admin,
            is_vendor_reply=is_vendor and not is_admin,  # Admin takes precedence
            **validated_data
        )
        return reply


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for reviews."""
    
    user = UserMinimalSerializer(read_only=True)
    replies = ReviewReplySerializer(many=True, read_only=True)
    user_vote = serializers.SerializerMethodField()
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id', 'product', 'product_name', 'user', 'rating', 'title', 'comment',
            'status', 'is_verified_purchase', 'image1', 'image2', 'image3',
            'helpful_votes', 'unhelpful_votes', 'helpful_score',
            'created_at', 'updated_at', 'replies', 'user_vote'
        ]
        read_only_fields = [
            'user', 'status', 'is_verified_purchase', 
            'helpful_votes', 'unhelpful_votes', 'helpful_score'
        ]
    
    def get_user_vote(self, obj):
        """Get the current user's vote on this review."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                vote = ReviewVote.objects.get(review=obj, user=request.user)
                return vote.vote
            except ReviewVote.DoesNotExist:
                pass
        return None
    
    def validate(self, attrs):
        """Validate the review data."""
        # Check if the user has already reviewed this product
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if self.instance is None:  # Only for new reviews
                product = attrs.get('product')
                if Review.objects.filter(product=product, user=request.user).exists():
                    raise serializers.ValidationError(
                        "You have already reviewed this product. Please edit your existing review."
                    )
        
        return attrs
    
    def create(self, validated_data):
        """Create a new review."""
        user = self.context['request'].user
        
        # Check if the user has purchased the product
        product = validated_data.get('product')
        is_verified = False
        
        # Check order history to verify purchase
        if hasattr(user, 'orders'):
            from orders.models import OrderItem
            is_verified = OrderItem.objects.filter(
                order__user=user,
                product=product,
                order__status__in=['delivered', 'completed']
            ).exists()
        
        # Create the review
        review = Review.objects.create(
            user=user,
            is_verified_purchase=is_verified,
            **validated_data
        )
        
        return review


class ReviewVoteSerializer(serializers.ModelSerializer):
    """Serializer for review votes."""
    
    class Meta:
        model = ReviewVote
        fields = ['id', 'review', 'vote', 'created_at']
        read_only_fields = ['created_at']
    
    def create(self, validated_data):
        """Create or update a vote."""
        user = self.context['request'].user
        review = validated_data.get('review')
        vote = validated_data.get('vote')
        
        # Check if the user has already voted on this review
        try:
            # Update existing vote
            with transaction.atomic():
                existing_vote = ReviewVote.objects.get(review=review, user=user)
                existing_vote.vote = vote
                existing_vote.save()
                return existing_vote
        except ReviewVote.DoesNotExist:
            # Create new vote
            return ReviewVote.objects.create(user=user, **validated_data)


class ReviewCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating reviews with image upload."""
    
    class Meta:
        model = Review
        fields = [
            'product', 'rating', 'title', 'comment',
            'image1', 'image2', 'image3'
        ]


class ReviewSummarySerializer(serializers.ModelSerializer):
    """Simplified serializer for review summaries."""
    
    user_name = serializers.SerializerMethodField()
    comment_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = [
            'id', 'product', 'user_name', 'rating', 
            'title', 'comment_summary', 'created_at'
        ]
    
    def get_user_name(self, obj):
        """Get the user's name or anonymized identifier."""
        if obj.user.first_name:
            return f"{obj.user.first_name} {obj.user.last_name[0]}."
        return f"User {obj.user.id}"
    
    def get_comment_summary(self, obj):
        """Get a truncated version of the comment."""
        return Truncator(obj.comment).chars(100) 