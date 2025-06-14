from django.urls import path, include
# from rest_framework.routers import DefaultRouter # Commented out
# from django.views.generic import TemplateView # Commented out
# from rest_framework.permissions import AllowAny # Commented out

# Import directly from views.py 
# from .views import ( # Commented out
# CategoryViewSet, BrandViewSet, ProductFieldViewSet, # Commented out
# ProductViewSet, SKUViewSet # Commented out
# ) # Commented out
from .bulk_upload import BulkUploadTemplateView #, BulkUploadProcessView # Keep only this import for now

app_name = 'products'

# router = DefaultRouter() # Commented out
# router.register('categories', CategoryViewSet) # Commented out
# router.register('brands', BrandViewSet) # Commented out
# router.register('fields', ProductFieldViewSet) # Commented out
# router.register('products', ProductViewSet, basename='product') # Commented out
# router.register('skus', SKUViewSet, basename='sku') # Commented out

# Create a filter options view without custom permissions
# filter_options_view = ProductViewSet.as_view({'get': 'filter_options'}) # Commented out

urlpatterns = [
    # path('', include(router.urls)), # Commented out
    # path('filter-options/', filter_options_view, name='filter-options'), # Commented out
    # path('products/filter-options/', filter_options_view, name='products-filter-options'), # Commented out
    path('bulk-upload/template/', BulkUploadTemplateView.as_view(), name='bulk-upload-template'), # This is the one we are testing
    # path('bulk-upload/process/', BulkUploadProcessView.as_view(), name='bulk-upload-process'), # Commented out
    # path('image-upload-test/', TemplateView.as_view( # Commented out
    # template_name='products/image_upload_test.html' # Commented out
    # ), name='image-upload-test'), # Commented out
] 