import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

from .models import Product, Category, Brand

logger = logging.getLogger(__name__)


@shared_task
def update_product_availability():
    """Update product availability based on stock."""
    # Find products with zero stock but marked as available
    unavailable_products = Product.objects.filter(
        stock_quantity=0,
        is_available=True
    )
    
    count = unavailable_products.update(is_available=False)
    return f"Updated {count} products to unavailable"


@shared_task
def clean_inactive_products():
    """Flag inactive products that haven't been updated in a long time."""
    # Find products that haven't been updated in 6 months and have no sales
    cutoff_date = timezone.now() - timedelta(days=180)
    
    inactive_products = Product.objects.filter(
        updated_at__lt=cutoff_date,
        is_available=True
    )
    
    # Check for any sales (this requires an OrderItem model with a related_name of 'order_items')
    inactive_without_sales = []
    for product in inactive_products:
        if not hasattr(product, 'order_items') or product.order_items.count() == 0:
            inactive_without_sales.append(product.id)
    
    # Update inactive products
    if inactive_without_sales:
        Product.objects.filter(id__in=inactive_without_sales).update(is_available=False)
    
    return f"Marked {len(inactive_without_sales)} products as unavailable due to inactivity"


@shared_task
def check_empty_categories():
    """Check for empty categories and flag them in logs."""
    empty_categories = []
    
    for category in Category.objects.all():
        if not category.products.exists():
            empty_categories.append(category.name)
    
    if empty_categories:
        logger.info(f"Empty categories found: {', '.join(empty_categories)}")
    
    return f"Found {len(empty_categories)} empty categories"


@shared_task
def check_empty_brands():
    """Check for empty brands and flag them in logs."""
    empty_brands = []
    
    for brand in Brand.objects.all():
        if not brand.products.exists():
            empty_brands.append(brand.name)
    
    if empty_brands:
        logger.info(f"Empty brands found: {', '.join(empty_brands)}")
    
    return f"Found {len(empty_brands)} empty brands" 