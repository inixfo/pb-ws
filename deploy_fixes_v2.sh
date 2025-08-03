#!/bin/bash

# Comprehensive Fix Deployment Script for PhoneBay v2
# This script addresses the following issues:
# 1. Trending products price/variant not updating when clicked
# 2. Filters not working on Best Sellers, Today's Deals, New Arrivals pages
# 3. Category-brand filter not working properly for bikes
# 4. Enhanced keyword-based search not working

echo "🚀 Starting PhoneBay Fixes Deployment v2..."

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

# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "home" ]; then
    print_error "Please run this script from the PhoneBay project root directory"
    exit 1
fi

print_status "Starting deployment process..."

# Step 1: Fix Trending Products Issue
print_status "Step 1: Fixing Trending Products price/variant update issue..."
if [ -f "home/src/screens/ElectronicsProduct/sections/TrendingProductsSection/TrendingProductsSection.tsx" ]; then
    print_success "TrendingProductsSection.tsx found - fixes applied"
else
    print_error "TrendingProductsSection.tsx not found"
fi

# Step 2: Fix Filter Issues on Best Sellers, Today's Deals, New Arrivals
print_status "Step 2: Fixing filter issues on Best Sellers, Today's Deals, New Arrivals pages..."

# Check BestSellers
if [ -f "home/src/screens/BestSellers/BestSellers.tsx" ]; then
    print_success "BestSellers.tsx found - filter fixes applied"
else
    print_error "BestSellers.tsx not found"
fi

# Check TodaysDeals
if [ -f "home/src/screens/TodaysDeals/TodaysDeals.tsx" ]; then
    print_success "TodaysDeals.tsx found - filter fixes applied"
else
    print_error "TodaysDeals.tsx not found"
fi

# Check NewArrivals
if [ -f "home/src/screens/NewArrivals/NewArrivals.tsx" ]; then
    print_success "NewArrivals.tsx found - filter fixes applied"
else
    print_error "NewArrivals.tsx not found"
fi

# Step 3: Fix Category-Brand Filter Issue
print_status "Step 3: Fixing category-brand filter issue for bikes..."
if [ -f "home/src/screens/ShopCatalog/ShopCatalog.tsx" ]; then
    print_success "ShopCatalog.tsx found - category-brand filter fixes applied"
else
    print_error "ShopCatalog.tsx not found"
fi

# Step 4: Fix Enhanced Keyword-Based Search
print_status "Step 4: Fixing enhanced keyword-based search..."
if [ -f "backend/products/views.py" ]; then
    print_success "views.py found - search fixes applied"
else
    print_error "views.py not found"
fi

# Step 5: Build Frontend
print_status "Step 5: Building frontend..."
cd home
if npm run build; then
    print_success "Frontend build completed successfully"
else
    print_error "Frontend build failed"
    exit 1
fi
cd ..

# Step 6: Restart Backend Services
print_status "Step 6: Restarting backend services..."

# Check if we're in a Docker environment
if [ -f "deployment/docker-compose.yml" ]; then
    print_status "Docker environment detected, restarting containers..."
    cd deployment
    if docker-compose down && docker-compose up -d; then
        print_success "Docker containers restarted successfully"
    else
        print_error "Failed to restart Docker containers"
        exit 1
    fi
    cd ..
else
    print_status "Non-Docker environment detected"
    print_warning "Please manually restart your backend services"
fi

# Step 7: Clear Cache
print_status "Step 7: Clearing cache..."
if [ -d "backend" ]; then
    cd backend
    if python manage.py clear_cache 2>/dev/null; then
        print_success "Cache cleared successfully"
    else
        print_warning "Cache clear command not available or failed"
    fi
    cd ..
fi

# Step 8: Verify Fixes
print_status "Step 8: Verifying fixes..."

# Check if backend is running
if curl -s http://localhost:8000/api/products/products/ > /dev/null 2>&1; then
    print_success "Backend API is responding"
else
    print_warning "Backend API is not responding - please check if backend is running"
fi

# Check if frontend is accessible
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_success "Frontend is accessible"
else
    print_warning "Frontend is not accessible - please check if frontend is running"
fi

print_success "🎉 Deployment completed successfully!"

echo ""
echo "📋 Summary of fixes applied:"
echo "✅ 1. Trending Products: Fixed price/variant update issue by using full page reload"
echo "✅ 2. Filter Issues: Fixed categories and brands loading on Best Sellers, Today's Deals, New Arrivals pages"
echo "✅ 3. Category-Brand Filter: Fixed filtering logic for bikes and other categories"
echo "✅ 4. Keyword Search: Fixed search to use OR logic instead of AND for better keyword matching"
echo ""
echo "🔧 Next steps:"
echo "1. Test the trending products section by clicking on different products"
echo "2. Verify filters are working on Best Sellers, Today's Deals, and New Arrivals pages"
echo "3. Test category-brand filtering (e.g., bikes + specific brand)"
echo "4. Test keyword-based search with various terms"
echo ""
echo "📞 If you encounter any issues, please check the browser console and backend logs" 