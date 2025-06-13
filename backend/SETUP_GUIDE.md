# Setup Guide for Phone Bay E-commerce Platform

## Issues Fixed

This guide addresses the following critical issues:
1. ✅ Missing SSLCOMMERZ library in requirements.txt
2. ✅ Payment gateway configuration improvements
3. ✅ Order creation and serialization fixes
4. ✅ Frontend payment service integration
5. ✅ Complete checkout flow implementation

## Prerequisites

Before running the application, ensure you have:
- Python 3.8+
- Node.js 16+
- SQLite (included with Python)
- A valid SSLCOMMERZ account (for production)

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (SQLite is default, no configuration needed for development)
# For production, configure PostgreSQL:
# DATABASE_URL=postgres://user:pass@localhost/dbname

# SSLCOMMERZ Payment Gateway
SSLCOMMERZ_STORE_ID=testbox
SSLCOMMERZ_STORE_PASSWORD=qwerty
STORE_NAME=Phone Bay
SSLCOMMERZ_SANDBOX=True

# URLs
FRONTEND_BASE_URL=http://localhost:3000
BACKEND_BASE_URL=http://localhost:8000

# Email Configuration (optional)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

### 3. Database Setup

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### 4. Start Development Server

```bash
python manage.py runserver
```

## Frontend Setup

### 1. Install Dependencies

```bash
cd home
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

## SSLCOMMERZ Configuration

### For Testing (Sandbox)
- Store ID: `testbox`
- Store Password: `qwerty`
- Sandbox Mode: `True`

### For Production
1. Sign up at [SSLCOMMERZ](https://www.sslcommerz.com/)
2. Get your Store ID and Store Password
3. Update environment variables:
   ```env
   SSLCOMMERZ_STORE_ID=your_actual_store_id
   SSLCOMMERZ_STORE_PASSWORD=your_actual_store_password
   SSLCOMMERZ_SANDBOX=False
   ```

## Payment Flow

### 1. Order Creation Process
1. User adds items to cart
2. User proceeds to checkout
3. User fills shipping information
4. User selects payment method
5. Order is created in the database
6. Payment gateway is initiated (except for COD)

### 2. Payment Methods Supported
- Credit/Debit Card (via SSLCOMMERZ)
- Mobile Banking (via SSLCOMMERZ)
- Bank Transfer (via SSLCOMMERZ)
- Cash on Delivery (COD)

### 3. Payment Processing
- Non-COD orders redirect to SSLCOMMERZ
- Payment success/failure is handled via callbacks
- Order status is updated automatically

## API Endpoints

### Order Management
- `POST /api/orders/` - Create new order
- `GET /api/orders/` - Get user orders
- `GET /api/orders/my_orders/` - Get current user's orders

### Cart Management
- `GET /api/orders/cart/my_cart/` - Get user's cart
- `POST /api/orders/cart/add_item/` - Add item to cart
- `POST /api/orders/cart/update_item/` - Update cart item
- `POST /api/orders/cart/remove_item/` - Remove item from cart

### Payment Processing
- `POST /api/payments/initiate-sslcommerz/` - Initiate SSLCOMMERZ payment
- `GET /api/payments/` - Get payment history
- `GET /api/payments/transactions/` - Get transaction history

## Testing Payment Gateway

### Using Sandbox Environment

1. Use the following test cards in SSLCOMMERZ sandbox:

**Visa:**
- Card Number: 4111111111111111
- Expiry: Any future date
- CVV: Any 3 digits

**MasterCard:**
- Card Number: 5555555555554444
- Expiry: Any future date
- CVV: Any 3 digits

### Testing Mobile Banking
- Use any mobile number
- Use test PIN: 1234

## Common Issues and Solutions

### 1. SSLCOMMERZ Import Error
**Error:** `ModuleNotFoundError: No module named 'sslcommerz_lib'`
**Solution:** Install the SSLCOMMERZ library:
```bash
pip install SSLCommerz-python
```

### 2. CORS Issues
**Error:** CORS policy blocks frontend requests
**Solution:** Ensure `django-cors-headers` is installed and configured in settings.py

### 3. Order Creation Fails
**Error:** Missing required fields
**Solution:** Ensure all required fields are provided in the order creation request

### 4. Payment Gateway Not Working
**Error:** Payment initiation fails
**Solution:** 
- Check SSLCOMMERZ credentials
- Verify callback URLs are accessible
- Ensure sandbox mode is enabled for testing

## Production Deployment

### 1. Backend (Django)
- Set `DEBUG=False`
- Configure proper database (PostgreSQL recommended)
- Set up proper web server (Nginx + Gunicorn)
- Configure SSL certificates
- Set proper CORS settings

### 2. Frontend (React)
- Build for production: `npm run build`
- Deploy to CDN or static hosting
- Update API URLs to production backend

### 3. Payment Gateway
- Switch to production SSLCOMMERZ credentials
- Set `SSLCOMMERZ_SANDBOX=False`
- Verify all callback URLs are HTTPS

## Support

For issues related to:
- SSLCOMMERZ: Contact SSLCOMMERZ support
- Django/React: Check respective documentation
- Custom code: Review this setup guide and error logs

## Security Notes

1. Never commit sensitive credentials to version control
2. Use environment variables for all sensitive data
3. Enable HTTPS in production
4. Regularly update dependencies
5. Validate all user inputs
6. Use CSRF protection for forms

## Next Steps

1. Test the complete order flow in sandbox environment
2. Configure real payment gateway credentials for production
3. Set up monitoring and logging
4. Implement order tracking features
5. Add email notifications for order updates 