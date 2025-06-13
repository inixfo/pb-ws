from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'zones', views.ShippingZoneViewSet)
router.register(r'methods', views.ShippingMethodViewSet)
router.register(r'rates', views.ShippingRateViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 