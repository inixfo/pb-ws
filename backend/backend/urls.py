"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path, re_path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
import logging # Added for debugging
# from django.http import HttpResponse # No longer needed for lambda test

# Import TemplateGenView directly for testing
from products.bulk_upload import TemplateGenView # Changed import to TemplateGenView

logger = logging.getLogger(__name__) # Added for debugging

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    # path('api/products/', include('products.urls')), # Temporarily commented out
    # Direct path for testing:
    re_path(r'^api/products/bulk-upload/template/?$', TemplateGenView.as_view(), name='direct-bulk-upload-template'), # Changed to TemplateGenView
    # re_path(r'^api/products/bulk-upload/template/?$', lambda request: HttpResponse("Direct lambda test OK"), name='direct-bulk-upload-template-lambda'), # Lambda test commented out
    path('api/orders/', include('orders.urls')),
    path('api/vendors/', include('vendors.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/reviews/', include('reviews.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/emi/', include('emi.urls')),
    path('api/admin/', include('adminpanel.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/shipping/', include('shipping.urls')),
    path('api/wishlist/', include('wishlist.urls')),
    path('api/promotions/', include('promotions.urls')),
    path('api/contact/', include('contact.urls')),
    path('api/sms/', include('sms.urls')),
]

# Debugging: Print urlpatterns
# logger.info("Root urlpatterns:") # Using logger instead of print for production servers
# for i, pattern in enumerate(urlpatterns):
#     logger.info(f"{i}: {pattern}")
#     if hasattr(pattern, 'url_patterns'):
#         logger.info("  Included sub-patterns:")
#         for j, sub_pattern in enumerate(pattern.url_patterns):
#             logger.info(f"    {j}: {sub_pattern}")
#     elif hasattr(pattern, 'pattern'):
#         logger.info(f"  Pattern regex: {pattern.pattern}")

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Another debug print after static files, just in case
logger.info("Final urlpatterns (after static if DEBUG):")
for i, pattern in enumerate(urlpatterns):
    logger.info(f"FINAL {i}: {pattern}")
    if hasattr(pattern, 'url_patterns'): # For include()
        logger.info(f"  FINAL Included app: {pattern.app_name if pattern.app_name else pattern.namespace}")
        logger.info(f"  FINAL Included namespace: {pattern.namespace}")
        # To see sub-patterns, they need to be resolved, which is complex here.
        # This basic log shows if 'products.urls' is being included.
    elif hasattr(pattern, 'pattern'): # For path() or re_path()
        logger.info(f"  FINAL Pattern regex: {pattern.pattern}")
