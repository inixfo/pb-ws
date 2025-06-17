from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CartViewSet, OrderViewSet, OrderItemViewSet, CartItemViewSet, get_status_options

app_name = 'orders'

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'order-items', OrderItemViewSet, basename='order-item')
router.register(r'carts', CartViewSet, basename='cart')
router.register(r'cart-items', CartItemViewSet, basename='cart-item')

urlpatterns = [
    path('', include(router.urls)),
    path('orders/status-options/', get_status_options, name='order-status-options'),
] 