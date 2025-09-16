#!/bin/bash

# Restart Backend Service Script
# This script restarts the PhoneBay backend service to pick up code changes

echo "🔄 Restarting PhoneBay Backend Service..."

# Check if we're in a Docker environment
if [ -f "docker-compose.yml" ] || [ -f "deployment/docker-compose.yml" ]; then
    echo "📦 Docker environment detected"
    
    if [ -f "deployment/docker-compose.yml" ]; then
        echo "🔄 Restarting backend service with deployment docker-compose..."
        cd deployment
        docker-compose restart backend
        cd ..
    else
        echo "🔄 Restarting backend service..."
        docker-compose restart backend
    fi
    
    echo "✅ Docker backend service restarted!"
    
elif systemctl is-active --quiet phonebay-backend 2>/dev/null; then
    echo "🔄 Restarting systemd service..."
    sudo systemctl restart phonebay-backend
    echo "✅ Systemd service restarted!"
    
else
    echo "⚠️ No automated restart method found."
    echo "Please manually restart your Django backend service."
    echo ""
    echo "If using Django development server:"
    echo "  1. Stop the current server (Ctrl+C)"
    echo "  2. cd backend"
    echo "  3. python manage.py runserver"
    echo ""
    echo "If using Docker:"
    echo "  docker-compose restart backend"
    echo ""
    echo "If using systemd:"
    echo "  sudo systemctl restart phonebay-backend"
fi

echo ""
echo "🎉 After restart, test autocomplete at: https://phonebay.xyz"
echo "✨ Type 'samsung', 'iphone', or 'phone' in the search bar to see rich suggestions!"
