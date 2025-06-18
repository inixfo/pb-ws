from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'analytics'

router = DefaultRouter()
router.register(r'page-views', views.PageViewViewSet)
router.register(r'product-views', views.ProductViewViewSet)
router.register(r'search-queries', views.SearchQueryViewSet)
router.register(r'cart-events', views.CartEventViewSet)
router.register(r'sales-metrics', views.SalesMetricViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('record-search-click/', views.record_search_click, name='record-search-click'),
] 