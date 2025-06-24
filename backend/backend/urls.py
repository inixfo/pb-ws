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
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/products/', include('products.urls')),
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
    
    # Social Auth URLs
    path('api/social-auth/', include('social_django.urls', namespace='social')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
