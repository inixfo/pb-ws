from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'plans', views.EMIPlanViewSet)
router.register(r'applications', views.EMIApplicationViewSet)
router.register(r'records', views.EMIRecordViewSet)
router.register(r'installments', views.EMIInstallmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 