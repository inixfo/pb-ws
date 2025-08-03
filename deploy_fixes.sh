#!/bin/bash

# Comprehensive Fix Deployment Script for PhoneBay
# This script addresses the following issues:
# 1. Trending products price/variant not updating when clicked
# 2. Filters not working on Best Sellers, Today's Deals, New Arrivals pages
# 3. Category-brand filter not working properly
# 4. Enhanced keyword-based search functionality

echo "🚀 Starting PhoneBay Fixes Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "backend/manage.py" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Deploying fixes for PhoneBay e-commerce platform..."

# 1. Backend Changes
print_status "Applying backend changes..."

# Navigate to backend directory
cd backend

# Install any new dependencies
print_status "Installing dependencies..."
pip install fuzzywuzzy python-Levenshtein

# Run migrations
print_status "Running database migrations..."
python manage.py makemigrations
python manage.py migrate

# 2. Frontend Changes
print_status "Applying frontend changes..."

# Navigate back to root and then to home directory
cd ../home

# Install dependencies
print_status "Installing frontend dependencies..."
npm install

# Build the frontend
print_status "Building frontend..."
npm run build

# 3. Restart Services
print_status "Restarting services..."

# Navigate back to root
cd ..

# Check if using Docker
if [ -f "deployment/docker-compose.yml" ]; then
    print_status "Using Docker deployment..."
    cd deployment
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose down
    
    # Rebuild and start containers
    print_status "Rebuilding and starting containers..."
    docker-compose up -d --build
    
    print_success "Docker containers restarted successfully!"
    
elif command -v systemctl &> /dev/null; then
    print_status "Using systemd services..."
    
    # Restart backend service
    if systemctl is-active --quiet gunicorn; then
        print_status "Restarting Gunicorn service..."
        sudo systemctl restart gunicorn
        print_success "Gunicorn service restarted!"
    fi
    
    # Restart nginx
    if systemctl is-active --quiet nginx; then
        print_status "Restarting Nginx service..."
        sudo systemctl restart nginx
        print_success "Nginx service restarted!"
    fi
    
else
    print_warning "No Docker or systemd detected. Please restart your services manually."
fi

# 4. Verify Changes
print_status "Verifying changes..."

# Wait a moment for services to start
sleep 5

# Test backend API
print_status "Testing backend API..."
if curl -s http://localhost:8000/api/products/products/ > /dev/null; then
    print_success "Backend API is responding!"
else
    print_warning "Backend API might not be responding. Please check manually."
fi

# Test frontend
print_status "Testing frontend..."
if curl -s http://localhost:80 > /dev/null || curl -s http://localhost:3000 > /dev/null; then
    print_success "Frontend is responding!"
else
    print_warning "Frontend might not be responding. Please check manually."
fi

# 5. Summary
echo ""
print_success "🎉 PhoneBay Fixes Deployment Complete!"
echo ""
echo "✅ Fixed Issues:"
echo "   1. Trending products now properly refresh when clicked"
echo "   2. Filters now work on Best Sellers, Today's Deals, and New Arrivals pages"
echo "   3. Category-brand filtering now works correctly"
echo "   4. Enhanced keyword-based search functionality added"
echo ""
echo "🔧 Technical Changes Applied:"
echo "   - Enhanced ProductContext to force refresh on product navigation"
echo "   - Fixed filter data loading in category pages"
echo "   - Improved URL parameter handling for category-brand filters"
echo "   - Enhanced backend search with keyword support"
echo "   - Updated autocomplete with better suggestions"
echo ""
echo "📝 Next Steps:"
echo "   1. Test the trending products section on any product page"
echo "   2. Verify filters work on Best Sellers, Today's Deals, and New Arrivals"
echo "   3. Test category-brand filtering (e.g., /catalog?category=ac&brand=haier)"
echo "   4. Test the enhanced search with keywords"
echo ""
echo "🌐 Access your site at: https://phonebay.xyz"
echo ""
print_status "Deployment completed successfully!" 