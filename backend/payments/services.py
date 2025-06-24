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
            # Log SSLCOMMERZ configuration for debugging
            logger.info(f"SSLCOMMERZ Config - Store ID: {self.store_id}, Sandbox: {self.is_sandbox}, API URL: {self.base_url}")
            
            # In production or when API is not available, return hardcoded banks as fallback
            # This ensures the frontend always has something to display
            fallback_banks = [
                {"code": "DBBL", "name": "Dutch-Bangla Bank", "interest_rate": 12.5},
                {"code": "EBLC", "name": "Eastern Bank", "interest_rate": 13.0},
                {"code": "BCBL", "name": "Bangladesh Commerce Bank", "interest_rate": 11.5},
                {"code": "BBL", "name": "BRAC Bank", "interest_rate": 12.0},
                {"code": "ABBL", "name": "AB Bank", "interest_rate": 13.5},
                {"code": "MTBL", "name": "Mutual Trust Bank", "interest_rate": 12.0},
                {"code": "SCB", "name": "Standard Chartered Bank", "interest_rate": 11.0},
                {"code": "CITI", "name": "Citibank", "interest_rate": 10.5},
                {"code": "EBL", "name": "Eastern Bank Limited", "interest_rate": 12.5},
                {"code": "HSBC", "name": "HSBC Bank", "interest_rate": 11.5}
            ]
            
            # For development or testing, we'll just return the fallback banks
            if self.is_sandbox or not self.base_url or not self.store_id:
                logger.info("Using fallback bank list (sandbox or missing config)")
                return fallback_banks
            
            try:
                # Real SSLCOMMERZ API endpoint for EMI banks
                api_endpoint = f"{self.base_url}/get_emi_banks"
                
                # Make API request
                response = requests.post(
                    api_endpoint,
                    data=self._get_auth_params(),
                    timeout=5  # Add timeout to prevent hanging
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('status') == 'SUCCESS':
                        return data.get('banks', fallback_banks)
                    else:
                        logger.warning(f"SSLCOMMERZ API Error: {data.get('message')}, using fallback data")
                        return fallback_banks
                else:
                    logger.warning(f"SSLCOMMERZ API Error: Status code {response.status_code}, using fallback data")
                    return fallback_banks
            
            except requests.RequestException as e:
                logger.warning(f"SSLCOMMERZ API Request Error: {str(e)}, using fallback data")
                return fallback_banks
                
        except Exception as e:
            logger.error(f"Error in get_available_banks: {str(e)}")
            # Always return some data for the frontend
            return [
                {"code": "DBBL", "name": "Dutch-Bangla Bank", "interest_rate": 12.5},
                {"code": "BBL", "name": "BRAC Bank", "interest_rate": 12.0}
            ]
    
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
            # For development/sandbox mode, calculate locally
            if self.is_sandbox or not self.base_url or not self.store_id:
                logger.info(f"Calculating EMI details locally (sandbox mode or missing config)")
                
                # Use bank-specific interest rates
                bank_rates = {
                    'DBBL': 12.5, 'EBLC': 13.0, 'BCBL': 11.5, 'BBL': 12.0,
                    'ABBL': 13.5, 'MTBL': 12.0, 'SCB': 11.0, 'CITI': 10.5,
                    'EBL': 12.5, 'HSBC': 11.5
                }
                
                interest_rate = bank_rates.get(bank_code, 12.0)  # Default to 12% if bank not found
                amt = Decimal(str(amount))
                
                # Simple EMI calculation
                monthly_interest_rate = Decimal(interest_rate) / Decimal('100') / Decimal('12')
                if monthly_interest_rate > 0:
                    monthly_payment = amt * (
                        monthly_interest_rate * (Decimal('1') + monthly_interest_rate) ** tenure
                    ) / ((Decimal('1') + monthly_interest_rate) ** tenure - Decimal('1'))
                else:
                    monthly_payment = amt / Decimal(tenure)
                
                total_payment = monthly_payment * Decimal(tenure)
                total_interest = total_payment - amt
                
                return {
                    'interest_rate': Decimal(interest_rate),
                    'monthly_payment': monthly_payment,
                    'total_payment': total_payment,
                    'total_interest': total_interest,
                    'bank_processing_fee': Decimal('0'),
                    'is_calculated_locally': True
                }
            
            try:
                # Real SSLCOMMERZ API endpoint
                api_endpoint = f"{self.base_url}/emi_calculator"
                
                # Prepare request parameters
                params = self._get_auth_params()
                params.update({
                    'bank_code': bank_code,
                    'amount': amount,
                    'tenure': tenure
                })
                
                # Make API request
                response = requests.post(api_endpoint, data=params, timeout=5)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('status') == 'SUCCESS':
                        return {
                            'interest_rate': Decimal(str(data.get('interest_rate', '0'))),
                            'monthly_payment': Decimal(str(data.get('monthly_amount', '0'))),
                            'total_payment': Decimal(str(data.get('total_amount', '0'))),
                            'bank_processing_fee': Decimal(str(data.get('processing_fee', '0'))),
                        }
                    else:
                        logger.warning(f"SSLCOMMERZ EMI Calculation Error: {data.get('message')}, using fallback calculation")
                        return self._calculate_emi_locally(bank_code, amount, tenure)
                else:
                    logger.warning(f"SSLCOMMERZ API Error: Status code {response.status_code}, using fallback calculation")
                    return self._calculate_emi_locally(bank_code, amount, tenure)
                    
            except requests.RequestException as e:
                logger.warning(f"SSLCOMMERZ API Request Error: {str(e)}, using fallback calculation")
                return self._calculate_emi_locally(bank_code, amount, tenure)
                
        except Exception as e:
            logger.error(f"Error in get_emi_details: {str(e)}")
            # Use a simple fallback calculation to ensure we return something
            try:
                amt = Decimal(str(amount))
                interest = amt * Decimal('0.12')  # 12% interest
                total = amt + interest
                monthly = total / Decimal(tenure)
                
                return {
                    'interest_rate': Decimal('12.0'),
                    'monthly_payment': monthly,
                    'total_payment': total,
                    'total_interest': interest,
                    'bank_processing_fee': Decimal('0'),
                    'is_calculated_locally': True
                }
            except:
                return None
    
    def _calculate_emi_locally(self, bank_code, amount, tenure):
        """Helper method for local EMI calculation when API fails"""
        # Use bank-specific interest rates
        bank_rates = {
            'DBBL': 12.5, 'EBLC': 13.0, 'BCBL': 11.5, 'BBL': 12.0,
            'ABBL': 13.5, 'MTBL': 12.0, 'SCB': 11.0, 'CITI': 10.5,
            'EBL': 12.5, 'HSBC': 11.5
        }
        
        interest_rate = bank_rates.get(bank_code, 12.0)  # Default to 12% if bank not found
        amt = Decimal(str(amount))
        
        # Simple EMI calculation
        monthly_interest_rate = Decimal(interest_rate) / Decimal('100') / Decimal('12')
        if monthly_interest_rate > 0:
            monthly_payment = amt * (
                monthly_interest_rate * (Decimal('1') + monthly_interest_rate) ** int(tenure)
            ) / ((Decimal('1') + monthly_interest_rate) ** int(tenure) - Decimal('1'))
        else:
            monthly_payment = amt / Decimal(tenure)
        
        total_payment = monthly_payment * Decimal(tenure)
        total_interest = total_payment - amt
        
        return {
            'interest_rate': Decimal(interest_rate),
            'monthly_payment': monthly_payment,
            'total_payment': total_payment,
            'total_interest': total_interest,
            'bank_processing_fee': Decimal('0'),
            'is_calculated_locally': True
        }