from django.urls import path, include, re_path
# from rest_framework.routers import DefaultRouter # Commented out for isolation
from django.views.generic import TemplateView
# from rest_framework.permissions import AllowAny # Not needed for this isolated test

# Import directly from views.py
# from .views import ( # Commented out for isolation
# CategoryViewSet, BrandViewSet, ProductFieldViewSet,
# ProductViewSet, SKUViewSet
# )
from .bulk_upload import BulkUploadTemplateView #, BulkUploadProcessView # Commented out ProcessView for isolation

app_name = 'products'

# router = DefaultRouter() # Commented out for isolation
# router.register(r'categories', CategoryViewSet)
# router.register(r'brands', BrandViewSet)
# router.register(r'fields', ProductFieldViewSet)
# router.register(r'products', ProductViewSet, basename='product')
# router.register(r'skus', SKUViewSet, basename='sku')

# filter_options_view = ProductViewSet.as_view({'get': 'filter_options'}) # Commented out for isolation

urlpatterns = [
    # path('', include(router.urls)), # Commented out for isolation
    # re_path(r'^filter-options/?$', filter_options_view, name='filter-options'), # Commented out for isolation
    
    # Using path() first for simplicity. Django's path will match 'bulk-upload/template/'
    # if APPEND_SLASH is True (default) and the request comes as 'bulk-upload/template'
    # or directly if the request is 'bulk-upload/template/'.
    path('bulk-upload/template/', BulkUploadTemplateView.as_view(), name='bulk-upload-template'),
    
    # re_path(r'^bulk-upload/process/?$', BulkUploadProcessView.as_view(), name='bulk-upload-process'), # Commented out for isolation
    # re_path(r'^image-upload-test/?$', TemplateView.as_view( # Commented out for isolation
    # template_name='products/image_upload_test.html'
    # ), name='image-upload-test'),
] 