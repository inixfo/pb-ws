"""
Django settings for backend project in production.
"""

from pathlib import Path
import os
from .settings import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = ['phonebay.xyz', 'www.phonebay.xyz', '172.232.107.167']

# Google OAuth Settings
SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = os.environ.get('GOOGLE_CLIENT_ID', '')
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')

# Authentication backends
AUTHENTICATION_BACKENDS = (
    'social_core.backends.google.GoogleOAuth2',
    'django.contrib.auth.backends.ModelBackend',
)

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'pbws',
        'USER': 'pbws',
        'PASSWORD': 'eORC,2OL621',
        'HOST': '172.232.107.167',
        'PORT': '5432',
    }
}

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# CORS settings
CORS_ALLOWED_ORIGINS = [
    'https://phonebay.xyz',
    'https://www.phonebay.xyz',
]

# SSLCOMMERZ Payment Gateway Settings
SSLCOMMERZ_STORE_ID = 'phonebayxyz0live'
SSLCOMMERZ_STORE_PASSWORD = '67CE865CBBB7718758'
SSLCOMMERZ_STORE_NAME = 'Phone Bay'
SSLCOMMERZ_IS_SANDBOX = False
SSLCOMMERZ_API_URL = 'https://securepay.sslcommerz.com/gwprocess/v4/api'

# Payment Gateway URLs
FRONTEND_BASE_URL = 'http://phonebay.xyz'
BACKEND_BASE_URL = 'http://phonebay.xyz/admin'

# SMS Settings
SMS_API_URL = 'https://smsplus.sslwireless.com'
SMS_API_SID = 'PHONEBAYBRAND'
SMS_API_TOKEN = '4v32ycsy-q0f22usn-qk8aminl-g78imsro-hzhagexp'
SMS_BRAND_NAME = 'PHONEBAYXYZBRAND'

# Celery Configuration
CELERY_BROKER_URL = 'redis://redis:6379/0'
CELERY_RESULT_BACKEND = 'redis://redis:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC' 
