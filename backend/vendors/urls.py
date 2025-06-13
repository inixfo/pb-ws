from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    VendorProfileViewSet, StoreSettingsViewSet,
    VendorApprovalViewSet, VendorBankAccountViewSet
)

app_name = 'vendors'

router = DefaultRouter()
router.register('profiles', VendorProfileViewSet, basename='vendor-profiles')
router.register('stores', StoreSettingsViewSet, basename='store-settings')
router.register('approvals', VendorApprovalViewSet, basename='vendor-approvals')
router.register('bank-accounts', VendorBankAccountViewSet, basename='vendor-bank-accounts')

urlpatterns = [
    path('', include(router.urls)),
] 