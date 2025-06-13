from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PaymentViewSet,
    TransactionViewSet,
    initiate_sslcommerz_payment,
    initiate_installment_payment,
    payment_success,
    payment_failed,
    payment_canceled,
    payment_ipn
)

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'transactions', TransactionViewSet, basename='transaction')

urlpatterns = [
    path('', include(router.urls)),
    path('initiate-sslcommerz/', initiate_sslcommerz_payment, name='initiate_sslcommerz_payment'),
    path('initiate-installment/', initiate_installment_payment, name='initiate_installment_payment'),
    path('success/', payment_success, name='payment_success'),
    path('failed/', payment_failed, name='payment_failed'),
    path('canceled/', payment_canceled, name='payment_canceled'),
    path('ipn/', payment_ipn, name='payment_ipn'),
] 