#!/bin/bash

# This script updates the frontend environment variables in the .env file
# Usage: ./update_frontend_env.sh <api_url> <app_name> <s3_bucket> <aws_region>

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

# Create .env file in the frontend directory
cat > ../home/.env << EOF
# API Configuration
VITE_API_URL=${API_URL}

# Application Settings
VITE_APP_NAME="${APP_NAME}"

# AWS Settings
VITE_AWS_S3_BUCKET=${S3_BUCKET}
VITE_AWS_REGION=${AWS_REGION}

# Payment Gateway Settings
VITE_PAYMENT_GATEWAY_URL=https://securepay.sslcommerz.com
EOF

echo "Frontend environment variables updated successfully in ../home/.env" 