#!/bin/bash

# Script to fix domain issues between www.phonebay.xyz and phonebay.xyz
echo "========== Fixing Domain Issues Script =========="
echo "This script will fix issues with www vs non-www domain handling"
echo

# 1. Check if containers are running
echo "=== Step 1: Checking container status ==="
if docker ps | grep -q "backend"; then
    echo "✓ Backend container is running"
else
    echo "❌ Backend container is not running. Please start it first."
    exit 1
fi

if docker ps | grep -q "nginx"; then
    echo "✓ Nginx container is running"
else
    echo "❌ Nginx container is not running. Please start it first."
    exit 1
fi
echo

# 2. Test nginx configuration
echo "=== Step 2: Testing nginx configuration ==="
docker exec nginx nginx -t
if [ $? -eq 0 ]; then
    echo "✓ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors. Please check the config file."
    exit 1
fi
echo

# 3. Reload nginx
echo "=== Step 3: Reloading nginx ==="
docker exec nginx nginx -s reload
if [ $? -eq 0 ]; then
    echo "✓ Nginx reloaded successfully"
else
    echo "❌ Failed to reload nginx"
    exit 1
fi
echo

# 4. Restart backend to apply Django settings changes
echo "=== Step 4: Restarting backend to apply Django settings ==="
docker restart backend
if [ $? -eq 0 ]; then
    echo "✓ Backend restarted successfully"
else
    echo "❌ Failed to restart backend"
    exit 1
fi

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
sleep 10
echo

# 5. Test domain responses
echo "=== Step 5: Testing domain responses ==="

# Test non-www domain
echo "Testing https://phonebay.xyz..."
if curl -s -I https://phonebay.xyz | grep -q "200 OK"; then
    echo "✓ https://phonebay.xyz is responding"
else
    echo "❌ https://phonebay.xyz is not responding properly"
fi

# Test www domain
echo "Testing https://www.phonebay.xyz..."
if curl -s -I https://www.phonebay.xyz | grep -q "200 OK"; then
    echo "✓ https://www.phonebay.xyz is responding"
else
    echo "❌ https://www.phonebay.xyz is not responding properly"
fi

# Test API endpoints
echo "Testing API endpoints..."
if curl -s https://phonebay.xyz/api/products/ | grep -q -E '"count"|"results"'; then
    echo "✓ https://phonebay.xyz/api/ is working"
else
    echo "❌ https://phonebay.xyz/api/ is not working properly"
fi

if curl -s https://www.phonebay.xyz/api/products/ | grep -q -E '"count"|"results"'; then
    echo "✓ https://www.phonebay.xyz/api/ is working"
else
    echo "❌ https://www.phonebay.xyz/api/ is not working properly"
fi
echo

# 6. Clear browser cache recommendation
echo "=== Step 6: Important Instructions ==="
echo "✅ Domain fixes have been applied!"
echo
echo "🔧 Changes made:"
echo "   • Frontend now uses dynamic API URLs based on current domain"
echo "   • Cookie domains set to work for both www and non-www"
echo "   • CORS configuration updated for both domains"
echo "   • Session and CSRF cookies configured properly"
echo
echo "👉 IMPORTANT: Clear your browser cache and cookies for both domains:"
echo "   1. Open browser developer tools (F12)"
echo "   2. Go to Application/Storage tab"
echo "   3. Clear all cookies for phonebay.xyz"
echo "   4. Clear all cookies for www.phonebay.xyz"
echo "   5. Clear localStorage and sessionStorage"
echo "   6. Hard refresh (Ctrl+Shift+R) both URLs"
echo
echo "🚀 Now both https://phonebay.xyz and https://www.phonebay.xyz should work identically!"

echo "========== Script completed ==========" 