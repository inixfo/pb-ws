import django_filters
from django.db.models import Q, Count
from .models import Product, Category, Brand
from django.db import models

class ProductFilter(django_filters.FilterSet):
    """Filter for Product model."""
    
    # Search filter
    search = django_filters.CharFilter(method='filter_by_search')
    
    # Price filters using base_price field
    min_price = django_filters.NumberFilter(field_name='base_price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='base_price', lookup_expr='lte')
    base_price__gte = django_filters.NumberFilter(field_name='base_price', lookup_expr='gte')
    base_price__lte = django_filters.NumberFilter(field_name='base_price', lookup_expr='lte')
    
    # Category filters
    category = django_filters.ModelChoiceFilter(queryset=Category.objects.all())
    category_slug = django_filters.CharFilter(method='filter_by_category_slug')
    
    # Brand filters  
    brand = django_filters.ModelChoiceFilter(queryset=Brand.objects.all())
    brand__slug = django_filters.CharFilter(method='filter_by_brand_slug')
    brand__slug__in = django_filters.CharFilter(method='filter_by_brand_slugs')
    
    # Product flags
    is_trending = django_filters.BooleanFilter()
    is_special_offer = django_filters.BooleanFilter()
    is_best_seller = django_filters.BooleanFilter()
    is_todays_deal = django_filters.BooleanFilter()
    
    def filter_by_search(self, queryset, name, value):
        """Filter products by search term across name, description, and specifications"""
        if not value:
            return queryset
            
        print(f"Searching for: {value}")
        
        # Search across multiple fields
        return queryset.filter(
            Q(name__icontains=value) | 
            Q(description__icontains=value) |
            Q(specifications__icontains=value) |
            Q(category__name__icontains=value) |
            Q(brand__name__icontains=value)
        )
    
    def filter_by_category_slug(self, queryset, name, value):
        """Filter products by category slug, including subcategories."""
        try:
            print(f"Filtering by category_slug: {value}")
            
            if not value:
                return queryset
                
            # Find the category with this slug
            category = Category.objects.filter(slug=value).first()
            print(f"Found category: {category}")
            
            if not category:
                # Try to get by parent/child relationship
                found = False
                for parent_category in Category.objects.filter(parent__isnull=True):
                    child_category = Category.objects.filter(parent=parent_category, slug=value).first()
                    if child_category:
                        category = child_category
                        found = True
                        print(f"Found child category: {category}")
                        break
                
                # If still not found, try partial match
                if not found:
                    # Try a more flexible approach (partial match)
                    similar_categories = Category.objects.filter(slug__contains=value)
                    if similar_categories.exists():
                        category_ids = list(similar_categories.values_list('id', flat=True))
                        filtered_queryset = queryset.filter(category_id__in=category_ids)
                        print(f"Found {similar_categories.count()} similar categories, filtered to {filtered_queryset.count()} products")
                        return filtered_queryset
            
            if not category:
                print(f"No category found for slug {value}")
                return queryset  # Return original queryset instead of empty to prevent blank pages
            
            # Include subcategories
            category_ids = [category.id]
            subcategories = Category.objects.filter(parent=category)
            category_ids.extend(subcategories.values_list('id', flat=True))
            
            print(f"Category IDs for filtering: {category_ids}")
            filtered_queryset = queryset.filter(category_id__in=category_ids)
            print(f"Found {filtered_queryset.count()} products in category {value}")
            
            return filtered_queryset
        except Exception as e:
            print(f"Error in filter_by_category_slug: {str(e)}")
            import traceback
            traceback.print_exc()
            return queryset  # Return original queryset instead of none to prevent blank pages
    
    def filter_by_brand_slug(self, queryset, name, value):
        """Filter products by a single brand slug."""
        if not value:
            return queryset
        print(f"Filtering by brand_slug: {value}")
        return queryset.filter(brand__slug=value)
    
    def filter_by_brand_slugs(self, queryset, name, value):
        """Filter products by brand slugs (comma-separated)."""
        if not value:
            return queryset
            
        brand_slugs = [slug.strip() for slug in value.split(',')]
        print(f"Filtering by brand_slugs: {brand_slugs}")
        return queryset.filter(brand__slug__in=brand_slugs)
    
    def filter_queryset(self, queryset):
        """
        Override filter_queryset to handle custom specification filters.
        Look for parameters that start with 'specifications__' and apply
        appropriate filtering on the specifications JSON field.
        """
        try:
            # Print request data if available for debugging
            if hasattr(self, 'request') and self.request:
                print(f"Filter request params: {self.request.query_params}")
            
            # Check for price filters directly from request data
            if hasattr(self, 'request') and self.request:
                # Direct base_price filters
                base_price_gte = self.request.query_params.get('base_price__gte')
                if base_price_gte is not None:
                    try:
                        base_price_gte = float(base_price_gte)
                        print(f"Filtering base_price >= {base_price_gte}")
                        queryset = queryset.filter(base_price__gte=base_price_gte)
                    except (ValueError, TypeError) as e:
                        print(f"Error parsing base_price__gte: {e}")
                
                base_price_lte = self.request.query_params.get('base_price__lte')
                if base_price_lte is not None:
                    try:
                        base_price_lte = float(base_price_lte)
                        print(f"Filtering base_price <= {base_price_lte}")
                        queryset = queryset.filter(base_price__lte=base_price_lte)
                    except (ValueError, TypeError) as e:
                        print(f"Error parsing base_price__lte: {e}")
                
                # Legacy min_price/max_price filters for backward compatibility
                min_price = self.request.query_params.get('min_price')
                if min_price is not None:
                    try:
                        min_price = float(min_price)
                        print(f"Filtering min_price >= {min_price}")
                        queryset = queryset.filter(base_price__gte=min_price)
                    except (ValueError, TypeError) as e:
                        print(f"Error parsing min_price: {e}")
                
                max_price = self.request.query_params.get('max_price')
                if max_price is not None:
                    try:
                        max_price = float(max_price)
                        print(f"Filtering max_price <= {max_price}")
                        queryset = queryset.filter(base_price__lte=max_price)
                    except (ValueError, TypeError) as e:
                        print(f"Error parsing max_price: {e}")
            
            # First apply all the regular filters
            queryset = super().filter_queryset(queryset)
            
            # Check if we need to apply special ordering (but only if we have a request)
            if hasattr(self, 'request') and self.request:
                ordering = self.request.query_params.get('ordering', None)
                if ordering == '-review_count':
                    queryset = queryset.annotate(
                        review_count=models.Count('product_reviews', filter=models.Q(product_reviews__status='approved'))
                    ).order_by('-review_count')
                    # Return early since we've already applied ordering
                    return queryset
            
            # Only continue if we have form data to work with
            if not hasattr(self, 'form') or not hasattr(self.form, 'cleaned_data'):
                return queryset
                
            # Get all parameters
            data = self.form.cleaned_data.copy()
            
            # Log the cleaned form data
            print(f"Cleaned form data: {data}")
            
            # Find all specification filters
            spec_filters = {}
            for key in list(data.keys()):
                if key.startswith('specifications__') and '__in' in key:
                    # Extract the specification field name
                    field_name = key.replace('specifications__', '').replace('__in', '')
                    
                    # Get the values (could be comma-separated)
                    values = data.get(key)
                    if values:
                        # If it's a string, split by commas
                        if isinstance(values, str):
                            values = [v.strip() for v in values.split(',')]
                        
                        # Store for filtering
                        spec_filters[field_name] = values
                        
                    # Remove from regular filtering
                    data.pop(key)
            
            # Apply specification filters
            for field_name, values in spec_filters.items():
                print(f"Applying specification filter: {field_name} = {values}")
                # Build the filter condition for this specification field
                filter_conditions = Q()
                for value in values:
                    # Django doesn't have a direct way to search within JSON arrays
                    # We need to use a custom approach with raw SQL or JSON contains
                    
                    # For string values in the specifications
                    scalar_equals_condition = Q(**{f"specifications__{field_name}": value})
                    
                    # For arrays/lists in the specifications - not directly supported
                    # Need to use a JSON contains check
                    try:
                        # Using the contains lookup on a JSONField
                        # This is more compatible across database backends
                        list_contains_condition = Q(**{f"specifications__{field_name}__contains": value})
                        filter_conditions |= scalar_equals_condition | list_contains_condition
                    except Exception:
                        # Fallback to just the exact match if contains fails
                        filter_conditions |= scalar_equals_condition
                
                # Apply the filter
                queryset = queryset.filter(filter_conditions)
            
            return queryset
        except Exception as e:
            # Print the error for debugging but don't break the filter
            print(f"Error in filter_queryset: {str(e)}")
            import traceback
            traceback.print_exc()
            return queryset
    
    class Meta:
        model = Product
        fields = [
            'category', 'brand', 'min_price', 'max_price', 
            'base_price__gte', 'base_price__lte',
            'is_trending', 'is_special_offer', 'is_best_seller', 'is_todays_deal',
            'emi_available'
        ] 