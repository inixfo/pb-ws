"""
Local settings for development environment.
These settings override the ones in settings.py
"""

# SSLCOMMERZ Settings
STORE_ID = 'phone6507ca12ecb92'
STORE_PASSWORD = 'phone6507ca12ecb92@ssl'
STORE_NAME = 'Phone Bay'
SSLCOMMERZ_SANDBOX = True

# For Development/Sandbox
# SSLCOMMERZ_SANDBOX = True

# For Production
# SSLCOMMERZ_SANDBOX = False

# Success and Failure URLs
SSLCOMMERZ_SUCCESS_URL = 'payment/success/'
SSLCOMMERZ_FAIL_URL = 'payment/failed/'
SSLCOMMERZ_CANCEL_URL = 'payment/canceled/'
SSLCOMMERZ_IPN_URL = 'payment/ipn/' 