from django.contrib import admin
from .models import Review, ReviewVote, ReviewReply


class ReviewReplyInline(admin.TabularInline):
    """Inline admin for review replies."""
    model = ReviewReply
    extra = 0
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    """Admin interface for reviews."""
    list_display = ['id', 'product', 'user', 'rating', 'title', 'status', 'is_verified_purchase', 'created_at']
    list_filter = ['status', 'rating', 'is_verified_purchase', 'created_at']
    search_fields = ['title', 'comment', 'user__email', 'product__name']
    readonly_fields = ['helpful_votes', 'unhelpful_votes', 'created_at', 'updated_at']
    raw_id_fields = ['product', 'user', 'admin_user']
    inlines = [ReviewReplyInline]
    actions = ['approve_reviews', 'reject_reviews']
    
    fieldsets = (
        ('Review Details', {
            'fields': ('product', 'user', 'rating', 'title', 'comment')
        }),
        ('Status', {
            'fields': ('status', 'is_verified_purchase', 'admin_note', 'admin_user')
        }),
        ('Media', {
            'fields': ('image1', 'image2', 'image3')
        }),
        ('Votes', {
            'fields': ('helpful_votes', 'unhelpful_votes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def approve_reviews(self, request, queryset):
        """Approve selected reviews."""
        queryset.update(status='approved')
        self.message_user(request, f"{queryset.count()} reviews were approved.")
    approve_reviews.short_description = "Approve selected reviews"
    
    def reject_reviews(self, request, queryset):
        """Reject selected reviews."""
        queryset.update(status='rejected')
        self.message_user(request, f"{queryset.count()} reviews were rejected.")
    reject_reviews.short_description = "Reject selected reviews"


@admin.register(ReviewReply)
class ReviewReplyAdmin(admin.ModelAdmin):
    """Admin interface for review replies."""
    list_display = ['id', 'review', 'user', 'is_vendor_reply', 'is_admin_reply', 'created_at']
    list_filter = ['is_vendor_reply', 'is_admin_reply', 'created_at']
    search_fields = ['comment', 'user__email', 'review__title']
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['review', 'user']
    
    fieldsets = (
        ('Reply Details', {
            'fields': ('review', 'user', 'comment')
        }),
        ('Type', {
            'fields': ('is_vendor_reply', 'is_admin_reply')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(ReviewVote)
class ReviewVoteAdmin(admin.ModelAdmin):
    """Admin interface for review votes."""
    list_display = ['id', 'review', 'user', 'vote', 'created_at']
    list_filter = ['vote', 'created_at']
    search_fields = ['user__email', 'review__title']
    readonly_fields = ['created_at']
    raw_id_fields = ['review', 'user']
