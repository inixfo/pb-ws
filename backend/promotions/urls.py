from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PromoCodeViewSet, HeaderPromoBannerViewSet, HeroSlideViewSet,
    NewArrivalsBannerViewSet, SaleBannerViewSet,
    CatalogTopBannerViewSet, CatalogBottomBannerViewSet
)

router = DefaultRouter()
router.register(r'promo-codes', PromoCodeViewSet)
router.register(r'header-promos', HeaderPromoBannerViewSet)
router.register(r'hero-slides', HeroSlideViewSet)
router.register(r'new-arrivals-banner', NewArrivalsBannerViewSet)
router.register(r'sale-banner', SaleBannerViewSet)
router.register(r'catalog-top-banner', CatalogTopBannerViewSet)
router.register(r'catalog-bottom-banner', CatalogBottomBannerViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 