# Phone Bay

## Security Guidelines for Credentials

### Google OAuth Credentials

For security reasons, we do not store API credentials directly in the repository. Follow these steps to set up your credentials:

1. **Local Development**:
   - Create a `.env` file in the project root
   - Add your Google OAuth credentials:
     ```
     GOOGLE_CLIENT_ID=your_client_id_here
     GOOGLE_CLIENT_SECRET=your_client_secret_here
     ```
   - For frontend, update `home/src/config.js` with your client ID (do not commit this change)

2. **Production Deployment**:
   - Copy `deployment/production_credentials.sh.example` to `deployment/production_credentials.sh`
   - Add your actual credentials to this file
   - Source the file before deploying: `source ./deployment/production_credentials.sh`
   - Use the deployment scripts which will use these environment variables

3. **Server Configuration**:
   - For systemd services, add environment variables to the service file:
     ```
     Environment="GOOGLE_CLIENT_ID=your_client_id_here"
     Environment="GOOGLE_CLIENT_SECRET=your_client_secret_here"
     ```
   - Reload systemd: `sudo systemctl daemon-reload`
   - Restart your service: `sudo systemctl restart your-service-name.service`

### Important Security Notes

- Never commit API keys or secrets to the repository
- Always use environment variables for sensitive information
- Keep your `.env` and `production_credentials.sh` files in `.gitignore`
- Regularly rotate your credentials for better security
- Use GitHub's push protection to prevent accidental credential leaks 