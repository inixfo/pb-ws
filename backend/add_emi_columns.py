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
        
        # Add emi_type column if it doesn't exist
        if not emi_type_exists:
            print("Adding emi_type column to orders_cartitem table...")
            cursor.execute("""
            ALTER TABLE orders_cartitem 
            ADD COLUMN emi_type varchar(20) NULL
            """)
            print("emi_type column added successfully.")
        else:
            print("emi_type column already exists.")
        
        # Add emi_bank column if it doesn't exist
        if not emi_bank_exists:
            print("Adding emi_bank column to orders_cartitem table...")
            cursor.execute("""
            ALTER TABLE orders_cartitem 
            ADD COLUMN emi_bank varchar(20) NULL
            """)
            print("emi_bank column added successfully.")
        else:
            print("emi_bank column already exists.")
        
        # Check for OrderItem table columns
        cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='orders_orderitem' AND column_name='emi_type'
        """)
        order_emi_type_exists = cursor.fetchone() is not None
        
        cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='orders_orderitem' AND column_name='emi_bank'
        """)
        order_emi_bank_exists = cursor.fetchone() is not None
        
        # Add emi_type column to OrderItem if it doesn't exist
        if not order_emi_type_exists:
            print("Adding emi_type column to orders_orderitem table...")
            cursor.execute("""
            ALTER TABLE orders_orderitem 
            ADD COLUMN emi_type varchar(20) NULL
            """)
            print("emi_type column added successfully to orders_orderitem.")
        else:
            print("emi_type column already exists in orders_orderitem.")
        
        # Add emi_bank column to OrderItem if it doesn't exist
        if not order_emi_bank_exists:
            print("Adding emi_bank column to orders_orderitem table...")
            cursor.execute("""
            ALTER TABLE orders_orderitem 
            ADD COLUMN emi_bank varchar(20) NULL
            """)
            print("emi_bank column added successfully to orders_orderitem.")
        else:
            print("emi_bank column already exists in orders_orderitem.")

if __name__ == "__main__":
    print("Starting to add EMI columns to database tables...")
    add_columns()
    print("Finished adding EMI columns.") 