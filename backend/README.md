# Phone Bay Backend

This is the backend API for the Phone Bay e-commerce platform, built with Django and Django REST Framework.

## Features

- User authentication with JWT
- Role-based access control (Customer, Vendor, Admin)
- Product management with dynamic fields per category
- Shopping cart functionality
- Order management
- EMI (Equated Monthly Installment) system
- Vendor management
- Admin panel

## Setup Instructions

### Prerequisites

- Python 3.8+
- pip
- virtualenv (optional but recommended)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd phone-bay/web/backend
   ```

2. Create and activate a virtual environment (optional):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Apply migrations:
   ```
   python manage.py migrate
   ```

5. Create a superuser:
   ```
   python manage.py createsuperuser
   ```

6. Set up initial categories and product fields:
   ```
   python manage.py setup_categories
   ```

7. Run the development server:
   ```
   python manage.py runserver
   ```

The API will be available at http://localhost:8000/api/

## API Endpoints

### Authentication
- `POST /api/users/register/`: Register a new user
- `POST /api/users/login/`: Login and get JWT tokens
- `POST /api/users/token/refresh/`: Refresh JWT token

### Users
- `GET /api/users/me/`: Get current user details
- `PUT /api/users/me/`: Update current user details
- `GET /api/users/profile/`: Get user profile
- `PUT /api/users/profile/`: Update user profile

### Products
- `GET /api/products/categories/`: List all categories
- `GET /api/products/brands/`: List all brands
- `GET /api/products/products/`: List all products
- `GET /api/products/products/{id}/`: Get product details
- `POST /api/products/products/`: Create a new product (vendor only)
- `GET /api/products/fields/?category={id}`: Get fields for a category

### Orders
- `GET /api/orders/cart/my_cart/`: Get current user's cart
- `POST /api/orders/cart/add_item/`: Add item to cart
- `POST /api/orders/cart/update_item/`: Update cart item
- `POST /api/orders/cart/remove_item/`: Remove item from cart
- `GET /api/orders/orders/`: List user's orders
- `POST /api/orders/orders/`: Create a new order
- `GET /api/orders/orders/{id}/`: Get order details

### EMI
- `GET /api/orders/emi-plans/`: List all EMI plans
- `POST /api/orders/emi-records/`: Create a new EMI record
- `GET /api/orders/emi-records/`: List user's EMI records

## Development

### Running Tests
```
python manage.py test
```

### Code Style
This project follows PEP 8 style guidelines.

## License

This project is licensed under the MIT License. 