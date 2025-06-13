from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'page-views', views.PageViewViewSet)
router.register(r'product-views', views.ProductViewViewSet)
router.register(r'search-queries', views.SearchQueryViewSet)
router.register(r'cart-events', views.CartEventViewSet)
router.register(r'sales-metrics', views.SalesMetricViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', views.DashboardView.as_view(), name='analytics-dashboard'),
] 