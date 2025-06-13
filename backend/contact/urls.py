from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContactInfoViewSet, ContactSubmissionViewSet, NewsletterViewSet

router = DefaultRouter()
router.register(r'info', ContactInfoViewSet)
router.register(r'submissions', ContactSubmissionViewSet)
router.register(r'newsletter', NewsletterViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 