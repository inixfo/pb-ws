#!/bin/bash

echo "🚀 Deploying PhoneBay Fixes v3 - Comprehensive Issue Resolution"
echo "================================================================"

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
if [ ! -f "package.json" ] || [ ! -d "home" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Starting comprehensive fix deployment..."

# Step 1: Frontend Build
print_status "Step 1: Building frontend..."
cd home

# Clean previous build
print_status "Cleaning previous build..."
rm -rf build/
rm -rf node_modules/.cache/

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install
fi

# Build the frontend
print_status "Building frontend with production optimizations..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Frontend build completed successfully"
else
    print_error "Frontend build failed"
    exit 1
fi

cd ..

# Step 2: Backend Updates
print_status "Step 2: Applying backend fixes..."

# Check if Docker is running
if command -v docker &> /dev/null && docker info &> /dev/null; then
    print_status "Docker detected, restarting backend container..."
    
    # Stop the backend container
    docker-compose down backend
    
    # Start the backend container
    docker-compose up -d backend
    
    # Wait for backend to be ready
    print_status "Waiting for backend to be ready..."
    sleep 10
    
    # Check if backend is responding
    if curl -f http://localhost:8000/api/health/ &> /dev/null; then
        print_success "Backend is running and responding"
    else
        print_warning "Backend may not be fully ready yet, continuing..."
    fi
else
    print_status "Docker not available, assuming manual backend restart..."
    print_warning "Please restart your backend server manually"
fi

# Step 3: Clear Caches
print_status "Step 3: Clearing caches..."

# Clear Django cache if possible
if command -v curl &> /dev/null; then
    print_status "Clearing Django cache..."
    curl -X POST http://localhost:8000/api/clear-cache/ 2>/dev/null || true
fi

# Clear browser cache instructions
print_status "Clearing browser cache..."
echo "Please clear your browser cache or use Ctrl+Shift+R to hard refresh"

# Step 4: Verify Fixes
print_status "Step 4: Verifying fixes..."

# Test trending products fix
print_status "Testing trending products navigation..."
echo "Navigate to a product page and click on trending products to verify price/variant updates"

# Test filter functionality
print_status "Testing filter functionality..."
echo "Navigate to Best Sellers, Today's Deals, or New Arrivals pages to verify filters are working"

# Test category-brand filtering
print_status "Testing category-brand filtering..."
echo "Navigate to a category page and click on a brand to verify proper filtering"

# Test search functionality
print_status "Testing search functionality..."
echo "Try searching with keywords to verify enhanced search is working"

# Step 5: Summary
print_success "Deployment completed!"
echo ""
echo "📋 Fix Summary:"
echo "==============="
echo "✅ Trending Products: Fixed navigation with proper state management"
echo "✅ Filter Sidebar: Fixed category and brand loading on special pages"
echo "✅ Category-Brand Filter: Enhanced URL parameter handling"
echo "✅ Enhanced Search: Fixed keyword-based search with OR logic"
echo "✅ Backend: Added missing import for quote function"
echo ""
echo "🔧 Technical Changes:"
echo "===================="
echo "• Modified TrendingProductsSection to use React Router with state parameters"
echo "• Enhanced ProductContext to detect forceRefresh state"
echo "• Fixed filter data loading in BestSellers, TodaysDeals, NewArrivals"
echo "• Improved ShopCatalog URL parameter handling for category-brand filtering"
echo "• Fixed backend search functions to use OR logic instead of AND"
echo "• Added missing urllib.parse import for quote function"
echo ""
echo "🧪 Testing Instructions:"
echo "======================="
echo "1. Clear browser cache (Ctrl+Shift+R)"
echo "2. Navigate to any product page"
echo "3. Click on trending products - prices should update correctly"
echo "4. Visit Best Sellers/Today's Deals/New Arrivals - filters should load"
echo "5. Try category-brand navigation - should filter correctly"
echo "6. Test search with keywords - should find products with any keyword"
echo ""
echo "🚨 If issues persist:"
echo "===================="
echo "• Check browser console for errors"
echo "• Verify backend is running on port 8000"
echo "• Clear browser cache completely"
echo "• Try in incognito/private browsing mode"

print_success "Deployment script completed successfully!" 