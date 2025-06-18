#!/bin/bash

# Stop any running Django server
echo "Stopping any running Django server..."
pkill -f "python manage.py runserver" || true

# Navigate to the backend directory
cd backend

# Install Pillow if not already installed
echo "Installing dependencies..."
pip install Pillow

# Run migrations
echo "Running migrations..."
python manage.py makemigrations
python manage.py migrate

# Start the server
echo "Starting Django server..."
python manage.py runserver 0.0.0.0:8000 