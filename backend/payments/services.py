import requests
import logging
from django.conf import settings
from decimal import Decimal

logger = logging.getLogger(__name__)

class SSLCommerzClient:
    """Client for interacting with SSLCOMMERZ API"""
    
    def __init__(self):
        self.store_id = settings.SSLCOMMERZ_STORE_ID
        self.store_passwd = settings.SSLCOMMERZ_STORE_PASSWORD
        self.base_url = settings.SSLCOMMERZ_API_URL
        self.is_sandbox = getattr(settings, 'SSLCOMMERZ_IS_SANDBOX', True)
    
    def _get_auth_params(self):
        """Get common authentication parameters for API calls"""
        return {
            'store_id': self.store_id,
            'store_passwd': self.store_passwd
        }
    
    def get_available_banks(self):
        """
        Fetch available EMI banks from SSLCOMMERZ API
        
        Returns:
            List of bank objects with code, name, and default interest rate
        """
        try:
            # Construct API endpoint - this is a hypothetical endpoint, replace with actual SSLCOMMERZ endpoint
            api_endpoint = f"{self.base_url}/get_available_emi_banks"
            
            # Make API request
            response = requests.post(
                api_endpoint,
                data=self._get_auth_params()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'SUCCESS':
                    return data.get('banks', [])
                else:
                    logger.error(f"SSLCOMMERZ API Error: {data.get('message')}")
                    return []
            else:
                logger.error(f"SSLCOMMERZ API Error: Status code {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Error fetching EMI banks from SSLCOMMERZ: {str(e)}")
            return []
    
    def get_emi_details(self, bank_code, amount, tenure):
        """
        Get EMI calculation details from SSLCOMMERZ for a specific bank
        
        Args:
            bank_code: The bank code (e.g., 'DBBL')
            amount: The total amount for EMI calculation
            tenure: Tenure period in months
            
        Returns:
            Dictionary containing EMI details or None on error
        """
        try:
            # Construct API endpoint - this is a hypothetical endpoint, replace with actual SSLCOMMERZ endpoint
            api_endpoint = f"{self.base_url}/calculate_emi"
            
            # Prepare request parameters
            params = self._get_auth_params()
            params.update({
                'bank_code': bank_code,
                'amount': amount,
                'tenure': tenure
            })
            
            # Make API request
            response = requests.post(api_endpoint, data=params)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'SUCCESS':
                    return {
                        'interest_rate': Decimal(data.get('interest_rate', '0')),
                        'monthly_payment': Decimal(data.get('monthly_amount', '0')),
                        'total_payment': Decimal(data.get('total_amount', '0')),
                        'bank_processing_fee': Decimal(data.get('processing_fee', '0')),
                    }
                else:
                    logger.error(f"SSLCOMMERZ EMI Calculation Error: {data.get('message')}")
                    return None
            else:
                logger.error(f"SSLCOMMERZ API Error: Status code {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error calculating EMI from SSLCOMMERZ: {str(e)}")
            return None 