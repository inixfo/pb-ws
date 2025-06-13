# AWS Deployment Guide for Phone Bay

This guide provides step-by-step instructions for deploying the Phone Bay application on AWS.

## Prerequisites

1. AWS Account with administrative access
2. AWS CLI installed and configured
3. Docker and Docker Compose installed locally
4. Git repository with your Phone Bay codebase

## Architecture Overview

The Phone Bay application will be deployed using the following AWS services:

- **Amazon EC2**: For hosting the application containers
- **Amazon RDS**: For PostgreSQL database
- **Amazon S3**: For storing static files and media uploads
- **Amazon ElastiCache**: For Redis caching
- **Amazon Route 53**: For DNS management (optional)
- **AWS Elastic Load Balancer**: For load balancing and SSL termination
- **Amazon CloudFront**: For CDN (optional)

## Step 1: Set Up the Database (RDS)

1. Log in to the AWS Management Console
2. Navigate to RDS service
3. Click "Create database"
4. Select "PostgreSQL"
5. Choose the appropriate instance size (e.g., db.t3.micro for dev/test, db.t3.small or larger for production)
6. Configure settings:
   - DB instance identifier: `phonebay-db`
   - Master username: `postgres` (or your preferred username)
   - Master password: Create a secure password
7. Configure advanced settings:
   - VPC: Select your VPC
   - Subnet group: Create a new subnet group or use existing
   - Public accessibility: No (for security)
   - VPC security group: Create new or use existing
   - Database name: `phonebay`
   - Backup retention period: 7 days (or as needed)
8. Click "Create database"
9. Note the endpoint URL for later use

## Step 2: Set Up S3 Bucket for Static Files and Media

1. Navigate to S3 service
2. Click "Create bucket"
3. Name the bucket (e.g., `phonebay-static-media`)
4. Select the region (same as your RDS and EC2 instances)
5. Configure options:
   - Block all public access: Uncheck (we need public access for static files)
   - Bucket versioning: Enable
6. Click "Create bucket"
7. Select the bucket and go to the "Permissions" tab
8. Add the following bucket policy (replace `your-bucket-name` with your actual bucket name):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

## Step 3: Set Up ElastiCache for Redis

1. Navigate to ElastiCache service
2. Click "Create" and select Redis
3. Configure settings:
   - Name: `phonebay-redis`
   - Engine version: Latest available
   - Node type: cache.t3.micro (or appropriate size)
   - Number of replicas: 0 (for dev/test) or more for production
4. Advanced settings:
   - Subnet group: Create new or use existing
   - VPC security group: Create new or use existing
5. Click "Create"
6. Note the endpoint URL for later use

## Step 4: Create EC2 Instance

1. Navigate to EC2 service
2. Click "Launch instance"
3. Choose an Amazon Linux 2 AMI
4. Select instance type (t2.medium or larger recommended)
5. Configure instance:
   - VPC: Same as your RDS
   - Subnet: Public subnet
   - Auto-assign Public IP: Enable
6. Add storage: At least 20GB
7. Add tags as needed
8. Configure security group:
   - Allow SSH (port 22) from your IP
   - Allow HTTP (port 80) from anywhere
   - Allow HTTPS (port 443) from anywhere
9. Launch instance and select/create a key pair
10. Connect to your instance via SSH

## Step 5: Install Docker on EC2

Connect to your EC2 instance and run:

```bash
# Update system
sudo yum update -y

# Install Docker
sudo amazon-linux-extras install docker -y
sudo service docker start
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and log back in to apply group changes
exit
```

## Step 6: Configure Environment Files

1. Log back into your EC2 instance
2. Clone your repository:

```bash
git clone <your-repository-url>
cd phone-bay
```

3. Create environment files from examples:

```bash
cd deployment
cp backend.env.example backend.env
cp db.env.example db.env
```

4. Edit the environment files with your AWS resource details:

```bash
# Edit backend.env
nano backend.env
```

Update the following values:
- `SECRET_KEY`: Generate a secure random key
- `ALLOWED_HOSTS`: Add your domain and EC2 public IP/DNS
- `DB_HOST`: Your RDS endpoint
- `DB_PASSWORD`: Your RDS password
- `AWS_*`: Your S3 bucket details
- `FRONTEND_BASE_URL`: Your frontend URL
- `BACKEND_BASE_URL`: Your backend URL
- `SSLCOMMERZ_*`: Your payment gateway credentials

```bash
# Edit db.env
nano db.env
```

Update:
- `POSTGRES_PASSWORD`: Same as in backend.env

## Step 7: Deploy with Docker Compose

```bash
cd deployment
docker-compose up -d
```

## Step 8: Set Up Domain and SSL (Optional)

1. Register a domain through Route 53 or your preferred registrar
2. Create a hosted zone in Route 53
3. Add A records pointing to your EC2 instance IP
4. Install Certbot for SSL:

```bash
sudo amazon-linux-extras install epel -y
sudo yum install certbot python-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Step 9: Set Up CloudFront for CDN (Optional)

1. Navigate to CloudFront service
2. Create a distribution:
   - Origin domain: Your EC2 instance public DNS or ELB DNS
   - Origin path: Leave empty
   - Origin protocol policy: Match viewer
3. Configure settings:
   - Price class: Use only North America and Europe (or as needed)
   - Alternate domain names: Your domain name
   - SSL certificate: Custom SSL certificate (ACM)
4. Create distribution
5. Update your DNS records to point to the CloudFront distribution

## Step 10: Set Up CI/CD Pipeline (Optional)

1. Create a GitHub Actions workflow or AWS CodePipeline
2. Configure to build and deploy on code changes
3. Set up automated testing

## Monitoring and Maintenance

1. Set up CloudWatch alarms for:
   - EC2 instance CPU and memory usage
   - RDS database performance
   - ElastiCache performance
2. Configure regular backups:
   - RDS automated backups
   - EC2 AMI backups
3. Set up log monitoring

## Scaling Considerations

- Use Auto Scaling Groups for EC2 instances
- Consider using ECS or EKS for container orchestration
- Implement read replicas for RDS
- Use ElastiCache cluster mode for Redis

## Security Best Practices

- Keep all systems updated
- Use IAM roles with least privilege
- Enable VPC flow logs
- Use security groups to restrict traffic
- Implement AWS WAF for web application firewall
- Enable GuardDuty for threat detection 