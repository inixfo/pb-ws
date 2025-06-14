from rest_framework import status, views, permissions
from rest_framework.response import Response
from django.http import FileResponse
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404

from products.models import Category
from products.utils.bulk_upload import generate_upload_template, process_upload_file
from users.permissions import IsVendorOwnerOrAdmin


class BulkUploadTemplateView(views.APIView):
    """
    API view for generating bulk upload templates.
    """
    permission_classes = [permissions.IsAuthenticated, IsVendorOwnerOrAdmin]
    
    def get(self, request, *args, **kwargs):
        """Generate a template for bulk product upload."""
        category_id = request.query_params.get('category_id')
        file_format = request.query_params.get('format', 'csv')
        
        if not category_id:
            return Response(
                {'error': 'Category ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Verify category exists
            category = get_object_or_404(Category, id=category_id)
            
            # Generate template
            template_file = generate_upload_template(category_id, file_format)
            
            # Set filename
            if file_format == 'csv':
                filename = f"{category.name}_template.csv"
                content_type = 'text/csv'
            else:
                filename = f"{category.name}_template.xlsx"
                content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            
            # Return file
            return FileResponse(
                template_file,
                as_attachment=True,
                filename=filename,
                content_type=content_type
            )
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BulkUploadProcessView(views.APIView):
    """
    API view for processing bulk product uploads.
    """
    permission_classes = [permissions.IsAuthenticated, IsVendorOwnerOrAdmin]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request, *args, **kwargs):
        """Process a bulk product upload file."""
        category_id = request.data.get('category_id')
        file = request.data.get('file')
        
        if not category_id:
            return Response(
                {'error': 'Category ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not file:
            return Response(
                {'error': 'Upload file is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Verify category exists
            category = get_object_or_404(Category, id=category_id)
            
            # Get vendor ID (for vendors) or None (for admins)
            vendor_id = None
            if hasattr(request.user, 'vendor_profile'):
                vendor_id = request.user.vendor_profile.id
            
            # Process file
            results = process_upload_file(file, category_id, vendor_id)
            
            # Summarize results
            success_count = sum(1 for r in results if r['status'] == 'success')
            error_count = len(results) - success_count
            
            return Response({
                'message': f"Processed {len(results)} rows with {success_count} successes and {error_count} errors",
                'summary': {
                    'total': len(results),
                    'success': success_count,
                    'error': error_count
                },
                'results': results
            })
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 