# Phone Bay Deployment

This directory contains all the necessary files and scripts to deploy the Phone Bay application to AWS.

## Deployment Options

There are two main deployment options:

1. **Docker Compose on EC2**: Deploy the entire stack on a single EC2 instance using Docker Compose
2. **AWS Managed Services**: Deploy using AWS managed services like ECS, RDS, ElastiCache, and S3

## Quick Start

### Option 1: Docker Compose on EC2

1. Set up environment files:

```bash
# Create environment files from examples
cp backend.env.example backend.env
cp db.env.example db.env

# Edit the files with your specific settings
nano backend.env
nano db.env
```

2. Run the deployment script:

```bash
# Make the script executable
chmod +x deploy.sh

# Run the deployment script with your API URL
./deploy.sh https://your-domain.com/api
```

### Option 2: AWS Managed Services

For a more scalable and production-ready deployment, follow the detailed instructions in `aws-setup.md`.

## Directory Structure

- `Dockerfile.backend`: Dockerfile for the Django backend
- `Dockerfile.frontend`: Dockerfile for the React frontend
- `docker-compose.yml`: Docker Compose configuration for local deployment
- `nginx.conf`: Nginx configuration for the frontend
- `backend.env.example`: Example environment variables for the backend
- `db.env.example`: Example environment variables for the database
- `frontend.env.example`: Example environment variables for the frontend
- `settings_aws.py`: Django settings for AWS deployment
- `storage_backends.py`: S3 storage configuration for Django
- `update_backend_settings.py`: Script to update backend settings
- `update_frontend_env.sh`: Script to update frontend environment
- `update_config.js.sh`: Script to update frontend config.js
- `deploy.sh`: Main deployment script
- `aws-setup.md`: Detailed AWS setup instructions

## Environment Variables

### Backend Environment Variables

See `backend.env.example` for a complete list of required environment variables.

Key variables include:
- `SECRET_KEY`: Django secret key
- `DEBUG`: Set to False for production
- `ALLOWED_HOSTS`: Comma-separated list of allowed hosts
- `DB_*`: Database connection settings
- `AWS_*`: AWS S3 settings for static and media files
- `SSLCOMMERZ_*`: Payment gateway settings

### Database Environment Variables

See `db.env.example` for required database environment variables.

### Frontend Environment Variables

See `frontend.env.example` for frontend environment variables.

## Deployment Scripts

- `deploy.sh`: Main deployment script
- `update_backend_settings.py`: Updates Django settings for AWS
- `update_frontend_env.sh`: Updates frontend environment variables
- `update_config.js.sh`: Updates frontend config.js with production settings

## SSL Configuration

For production deployments, you should configure SSL:

1. Register a domain name
2. Set up DNS records
3. Install and configure SSL certificates using Let's Encrypt

## Monitoring and Maintenance

After deployment, set up monitoring and maintenance:

1. Configure CloudWatch for monitoring
2. Set up regular database backups
3. Configure log rotation
4. Set up alerts for system issues

## Troubleshooting

If you encounter issues during deployment:

1. Check the Docker logs: `docker-compose logs -f`
2. Verify environment variables are set correctly
3. Check network connectivity between services
4. Verify AWS credentials and permissions

For more detailed troubleshooting, refer to the AWS documentation or contact support. 