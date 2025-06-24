from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    UserRegistrationView, UserLoginView, UserDetailView,
    ProfileUpdateView, AddressListCreateView, AddressDetailView,
    PaymentMethodListCreateView, PaymentMethodDetailView,
    PasswordChangeView, UserLogoutView, DebugRegistrationView,
    GoogleLoginView, PhoneVerificationView, VerifyPhoneCodeView
)

app_name = 'users'

urlpatterns = [
    # Authentication
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('debug-register/', DebugRegistrationView.as_view(), name='debug_register'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('logout/', UserLogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('password/change/', PasswordChangeView.as_view(), name='password_change'),
    
    # Google Authentication
    path('google-login/', GoogleLoginView.as_view(), name='google_login'),
    path('verify-phone/', PhoneVerificationView.as_view(), name='verify_phone'),
    path('verify-code/', VerifyPhoneCodeView.as_view(), name='verify_code'),
    
    # User profile
    path('me/', UserDetailView.as_view(), name='user_detail'),
    path('profile/', ProfileUpdateView.as_view(), name='profile_update'),
    
    # Addresses
    path('addresses/', AddressListCreateView.as_view(), name='address_list'),
    path('addresses/<int:pk>/', AddressDetailView.as_view(), name='address_detail'),
    
    # Payment methods
    path('payment-methods/', PaymentMethodListCreateView.as_view(), name='payment_method_list'),
    path('payment-methods/<int:pk>/', PaymentMethodDetailView.as_view(), name='payment_method_detail'),
] 