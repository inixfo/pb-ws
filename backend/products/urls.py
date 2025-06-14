from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from django.views.generic import TemplateView
from rest_framework.permissions import AllowAny

# Import directly from views.py
from .views import (
CategoryViewSet, BrandViewSet, ProductFieldViewSet,
ProductViewSet, SKUViewSet
)
from .bulk_upload import BulkUploadTemplateView, BulkUploadProcessView

app_name = 'products'

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'brands', BrandViewSet)
router.register(r'fields', ProductFieldViewSet)
router.register(r'products', ProductViewSet, basename='product')
router.register(r'skus', SKUViewSet, basename='sku')

# Create a filter options view without custom permissions
filter_options_view = ProductViewSet.as_view({'get': 'filter_options'})

urlpatterns = [
    path('', include(router.urls)),
    re_path(r'^filter-options/?$', filter_options_view, name='filter-options'),
    re_path(r'^bulk-upload/template/?$', BulkUploadTemplateView.as_view(), name='bulk-upload-template'),
    re_path(r'^bulk-upload/process/?$', BulkUploadProcessView.as_view(), name='bulk-upload-process'),
    re_path(r'^image-upload-test/?$', TemplateView.as_view(
    template_name='products/image_upload_test.html'
    ), name='image-upload-test'),
] 