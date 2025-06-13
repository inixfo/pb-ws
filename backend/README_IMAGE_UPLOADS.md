# Testing Image Uploads

This document provides instructions for testing product image uploads in the Phone Bay application.

## Backend Endpoint

The backend now provides a dedicated endpoint for product image uploads:

```
POST /api/products/products/{product_id}/images/
```

This endpoint accepts multipart form data with the following fields:
- `image`: The image file to upload
- `is_primary`: "true" or "false" - whether this image should be the primary product image

## Testing Tools

### 1. Django Testing Page

We've added a simple testing page that can be accessed at:

```
http://localhost:8000/api/products/image-upload-test/
```

This page allows you to:
- Select a product ID
- Upload an image file
- Set whether it's a primary image
- See the API response and debug information

### 2. Admin Test Page

For admin panel testing, a similar page is available at:

```
http://localhost:3000/admin/products/test-image-upload.html
```

## Debugging Tips

1. Check browser console for API request/response logs
2. Verify the image is present in the FormData
3. Ensure product ID exists and you have permissions to modify it
4. Check Django server logs for any backend errors

## Common Issues and Solutions

### 404 Not Found
- Make sure the product ID exists
- Confirm the API URL is correct (products/products/{id}/images/)

### Permission Denied (403)
- Ensure you're logged in with proper credentials
- Verify you have permission to modify the product (vendor or admin)

### File Upload Failed
- Check file size (must be reasonable, not too large)
- Ensure file is a valid image format
- Verify FormData contains 'image' field with file

## Technical Implementation

The image upload endpoint:
1. Gets the product by ID
2. Validates permissions
3. Extracts the image file from the request
4. Creates a ProductImage record
5. Sets primary image flag as requested
6. Returns the created image data

All images are stored in the `media/product_images/{product_id}/` directory. 