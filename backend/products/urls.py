from django.urls import path, include
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
router.register('categories', CategoryViewSet)
router.register('brands', BrandViewSet)
router.register('fields', ProductFieldViewSet)
router.register('products', ProductViewSet, basename='product')
router.register('skus', SKUViewSet, basename='sku')

# Create a filter options view without custom permissions
filter_options_view = ProductViewSet.as_view({'get': 'filter_options'})

urlpatterns = [
    path('', include(router.urls)),
    path('filter-options/', filter_options_view, name='filter-options'),
    path('products/filter-options/', filter_options_view, name='products-filter-options'),
    path('bulk-upload/template/', BulkUploadTemplateView.as_view(), name='bulk-upload-template'),
    path('template/', BulkUploadTemplateView.as_view(), name='product-template'),
    path('bulk-upload/process/', BulkUploadProcessView.as_view(), name='bulk-upload-process'),
    path('bulk_upload/', BulkUploadProcessView.as_view(), name='product-bulk-upload'),
    path('image-upload-test/', TemplateView.as_view(
        template_name='products/image_upload_test.html'
    ), name='image-upload-test'),
] 