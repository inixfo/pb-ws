import os
import django
import json

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from emi.models import EMIPlan

def create_sample_emi_plans():
    """Create sample EMI plans for testing."""
    
    # Sample bank interest rates
    bank_interest_rates = {
        'DBBL': 9.5,
        'BRAC': 10.0,
        'EBL': 9.75,
        'CITY': 10.25,
        'IFIC': 9.8,
        'MTBL': 10.5,
        'PRIME': 9.9,
        'SOUTHEAST': 10.1,
        'STANDARD': 9.6,
        'TRUST': 10.3,
        'UCB': 9.7,
        'UTTARA': 10.2
    }
    
    bank_list = list(bank_interest_rates.keys())
    
    # Create Card EMI plans
    card_emi_plans = [
        {
            'name': '6 Month Card EMI',
            'description': 'Convert your purchase into 6 easy monthly installments',
            'plan_type': 'card_emi',
            'duration_months': 6,
            'interest_rate': 0.0,  # Interest handled by SSLCOMMERZ/bank
            'down_payment_percentage': 0.0,
            'processing_fee_percentage': 0.0,
            'processing_fee_fixed': 0.0,
            'min_price': 10000.0,
            'max_price': 500000.0,
            'is_active': True,
            'is_sslcommerz_emi': True,
            'sslcommerz_bank_list': bank_list,
            'sslcommerz_bank_interest_rates': bank_interest_rates
        },
        {
            'name': '12 Month Card EMI',
            'description': 'Convert your purchase into 12 easy monthly installments',
            'plan_type': 'card_emi',
            'duration_months': 12,
            'interest_rate': 0.0,  # Interest handled by SSLCOMMERZ/bank
            'down_payment_percentage': 0.0,
            'processing_fee_percentage': 0.0,
            'processing_fee_fixed': 0.0,
            'min_price': 20000.0,
            'max_price': 1000000.0,
            'is_active': True,
            'is_sslcommerz_emi': True,
            'sslcommerz_bank_list': bank_list,
            'sslcommerz_bank_interest_rates': bank_interest_rates
        },
        {
            'name': '18 Month Card EMI',
            'description': 'Convert your purchase into 18 easy monthly installments',
            'plan_type': 'card_emi',
            'duration_months': 18,
            'interest_rate': 0.0,  # Interest handled by SSLCOMMERZ/bank
            'down_payment_percentage': 0.0,
            'processing_fee_percentage': 0.0,
            'processing_fee_fixed': 0.0,
            'min_price': 30000.0,
            'max_price': 1500000.0,
            'is_active': True,
            'is_sslcommerz_emi': True,
            'sslcommerz_bank_list': bank_list,
            'sslcommerz_bank_interest_rates': bank_interest_rates
        }
    ]
    
    # Create Cardless EMI plans
    cardless_emi_plans = [
        {
            'name': '6 Month Cardless EMI',
            'description': 'Get instant EMI without a credit card - 6 months',
            'plan_type': 'cardless_emi',
            'duration_months': 6,
            'interest_rate': 12.0,
            'down_payment_percentage': 20.0,
            'processing_fee_percentage': 2.0,
            'processing_fee_fixed': 500.0,
            'min_price': 15000.0,
            'max_price': 300000.0,
            'is_active': True,
            'is_sslcommerz_emi': False
        },
        {
            'name': '12 Month Cardless EMI',
            'description': 'Get instant EMI without a credit card - 12 months',
            'plan_type': 'cardless_emi',
            'duration_months': 12,
            'interest_rate': 15.0,
            'down_payment_percentage': 25.0,
            'processing_fee_percentage': 2.5,
            'processing_fee_fixed': 750.0,
            'min_price': 25000.0,
            'max_price': 500000.0,
            'is_active': True,
            'is_sslcommerz_emi': False
        }
    ]
    
    # Create the plans
    created_plans = []
    
    for plan_data in card_emi_plans + cardless_emi_plans:
        plan, created = EMIPlan.objects.get_or_create(
            name=plan_data['name'],
            plan_type=plan_data['plan_type'],
            defaults=plan_data
        )
        
        if created:
            print(f"Created EMI plan: {plan.name}")
            created_plans.append(plan)
        else:
            print(f"EMI plan already exists: {plan.name}")
            # Update existing plan with new data
            for key, value in plan_data.items():
                setattr(plan, key, value)
            plan.save()
            print(f"Updated EMI plan: {plan.name}")
    
    print(f"\nTotal EMI plans in database: {EMIPlan.objects.count()}")
    print(f"Active Card EMI plans: {EMIPlan.objects.filter(plan_type='card_emi', is_active=True).count()}")
    print(f"Active Cardless EMI plans: {EMIPlan.objects.filter(plan_type='cardless_emi', is_active=True).count()}")
    
    return created_plans

if __name__ == "__main__":
    print("Creating sample EMI plans...")
    create_sample_emi_plans()
    print("Done!") 