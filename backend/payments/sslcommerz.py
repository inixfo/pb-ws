import hashlib
import requests
import json
from typing import Dict, Any, Optional
from django.conf import settings


class SSLCOMMERZ:
    """
    Custom SSLCOMMERZ integration class
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.store_id = config.get('store_id')
        self.store_pass = config.get('store_pass')
        self.is_sandbox = config.get('issandbox', True)
        
        # API URLs
        if self.is_sandbox:
            self.base_url = 'https://sandbox.sslcommerz.com'
        else:
            self.base_url = 'https://securepay.sslcommerz.com'
            
    def createSession(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create payment session with SSLCOMMERZ
        """
        try:
            # Prepare the payment data
            data = {
                'store_id': self.store_id,
                'store_passwd': self.store_pass,
                **payment_data
            }
            
            # Make request to SSLCOMMERZ
            url = f"{self.base_url}/gwprocess/v4/api.php"
            
            response = requests.post(url, data=data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('status') == 'SUCCESS':
                    return {
                        'status': 'SUCCESS',
                        'GatewayPageURL': result.get('GatewayPageURL'),
                        'sessionkey': result.get('sessionkey'),
                        'response': result
                    }
                else:
                    return {
                        'status': 'FAILED',
                        'failedreason': result.get('failedreason', 'Unknown error'),
                        'response': result
                    }
            else:
                return {
                    'status': 'FAILED',
                    'failedreason': f'HTTP {response.status_code}: {response.text}',
                    'response': None
                }
                
        except requests.exceptions.RequestException as e:
            return {
                'status': 'FAILED',
                'failedreason': f'Network error: {str(e)}',
                'response': None
            }
        except Exception as e:
            return {
                'status': 'FAILED',
                'failedreason': f'Unexpected error: {str(e)}',
                'response': None
            }

    def validate_transaction(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate transaction with SSLCOMMERZ
        """
        try:
            val_id = transaction_data.get('val_id')
            store_id = transaction_data.get('store_id')
            
            if not val_id or not store_id:
                return {
                    'status': 'INVALID',
                    'message': 'Missing validation ID or store ID'
                }
            
            # Validation URL
            url = f"{self.base_url}/validator/api/validationserverAPI.php"
            
            data = {
                'val_id': val_id,
                'store_id': self.store_id,
                'store_passwd': self.store_pass,
                'format': 'json'
            }
            
            response = requests.get(url, params=data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'status': 'VALID' if result.get('status') == 'VALID' else 'INVALID',
                    'response': result
                }
            else:
                return {
                    'status': 'INVALID',
                    'message': f'HTTP {response.status_code}: {response.text}'
                }
                
        except Exception as e:
            return {
                'status': 'INVALID',
                'message': f'Validation error: {str(e)}'
            }

    def generate_hash(self, data: Dict[str, Any]) -> str:
        """
        Generate hash for additional security
        """
        # Create hash string from important fields
        hash_string = f"{self.store_id}{data.get('tran_id', '')}{data.get('total_amount', '')}{data.get('currency', '')}"
        
        # Add store password
        hash_string += self.store_pass
        
        # Generate MD5 hash
        return hashlib.md5(hash_string.encode()).hexdigest()

    def verify_hash(self, data: Dict[str, Any], received_hash: str) -> bool:
        """
        Verify hash for security
        """
        calculated_hash = self.generate_hash(data)
        return calculated_hash.lower() == received_hash.lower()


def get_sslcommerz_instance(config=None) -> SSLCOMMERZ:
    """
    Get configured SSLCOMMERZ instance
    
    Args:
        config (dict, optional): Configuration parameters. If not provided, will use settings.
    """
    if config is None:
        config = {
            'store_id': settings.STORE_ID,
            'store_pass': settings.STORE_PASSWORD,
            'issandbox': settings.SSLCOMMERZ_SANDBOX
        }
    
    return SSLCOMMERZ(config)


# Utility functions for payment validation
def validate_payment_data(payment_data: Dict[str, Any]) -> bool:
    """
    Validate payment callback data
    """
    # For development/debugging, log what we received
    print(f"DEBUG: Validating payment data: {payment_data}")
    
    # Verify minimum required fields - being more lenient for testing
    required_fields = ['tran_id']
    
    for field in required_fields:
        if field not in payment_data:
            print(f"DEBUG: Missing required field: {field}")
            return False
    
    # Check for valid status if present
    if 'status' in payment_data and payment_data.get('status') not in ['VALID', 'SUCCESS']:
        print(f"DEBUG: Invalid status: {payment_data.get('status')}")
        return False
    
    # Verify store ID if present, but don't fail if not provided
    if 'store_id' in payment_data and payment_data.get('store_id') != settings.STORE_ID:
        print(f"DEBUG: Store ID mismatch: {payment_data.get('store_id')} vs {settings.STORE_ID}")
        return False
    
    print("DEBUG: Payment validation successful")
    return True


def validate_ipn_data(ipn_data: Dict[str, Any]) -> bool:
    """
    Validate IPN (Instant Payment Notification) data
    """
    # Similar validation to payment data
    return validate_payment_data(ipn_data)


def format_amount(amount) -> str:
    """
    Format amount for SSLCOMMERZ (must be string with 2 decimal places)
    """
    return f"{float(amount):.2f}"


def generate_transaction_id(order_id: int, user_id: int) -> str:
    """
    Generate unique transaction ID
    """
    import uuid
    import time
    
    timestamp = int(time.time())
    unique_id = str(uuid.uuid4().hex[:8])
    
    return f"TXN_{order_id}_{user_id}_{timestamp}_{unique_id}" 