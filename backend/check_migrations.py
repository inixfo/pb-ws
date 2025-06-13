import sqlite3

# Connect to the database
conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

# Check payments migrations
cursor.execute('SELECT * FROM django_migrations WHERE app="payments"')
results = cursor.fetchall()
print("Payments migrations in database:")
for row in results:
    print(row)

# Close the connection
conn.close()

print("Script completed") 