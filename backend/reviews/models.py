from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Avg
from products.models import Product
from django.conf import settings

User = get_user_model()


class Review(models.Model):
    """Model for product reviews."""
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,  # This ensures review is deleted when product is deleted
        related_name='product_reviews'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,  # Delete review if user is deleted
        related_name='reviews'
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    title = models.CharField(max_length=255)
    comment = models.TextField()
    pros = models.TextField(blank=True, null=True)
    cons = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    
    # Purchase verification
    is_verified_purchase = models.BooleanField(default=False)
    
    # Admin fields
    admin_note = models.TextField(blank=True, null=True)
    admin_user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='moderated_reviews'
    )
    
    # Media
    image1 = models.ImageField(upload_to='reviews/images/', blank=True, null=True)
    image2 = models.ImageField(upload_to='reviews/images/', blank=True, null=True)
    image3 = models.ImageField(upload_to='reviews/images/', blank=True, null=True)
    
    # Helpfulness tracking
    helpful_votes = models.PositiveIntegerField(default=0)
    unhelpful_votes = models.PositiveIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        # Ensure a user can only review a product once
        unique_together = ['product', 'user']
    
    def __str__(self):
        return f"Review for {self.product.name} by {self.user.email}"
    
    @property
    def helpful_score(self):
        """Calculate helpfulness score."""
        total_votes = self.helpful_votes + self.unhelpful_votes
        if total_votes == 0:
            return 0
        return (self.helpful_votes / total_votes) * 100
    
    def save(self, *args, **kwargs):
        """Override save to store previous status for signal handling."""
        if hasattr(self, 'id'):
            # Store the previous status for signal handling
            try:
                old_instance = Review.objects.get(id=self.id)
                self._previous_status = old_instance.status
            except Review.DoesNotExist:
                self._previous_status = None
        super().save(*args, **kwargs)
        # No need to update product rating since we use average_rating property


class ReviewVote(models.Model):
    """Model for tracking user votes on reviews."""
    
    VOTE_CHOICES = (
        ('helpful', 'Helpful'),
        ('unhelpful', 'Unhelpful'),
    )
    
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='votes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='review_votes')
    vote = models.CharField(max_length=10, choices=VOTE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        # Ensure a user can only vote once per review
        unique_together = ('review', 'user')
    
    def save(self, *args, **kwargs):
        """Override save to update review vote counts."""
        # Check if this is an update or new vote
        is_new = self.pk is None
        
        # If updating an existing vote, get the old vote
        old_vote = None
        if not is_new:
            old_vote = ReviewVote.objects.get(pk=self.pk).vote
        
        # Save the vote
        super().save(*args, **kwargs)
        
        # Update review vote counts
        review = self.review
        
        if is_new:
            # New vote
            if self.vote == 'helpful':
                review.helpful_votes += 1
            else:
                review.unhelpful_votes += 1
        elif old_vote != self.vote:
            # Changed vote
            if self.vote == 'helpful':
                review.helpful_votes += 1
                review.unhelpful_votes -= 1
            else:
                review.helpful_votes -= 1
                review.unhelpful_votes += 1
        
        review.save(update_fields=['helpful_votes', 'unhelpful_votes'])
    
    def delete(self, *args, **kwargs):
        """Override delete to update review vote counts."""
        review = self.review
        
        # Update vote counts
        if self.vote == 'helpful':
            review.helpful_votes = max(0, review.helpful_votes - 1)
        else:
            review.unhelpful_votes = max(0, review.unhelpful_votes - 1)
        
        # Delete the vote
        super().delete(*args, **kwargs)
        
        # Save the review
        review.save(update_fields=['helpful_votes', 'unhelpful_votes'])


class ReviewReply(models.Model):
    """Model for replies to reviews."""
    
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='replies')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='review_replies')
    comment = models.TextField()
    is_vendor_reply = models.BooleanField(default=False)
    is_admin_reply = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
        verbose_name_plural = 'Review replies'
    
    def __str__(self):
        return f"Reply to review {self.review.id} by {self.user.email}"
