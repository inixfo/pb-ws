from django.contrib.auth import get_user_model
import logging
from social_core.pipeline.partial import partial
from sms.services import SMSService

logger = logging.getLogger(__name__)
User = get_user_model()

def create_user(strategy, details, backend, user=None, *args, **kwargs):
    """
    Create user if not already exists and set is_verified=False if it's a new user.
    This function is called after associate_by_email, so if a user with the email already exists,
    it will be passed in the user parameter.
    """
    if user:
        # User already exists, check if it's a social auth user
        if user.is_verified:
            return {'is_new': False}
        return {'is_new': False, 'needs_phone_verification': True}

    # No existing user, create one with the Google data
    email = details.get('email')
    if not email:
        return None

    # Extract first and last name from Google data
    first_name = details.get('first_name', '')
    last_name = details.get('last_name', '')
    
    # Create the user with is_verified=False (will need phone verification)
    user = User.objects.create_user(
        email=email,
        first_name=first_name,
        last_name=last_name,
        password=None,  # No password for social auth users
        is_verified=False,  # User needs to verify phone number
    )
    
    # Return the new user and a flag indicating phone verification is needed
    return {
        'is_new': True,
        'user': user,
        'needs_phone_verification': True
    } 