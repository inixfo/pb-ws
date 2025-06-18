#!/bin/bash

# Search Functionality Improvements Deployment Script

echo "Starting deployment of search functionality improvements..."

# 1. Install required Python packages
echo "Installing required Python packages..."
pip install fuzzywuzzy python-Levenshtein

# 2. Apply database migrations if needed
echo "Applying database migrations..."
cd backend
python manage.py makemigrations
python manage.py migrate
cd ..

# 3. Create necessary directories if they don't exist
mkdir -p home/src/components/SearchBar
mkdir -p home/src/hooks

# 4. Restart backend server
echo "Restarting backend server..."
cd backend
if [ -f "../deployment/deploy.sh" ]; then
    echo "Using deployment script to restart services..."
    cd ..
    bash deployment/deploy.sh restart backend
else
    echo "Manually restarting Django server..."
    # Kill any existing Django processes
    pkill -f "python manage.py runserver" || true
    # Start Django server in the background
    nohup python manage.py runserver 0.0.0.0:8000 > /dev/null 2>&1 &
    cd ..
fi

# 5. Rebuild and restart frontend if needed
echo "Rebuilding frontend..."
cd home
npm install
npm run build

# If running in development mode, restart dev server
if pgrep -f "npm run dev" > /dev/null; then
    echo "Restarting development server..."
    pkill -f "npm run dev" || true
    nohup npm run dev > /dev/null 2>&1 &
fi
cd ..

echo "Search functionality improvements deployed successfully!"
echo "The following features are now available:"
echo "- Search autocomplete and suggestions"
echo "- 'Did you mean' suggestions for typos"
echo "- Prioritization of exact matches over partial matches"
echo "- Search analytics tracking"
echo "- Dedicated search API endpoints"

echo "Done!" 