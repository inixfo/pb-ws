from storages.backends.s3boto3 import S3Boto3Storage

class MediaStorage(S3Boto3Storage):
    """
    Custom storage backend for media files.
    
    This class configures S3Boto3Storage to store media files in a separate
    'media' directory within the S3 bucket.
    """
    location = 'media'
    file_overwrite = False 