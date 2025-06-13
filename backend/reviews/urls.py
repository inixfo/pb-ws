from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'reviews', views.ReviewViewSet, basename='review')
router.register(r'replies', views.ReviewReplyViewSet, basename='review-reply')

urlpatterns = [
    path('', include(router.urls)),
    path('can-review/', views.check_can_review, name='can-review'),
] 