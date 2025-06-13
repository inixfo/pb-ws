from django.urls import path
from .views import SendVerificationCodeView, VerifyPhoneNumberView, ResendVerificationCodeView

urlpatterns = [
    path('send-verification-code/', SendVerificationCodeView.as_view(), name='send_verification_code'),
    path('verify-phone/', VerifyPhoneNumberView.as_view(), name='verify_phone'),
    path('resend-verification-code/', ResendVerificationCodeView.as_view(), name='resend_verification_code'),
] 