from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    DashboardViewSet, 
    ProductApprovalViewSet, 
    VendorManagementViewSet,
    OrderManagementViewSet,
    SystemSettingsViewSet,
    UserManagementViewSet,
    SiteSettingsView
)

app_name = 'adminpanel'

router = DefaultRouter()
router.register('dashboard', DashboardViewSet, basename='dashboard')
router.register('products', ProductApprovalViewSet, basename='product-approvals')
router.register('vendors', VendorManagementViewSet, basename='vendor-management')
router.register('orders', OrderManagementViewSet, basename='order-management')
router.register('settings', SystemSettingsViewSet, basename='system-settings')
router.register('users', UserManagementViewSet, basename='user-management')

urlpatterns = [
    path('', include(router.urls)),
    path('settings/', SiteSettingsView.as_view(), name='site-settings'),
] 