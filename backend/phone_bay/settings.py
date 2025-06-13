# SMS Settings
TEST_SMS_NUMBER = '88018883444423'  # Replace with your test phone number

# SSL Wireless SMS API Configuration
SMS_API_URL = 'https://smsplus.sslwireless.com'
SMS_API_SID = 'PHONEBAYBRAND'  # Replace with your SSL Wireless SID
SMS_API_TOKEN = '4v32ycsy-q0f22usn-qk8aminl-g78imsro-hzhagexp'  # Replace with your SSL Wireless API token
SMS_BRAND_NAME = 'Phone Bay'

# SMS template defaults
DEFAULT_SMS_TEMPLATES = {
    'welcome': 'Welcome to {brand}! Your account has been created successfully. Shop the latest mobile phones and accessories.',
    'verification': 'Your {brand} verification code is {code}. Valid for {expiry} minutes.',
    'order_confirmation': 'Thank you for your order {name}! Your order #{order_id} has been received and is being processed. Total: {total} BDT.',
    'payment_success': 'Payment received for your order #{order_id}. Amount: {total} BDT. Thank you for shopping with {brand}!',
    'order_status': 'Your order #{order_id} status has been updated to: {status}. Track your order on our website.',
    'emi_reminder': 'Reminder: Your EMI payment of {amount} BDT for order #{order_id} is due on {due_date}. Please make your payment to avoid late fees.'
}