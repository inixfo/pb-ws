import os
import sqlite3
import django
from datetime import datetime

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

print("Starting migration fix...")

# Connect to the database
try:
    conn = sqlite3.connect('db.sqlite3')
    conn.isolation_level = None  # Enable autocommit mode
    cursor = conn.cursor()
    print("Successfully connected to database")

    # Check if payments_payment table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='payments_payment';")
    payment_table_exists = cursor.fetchone()
    
    # Check if any payments migrations are recorded
    cursor.execute("SELECT * FROM django_migrations WHERE app='payments';")
    migrations = cursor.fetchall()
    
    print(f"Payment table exists: {bool(payment_table_exists)}")
    print(f"Payment migrations: {migrations}")
    
    # Start transaction
    cursor.execute("BEGIN TRANSACTION;")
    
    try:
        # Create the payments_payment table manually
        print("Creating payments_payment table...")
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS "payments_payment" (
            "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
            "transaction_id" varchar(100) NOT NULL UNIQUE,
            "amount" decimal NOT NULL,
            "payment_method" varchar(50) NOT NULL,
            "payment_type" varchar(30) NOT NULL,
            "status" varchar(20) NOT NULL,
            "payment_details" text NULL,
            "created_at" datetime NOT NULL,
            "updated_at" datetime NOT NULL,
            "emi_plan_id" integer NULL REFERENCES "emi_emiplan" ("id") DEFERRABLE INITIALLY DEFERRED,
            "installment_id" integer NULL REFERENCES "emi_emiinstallment" ("id") DEFERRABLE INITIALLY DEFERRED,
            "order_id" integer NOT NULL REFERENCES "orders_order" ("id") DEFERRABLE INITIALLY DEFERRED,
            "user_id" integer NOT NULL REFERENCES "users_user" ("id") DEFERRABLE INITIALLY DEFERRED
        );
        ''')
        
        # Delete any existing migration records for payments app
        print("Cleaning up existing migration records...")
        cursor.execute("DELETE FROM django_migrations WHERE app='payments';")
        
        # Add migration records
        print("Adding migration records...")
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
        cursor.execute(
            "INSERT INTO django_migrations (app, name, applied) VALUES (?, ?, ?)",
            ('payments', '0001_initial', current_time)
        )
        
        cursor.execute(
            "INSERT INTO django_migrations (app, name, applied) VALUES (?, ?, ?)",
            ('payments', '0002_alter_payment_payment_type', current_time)
        )
        
        # Check if the changes were successful
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='payments_payment';")
        table_created = cursor.fetchone()
        
        cursor.execute("SELECT * FROM django_migrations WHERE app='payments';")
        migrations_added = cursor.fetchall()
        
        print(f"Table created: {bool(table_created)}")
        print(f"Migrations added: {len(migrations_added)}")
        
        # Commit transaction
        cursor.execute("COMMIT;")
        print("Changes committed to database")
    except Exception as e:
        cursor.execute("ROLLBACK;")
        print(f"Error during transaction, rolled back: {e}")
        raise

    # Close the connection
    conn.close()
    print("Database connection closed")
except Exception as e:
    print(f"Error: {e}")
    
print("Script completed") 