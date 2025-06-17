from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Import only what's actually defined in views.py
from .views import CartViewSet, OrderViewSet

app_name = 'orders'

router = DefaultRouter()
router.register('cart', CartViewSet, basename='cart')
router.register('', OrderViewSet, basename='orders')

urlpatterns = [
    path('', include(router.urls)),
] 