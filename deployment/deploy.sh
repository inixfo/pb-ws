#!/bin/bash

# Main deployment script for Phone Bay
# Usage: ./deploy.sh <api_url> <app_name> <s3_bucket> <aws_region>

# Exit on error
set -e

# Check if arguments are provided
if [ $# -lt 1 ]; then
  echo "Usage: $0 <api_url> [<app_name>] [<s3_bucket>] [<aws_region>]"
  echo "Example: $0 https://api.phonebay.com/api \"Phone Bay\" phonebay-static-media us-east-1"
  exit 1
fi

# Set variables from arguments or use defaults
API_URL=${1:-"https://api.phonebay.com/api"}
APP_NAME=${2:-"Phone Bay"}
S3_BUCKET=${3:-"phonebay-static-media"}
AWS_REGION=${4:-"us-east-1"}

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Print deployment information
echo "=== Phone Bay Deployment ==="
echo "API URL: $API_URL"
echo "App Name: $APP_NAME"
echo "S3 Bucket: $S3_BUCKET"
echo "AWS Region: $AWS_REGION"
echo "Project Root: $PROJECT_ROOT"
echo "=========================="

# Check if environment files exist
if [ ! -f "$SCRIPT_DIR/backend.env" ]; then
  echo "Error: backend.env file not found. Please create it from backend.env.example."
  exit 1
fi

if [ ! -f "$SCRIPT_DIR/db.env" ]; then
  echo "Error: db.env file not found. Please create it from db.env.example."
  exit 1
fi

# Update frontend environment
echo "Updating frontend environment..."
chmod +x "$SCRIPT_DIR/update_frontend_env.sh"
"$SCRIPT_DIR/update_frontend_env.sh" "$API_URL" "$APP_NAME" "$S3_BUCKET" "$AWS_REGION"

# Update frontend config.js
echo "Updating frontend config.js..."
chmod +x "$SCRIPT_DIR/update_config.js.sh"
"$SCRIPT_DIR/update_config.js.sh" "$API_URL"

# Update backend settings
echo "Updating backend settings..."
python "$SCRIPT_DIR/update_backend_settings.py"

# Build and deploy with Docker Compose
echo "Building and deploying with Docker Compose..."
cd "$SCRIPT_DIR"
docker-compose down
docker-compose build
docker-compose up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 10

# Run database migrations
echo "Running database migrations..."
docker-compose exec backend python manage.py migrate

# Collect static files
echo "Collecting static files..."
docker-compose exec backend python manage.py collectstatic --noinput

# Create superuser if needed
read -p "Do you want to create a superuser? (y/n): " CREATE_SUPERUSER
if [ "$CREATE_SUPERUSER" = "y" ] || [ "$CREATE_SUPERUSER" = "Y" ]; then
  docker-compose exec backend python manage.py createsuperuser
fi

# Display deployment information
echo "=== Deployment Complete ==="
echo "Frontend: http://localhost"
echo "Backend API: http://localhost/api"
echo "Admin Panel: http://localhost/admin"
echo "=========================="
echo "To view logs: docker-compose logs -f"
echo "To stop services: docker-compose down" 