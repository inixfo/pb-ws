"""
Django settings for backend project in production.
"""

from pathlib import Path
import os
from .settings import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = ['3.25.95.103', 'localhost', '127.0.0.1']

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'pbws',
        'USER': 'pbws',
        'PASSWORD': 'PbWs2025',
        'HOST': '3.25.95.103',
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
    'http://3.25.95.103',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]

# SSLCOMMERZ Payment Gateway Settings
STORE_ID = 'phonebayxyz0live'
STORE_PASSWORD = '67CE865CBBB7718758'
STORE_NAME = 'Phone Bay'
SSLCOMMERZ_SANDBOX = False

# Payment Gateway URLs
FRONTEND_BASE_URL = 'http://3.25.95.103'
BACKEND_BASE_URL = 'http://3.25.95.103/admin'

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