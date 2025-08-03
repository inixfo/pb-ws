#!/bin/bash

echo "🔧 Deploying Category-Brand Filter Fix"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_status "Starting category-brand filter fix deployment..."

# Step 1: Frontend Build
print_status "Step 1: Building frontend..."
cd home

# Clean previous build
print_status "Cleaning previous build..."
rm -rf build/
rm -rf node_modules/.cache/

# Build the frontend
print_status "Building frontend..."
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

# Step 3: Test the Fix
print_status "Step 3: Testing the category-brand filter fix..."

echo ""
echo "🧪 Testing Instructions:"
echo "======================="
echo "1. Clear browser cache (Ctrl+Shift+R)"
echo "2. Test the following URLs:"
echo "   - https://phonebay.xyz/catalog?category=bikes&brand=hero"
echo "   - https://phonebay.xyz/catalog?category=mobile-phones&brand=samsung"
echo "   - https://phonebay.xyz/catalog?category=ac&brand=haier"
echo ""
echo "3. Expected behavior:"
echo "   - Should show products that match BOTH the category AND brand"
echo "   - Should NOT show all products from the brand"
echo "   - Should filter correctly for bikes and mobile phones"
echo ""
echo "4. Check browser console for API call logs:"
echo "   - Look for 'Adding category from URL param' messages"
echo "   - Look for 'Adding brand from URL param' messages"
echo "   - Verify both parameters are being sent to the API"
echo ""

# Step 4: Summary
print_success "Deployment completed!"
echo ""
echo "📋 Fix Summary:"
echo "==============="
echo "✅ Added missing brand__slug filter to ProductFilter"
echo "✅ Enhanced ShopCatalog API call construction"
echo "✅ Improved logging for debugging"
echo "✅ Fixed category-brand parameter handling"
echo ""
echo "🔧 Technical Changes:"
echo "===================="
echo "• Added brand__slug filter method to backend/filters.py"
echo "• Enhanced API endpoint construction in ShopCatalog.tsx"
echo "• Added comprehensive logging for debugging"
echo "• Fixed parameter exclusion logic in API calls"
echo ""
echo "🚨 If issues persist:"
echo "===================="
echo "• Check browser console for API call logs"
echo "• Verify backend is running on port 8000"
echo "• Check Django logs for filter application"
echo "• Try in incognito/private browsing mode"

print_success "Category-brand filter fix deployment completed!" 