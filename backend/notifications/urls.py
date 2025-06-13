from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'notifications', views.NotificationViewSet, basename='notification')
router.register(r'admin/templates', views.AdminNotificationTemplateViewSet, basename='admin-template')
router.register(r'admin/events', views.AdminNotificationEventViewSet, basename='admin-event')
router.register(r'admin/sms-providers', views.AdminSMSProviderViewSet, basename='admin-sms-provider')

urlpatterns = [
    path('', include(router.urls)),
] 