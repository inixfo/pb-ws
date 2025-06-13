#!/usr/bin/env python
import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from emi.models import EMIPlan, EMIApplication, EMIRecord
from orders.models import Order
from decimal import Decimal

User = get_user_model()

def create_test_emi_data():
    """Create test EMI data for debugging."""
    
    # Get or create a test user
    user, created = User.objects.get_or_create(
        email='test@example.com',
        defaults={
            'first_name': 'Test',
            'last_name': 'User',
            'phone': '+8801234567890'
        }
    )
    if created:
        user.set_password('testpass123')
        user.save()
        print(f"Created test user: {user.email}")
    else:
        print(f"Using existing test user: {user.email}")
    
    # Create or get EMI plan
    plan, created = EMIPlan.objects.get_or_create(
        name='12-Month Cardless EMI',
        defaults={
            'description': 'Test cardless EMI plan for 12 months',
            'plan_type': 'cardless_emi',
            'duration_months': 12,
            'interest_rate': Decimal('15.00'),
            'min_price': Decimal('10000.00'),
            'down_payment_percentage': Decimal('20.00'),
            'processing_fee_percentage': Decimal('1.00'),
            'processing_fee_fixed': Decimal('500.00'),
            'is_active': True
        }
    )
    if created:
        print(f"Created test EMI plan: {plan.name}")
    else:
        print(f"Using existing EMI plan: {plan.name}")
    
    # Create a test order if none exists
    order, created = Order.objects.get_or_create(
        user=user,
        defaults={
            'order_id': 'TEST001',
            'subtotal': Decimal('50000.00'),
            'total': Decimal('50000.00'),
            'payment_method': 'mobile',
            'status': 'pending',
            'shipping_address': 'Test Address',
            'shipping_city': 'Dhaka',
            'shipping_state': 'Bangladesh',
            'shipping_postal_code': '1000',
            'shipping_phone': '+8801234567890'
        }
    )
    if created:
        print(f"Created test order: {order.order_id}")
    else:
        print(f"Using existing order: {order.order_id}")
    
    # Create a test EMI application
    application, created = EMIApplication.objects.get_or_create(
        user=user,
        order=order,
        defaults={
            'emi_plan': plan,
            'tenure_months': 12,
            'product_price': Decimal('50000.00'),
            'down_payment': Decimal('10000.00'),
            'principal_amount': Decimal('40000.00'),
            'processing_fee': Decimal('1000.00'),
            'monthly_installment': Decimal('3800.00'),
            'total_payable': Decimal('45600.00'),
            'total_interest': Decimal('5600.00'),
            'status': 'pending',
            'employment_type': 'salaried',
            'job_title': 'Software Engineer',
            'monthly_income': Decimal('80000.00'),
            'nid_number': '1234567890123',
            'nid_front_image': 'emi/nid_images/front.jpg',
            'nid_back_image': 'emi/nid_images/back.jpg',
        }
    )
    if created:
        print(f"Created test EMI application: {application.id}")
    else:
        print(f"Using existing EMI application: {application.id}")
    
    print("\nTest EMI data created successfully!")
    print(f"User ID: {user.id}")
    print(f"EMI Plan ID: {plan.id}")
    print(f"Order ID: {order.id}")
    print(f"EMI Application ID: {application.id}")
    
    # Also create an approved application with EMI record
    try:
        approved_order = Order.objects.create(
            user=user,
            order_id='TEST002',
            subtotal=Decimal('30000.00'),
            total=Decimal('30000.00'),
            payment_method='mobile',
            status='pending',
            shipping_address='Test Address 2',
            shipping_city='Dhaka',
            shipping_state='Bangladesh',
            shipping_postal_code='1000',
            shipping_phone='+8801234567890'
        )
        
        approved_app = EMIApplication.objects.create(
            user=user,
            order=approved_order,
            emi_plan=plan,
            tenure_months=12,
            product_price=Decimal('30000.00'),
            down_payment=Decimal('6000.00'),
            principal_amount=Decimal('24000.00'),
            processing_fee=Decimal('600.00'),
            monthly_installment=Decimal('2280.00'),
            total_payable=Decimal('27360.00'),
            total_interest=Decimal('3360.00'),
            status='approved',
            employment_type='salaried',
            job_title='Software Engineer',
            monthly_income=Decimal('80000.00'),
            nid_number='1234567890123',
            nid_front_image='emi/nid_images/front.jpg',
            nid_back_image='emi/nid_images/back.jpg',
        )
        
        # Create EMI record
        emi_record = EMIRecord.objects.create(
            user=user,
            order=approved_order,
            application=approved_app,
            emi_plan=plan,
            tenure_months=12,
            principal_amount=Decimal('24000.00'),
            monthly_installment=Decimal('2280.00'),
            total_payable=Decimal('27360.00'),
            remaining_amount=Decimal('27360.00'),
            down_payment_paid=True
        )
        
        # Generate installments
        emi_record.generate_installments()
        
        print(f"Created approved EMI application: {approved_app.id}")
        print(f"Created EMI record: {emi_record.id}")
        
    except Exception as e:
        print(f"Note: Could not create additional test data: {e}")

if __name__ == '__main__':
    create_test_emi_data() 