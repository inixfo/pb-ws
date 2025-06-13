from django.db import models

# Create your models here.

class ContactInfo(models.Model):
    """Store contact information for the company/website."""
    address = models.TextField(help_text="Physical address of the company")
    phone = models.CharField(max_length=20, help_text="Contact phone number")
    email = models.EmailField(help_text="Contact email address")
    support_hours = models.CharField(max_length=100, help_text="Support hours, e.g., 'Mon-Fri: 9AM-5PM'", blank=True, null=True)
    google_maps_embed = models.TextField(help_text="Google Maps embed code", blank=True, null=True)
    facebook_url = models.URLField(blank=True, null=True)
    twitter_url = models.URLField(blank=True, null=True)
    instagram_url = models.URLField(blank=True, null=True)
    linkedin_url = models.URLField(blank=True, null=True)
    
    # Only one instance of this model should exist
    is_active = models.BooleanField(default=True, help_text="Only one instance should be active")
    
    class Meta:
        verbose_name = "Contact Information"
        verbose_name_plural = "Contact Information"
    
    def __str__(self):
        return f"Contact Info: {self.email}"
    
    def save(self, *args, **kwargs):
        """Ensure only one instance is active."""
        if self.is_active:
            ContactInfo.objects.exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)


class ContactSubmission(models.Model):
    """Store submissions from the contact form."""
    STATUS_CHOICES = (
        ('new', 'New'),
        ('in_progress', 'In Progress'),
        ('responded', 'Responded'),
        ('resolved', 'Resolved'),
        ('spam', 'Spam'),
    )
    
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    admin_notes = models.TextField(blank=True, null=True)
    
    # Metadata
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Contact Submission"
        verbose_name_plural = "Contact Submissions"
    
    def __str__(self):
        return f"{self.name}: {self.subject} ({self.status})"


class Newsletter(models.Model):
    """Store newsletter subscriptions."""
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Newsletter Subscription"
        verbose_name_plural = "Newsletter Subscriptions"
    
    def __str__(self):
        return f"{self.email} ({'Active' if self.is_active else 'Inactive'})"
