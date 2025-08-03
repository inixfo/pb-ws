#!/bin/bash

echo "🔍 Deploying Search Functionality Fix V2"
echo "========================================"

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

print_status "Starting search functionality fix V2 deployment..."

# Step 1: Test Search API
print_status "Step 1: Testing Search API..."
node debug_search.js

# Step 2: Frontend Build
print_status "Step 2: Building frontend..."
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

# Step 3: Backend Updates
print_status "Step 3: Applying backend fixes..."

# Check if Docker is running
if command -v docker &> /dev/null && docker info &> /dev/null; then
    print_status "Docker detected, restarting backend container..."
    
    # Stop the backend container
    docker-compose down backend
    
    # Start the backend container
    docker-compose up -d backend
    
    # Wait for backend to be ready
    print_status "Waiting for backend to be ready..."
    sleep 15
    
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

# Step 4: Test the Search Fix
print_status "Step 4: Testing the search functionality fix..."

echo ""
echo "🧪 Testing Instructions:"
echo "======================="
echo "1. Clear browser cache (Ctrl+Shift+R)"
echo "2. Test the following search queries:"
echo "   - 'samsung phone'"
echo "   - 'bike'"
echo "   - 'laptop'"
echo "   - 'mobile'"
echo "   - 'ac'"
echo "   - 'refrigerator'"
echo ""
echo "3. Expected behavior:"
echo "   - Should return relevant products based on keywords"
echo "   - Should NOT show 'Couldn't load products from the server' message"
echo "   - Should NOT show sample products"
echo "   - Should provide autocomplete suggestions"
echo "   - Should show 'Did you mean' for typos"
echo ""
echo "4. Check browser console for search logs:"
echo "   - Look for 'Using search service for query' messages"
echo "   - Look for 'Search service failed' messages if there are issues"
echo "   - Look for 'Falling back to regular product API' messages"
echo ""

# Step 5: Run Search Test
print_status "Step 5: Running search functionality test..."
node test_search_functionality.js

# Step 6: Summary
print_success "Deployment completed!"
echo ""
echo "📋 Fix Summary:"
echo "==============="
echo "✅ Added proper error handling around search service calls"
echo "✅ Enhanced fallback mechanism for search failures"
echo "✅ Improved logging for debugging search issues"
echo "✅ Added comprehensive error handling"
echo ""
echo "🔧 Technical Changes:"
echo "===================="
echo "• Added try-catch around search service calls"
echo "• Enhanced fallback to regular product API with search param"
echo "• Improved error logging and debugging"
echo "• Added proper error propagation"
echo ""
echo "🚨 If issues persist:"
echo "===================="
echo "• Check browser console for detailed error messages"
echo "• Verify backend is running on port 8000"
echo "• Check Django logs for search processing errors"
echo "• Try in incognito/private browsing mode"
echo "• Run the debug script: node debug_search.js"
echo "• Check if search endpoint is accessible: https://phonebay.xyz/api/products/search/"

print_success "Search functionality fix V2 deployment completed!" 