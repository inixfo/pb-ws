import os
import django
from django.db import connection

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def add_columns():
    with connection.cursor() as cursor:
        # Check if the columns already exist to avoid errors
        cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='orders_cartitem' AND column_name='emi_type'
        """)
        emi_type_exists = cursor.fetchone() is not None
        
        cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='orders_cartitem' AND column_name='emi_bank'
        """)
        emi_bank_exists = cursor.fetchone() is not None
        
        # Add emi_type column to orders_cartitem if it doesn't exist
        if not emi_type_exists:
            print("Adding emi_type column to orders_cartitem table...")
            cursor.execute("""
            ALTER TABLE orders_cartitem 
            ADD COLUMN emi_type varchar(20) NULL
            """)
            print("emi_type column added successfully.")
        else:
            print("emi_type column already exists in orders_cartitem table.")
        
        # Add emi_bank column to orders_cartitem if it doesn't exist
        if not emi_bank_exists:
            print("Adding emi_bank column to orders_cartitem table...")
            cursor.execute("""
            ALTER TABLE orders_cartitem 
            ADD COLUMN emi_bank varchar(20) NULL
            """)
            print("emi_bank column added successfully.")
        else:
            print("emi_bank column already exists in orders_cartitem table.")
        
        # Check if the columns already exist in orders_orderitem
        cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='orders_orderitem' AND column_name='emi_type'
        """)
        orderitem_emi_type_exists = cursor.fetchone() is not None
        
        cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='orders_orderitem' AND column_name='emi_bank'
        """)
        orderitem_emi_bank_exists = cursor.fetchone() is not None
        
        # Add emi_type column to orders_orderitem if it doesn't exist
        if not orderitem_emi_type_exists:
            print("Adding emi_type column to orders_orderitem table...")
            cursor.execute("""
            ALTER TABLE orders_orderitem 
            ADD COLUMN emi_type varchar(20) NULL
            """)
            print("emi_type column added successfully to orders_orderitem.")
        else:
            print("emi_type column already exists in orders_orderitem table.")
        
        # Add emi_bank column to orders_orderitem if it doesn't exist
        if not orderitem_emi_bank_exists:
            print("Adding emi_bank column to orders_orderitem table...")
            cursor.execute("""
            ALTER TABLE orders_orderitem 
            ADD COLUMN emi_bank varchar(20) NULL
            """)
            print("emi_bank column added successfully to orders_orderitem.")
        else:
            print("emi_bank column already exists in orders_orderitem table.")

def update_emi_types():
    print("Updating existing cart items with default EMI types...")
    from orders.models import CartItem
    from emi.models import EMIPlan
    
    # Get all cart items with EMI selected but no emi_type set
    cart_items = CartItem.objects.filter(emi_selected=True, emi_plan__isnull=False, emi_type__isnull=True)
    
    for item in cart_items:
        if item.emi_plan:
            # Set default emi_type based on the plan_type
            if item.emi_plan.plan_type == 'cardless_emi':
                item.emi_type = 'cardless_emi'
            else:
                item.emi_type = 'card_emi'
            item.save()
    
    print(f"Updated {cart_items.count()} cart items with default EMI types.")
    
    # Also update order items
    from orders.models import OrderItem
    order_items = OrderItem.objects.filter(has_emi=True, emi_plan__isnull=False, emi_type__isnull=True)
    
    for item in order_items:
        if item.emi_plan:
            # Set default emi_type based on the plan_type
            if item.emi_plan.plan_type == 'cardless_emi':
                item.emi_type = 'cardless_emi'
            else:
                item.emi_type = 'card_emi'
            item.save()
    
    print(f"Updated {order_items.count()} order items with default EMI types.")

if __name__ == "__main__":
    print("Starting to add EMI columns to database tables...")
    add_columns()
    update_emi_types()
    print("Finished adding EMI columns.") 