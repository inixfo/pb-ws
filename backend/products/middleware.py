import re
from io import BytesIO
from PIL import Image
from django.http import HttpResponse
from django.conf import settings
from django.core.files.storage import default_storage

class ImageResizingMiddleware:
    """
    Middleware to handle on-the-fly image resizing.
    
    This middleware intercepts requests for images with size and width parameters
    and returns resized versions of the images.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        # Regex pattern to match image URLs with size and width parameters
        self.image_pattern = re.compile(r'^/media/(.+)\?size=(small|medium)&width=(\d+)$')
        
    def __call__(self, request):
        # Check if this is an image request with resize parameters
        match = self.image_pattern.match(request.path_info + '?' + request.META.get('QUERY_STRING', ''))
        
        if match:
            # Extract image path and resize parameters
            image_path, size, width = match.groups()
            width = int(width)
            
            # Full path to the image
            full_path = f"media/{image_path}"
            
            try:
                # Open the original image
                if default_storage.exists(full_path):
                    with default_storage.open(full_path, 'rb') as f:
                        img = Image.open(f)
                        
                        # Calculate new height maintaining aspect ratio
                        ratio = img.height / img.width
                        height = int(width * ratio)
                        
                        # Resize the image
                        resized_img = img.resize((width, height), Image.LANCZOS)
                        
                        # Save to a BytesIO object
                        output = BytesIO()
                        
                        # Determine format from original image
                        format = img.format if img.format else 'JPEG'
                        
                        # Save with appropriate quality
                        if format == 'JPEG':
                            resized_img.save(output, format=format, quality=85, optimize=True)
                        else:
                            resized_img.save(output, format=format)
                            
                        output.seek(0)
                        
                        # Create response with appropriate content type
                        content_type = f'image/{format.lower()}'
                        response = HttpResponse(output.read(), content_type=content_type)
                        
                        # Add cache headers
                        response['Cache-Control'] = 'public, max-age=31536000'  # Cache for a year
                        
                        return response
            except Exception as e:
                print(f"Error resizing image: {e}")
        
        # If not an image request or any error occurred, continue with normal request
        return self.get_response(request) 