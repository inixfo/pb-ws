import re
from io import BytesIO
from PIL import Image
from django.http import HttpResponse
from django.conf import settings
from django.core.files.storage import default_storage
from urllib.parse import parse_qs

class ImageResizingMiddleware:
    """
    Middleware to handle on-the-fly image resizing.
    
    This middleware intercepts requests for images with size and width parameters
    and returns resized versions of the images.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        # Regex pattern to match image file extensions
        self.image_pattern = re.compile(r'.*\.(jpg|jpeg|png|gif|webp)$', re.IGNORECASE)
        
    def __call__(self, request):
        # Check if this is an image request
        path = request.path_info
        query_string = request.META.get('QUERY_STRING', '')
        
        # Only process if it's a media URL and has query parameters
        if path.startswith('/media/') and query_string and self.image_pattern.match(path):
            # Parse query parameters
            query_params = parse_qs(query_string)
            size = query_params.get('size', [''])[0]
            width_str = query_params.get('width', [''])[0]
            
            # Only process if size and width parameters are present
            if size in ['small', 'medium'] and width_str.isdigit():
                width = int(width_str)
                
                # Remove /media/ prefix to get relative path
                image_path = path[7:]  # Remove '/media/' prefix
                
                try:
                    # Open the original image
                    if default_storage.exists(image_path):
                        with default_storage.open(image_path, 'rb') as f:
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
                            if format.lower() == 'jpg':
                                content_type = 'image/jpeg'
                                
                            response = HttpResponse(output.read(), content_type=content_type)
                            
                            # Add cache headers
                            response['Cache-Control'] = 'public, max-age=31536000'  # Cache for a year
                            
                            return response
                except Exception as e:
                    print(f"Error resizing image: {e}")
        
        # If not an image request or any error occurred, continue with normal request
        return self.get_response(request) 