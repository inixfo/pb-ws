import os
import sqlite3

print("Starting database check...")

# Connect to the database
try:
    conn = sqlite3.connect('db.sqlite3')
    cursor = conn.cursor()
    print("Successfully connected to database")

    # List all tables in the database
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    all_tables = cursor.fetchall()
    print(f"All tables: {all_tables}")

    # Check if payments_payment and payments_transaction tables exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'payments_%';")
    tables = cursor.fetchall()
    print(f"Payment tables: {tables}")

    # Check if django_migrations has entries for payments app
    cursor.execute("SELECT * FROM django_migrations WHERE app='payments';")
    migrations = cursor.fetchall()
    print(f"Payment migrations: {migrations}")

    # Close the connection
    conn.close()
    print("Database connection closed")
except Exception as e:
    print(f"Error: {e}")
    
print("Script completed") 