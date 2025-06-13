from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django.db.models import Q
from .models import ShippingZone, ShippingMethod, ShippingRate
from .serializers import (
    ShippingZoneSerializer, ShippingMethodSerializer,
    ShippingRateSerializer, ShippingCalculatorSerializer
)
from .services import debug_city_matching


class ShippingZoneViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and editing shipping zones."""
    
    queryset = ShippingZone.objects.all()
    serializer_class = ShippingZoneSerializer
    permission_classes = [AllowAny]  # Allow any user to view shipping zones
    
    def get_permissions(self):
        """Return appropriate permissions."""
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]  # Public access for viewing zones
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]  # Admin only for modifications
        return [IsAuthenticated()]  # Authenticated users for other actions
    
    def get_queryset(self):
        """Filter zones based on query parameters."""
        queryset = super().get_queryset()
        
        # Filter by country
        country = self.request.query_params.get('country')
        if country:
            queryset = queryset.filter(countries__contains=[country])
        
        # Filter by state
        state = self.request.query_params.get('state')
        if state:
            queryset = queryset.filter(states__contains=[state])
        
        # Filter by city
        city = self.request.query_params.get('city')
        if city:
            queryset = queryset.filter(cities__contains=[city])
        
        # Filter by postal code
        postal_code = self.request.query_params.get('postal_code')
        if postal_code:
            queryset = queryset.filter(postal_codes__contains=[postal_code])
        
        return queryset.filter(is_active=True)

    @action(detail=False, methods=['get'])
    def debug_city(self, request):
        """Debug endpoint to check which zones match a city."""
        city = request.query_params.get('city')
        result = debug_city_matching(city)
        return Response(result)


class ShippingMethodViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and editing shipping methods."""
    
    queryset = ShippingMethod.objects.all()
    serializer_class = ShippingMethodSerializer
    permission_classes = [AllowAny]  # Allow any user to view shipping methods
    
    def get_permissions(self):
        """Return appropriate permissions."""
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]  # Public access for viewing methods
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]  # Admin only for modifications
        return [IsAuthenticated()]  # Authenticated users for other actions
    
    def get_queryset(self):
        """Filter methods based on query parameters."""
        queryset = super().get_queryset()
        
        # Filter by type
        method_type = self.request.query_params.get('type')
        if method_type:
            queryset = queryset.filter(method_type=method_type)
        
        # Filter by international shipping
        international = self.request.query_params.get('international')
        if international is not None:
            queryset = queryset.filter(international_shipping=international.lower() == 'true')
        
        # Filter by tracking
        tracking = self.request.query_params.get('tracking')
        if tracking is not None:
            queryset = queryset.filter(includes_tracking=tracking.lower() == 'true')
        
        return queryset.filter(is_active=True)


class ShippingRateViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and editing shipping rates."""
    
    queryset = ShippingRate.objects.all()
    serializer_class = ShippingRateSerializer
    permission_classes = [AllowAny]  # Allow any user to view shipping rates
    
    def get_permissions(self):
        """Return appropriate permissions."""
        if self.action in ['list', 'retrieve', 'calculate', 'available_rates']:
            return [AllowAny()]  # Public access for viewing rates and calculations
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]  # Admin only for modifications
        return [IsAuthenticated()]  # Authenticated users for other actions
    
    def get_queryset(self):
        """Filter rates based on query parameters."""
        queryset = super().get_queryset()
        
        # Filter by zone
        zone_id = self.request.query_params.get('zone')
        if zone_id:
            queryset = queryset.filter(zone_id=zone_id)
        
        # Filter by method
        method_id = self.request.query_params.get('method')
        if method_id:
            queryset = queryset.filter(method_id=method_id)
        
        # Filter by rate type
        rate_type = self.request.query_params.get('type')
        if rate_type:
            queryset = queryset.filter(rate_type=rate_type)
        
        return queryset.filter(is_active=True)
    
    @action(detail=False, methods=['post'])
    def calculate(self, request):
        """Calculate shipping cost for given parameters."""
        serializer = ShippingCalculatorSerializer(data=request.data)
        if serializer.is_valid():
            cost = serializer.calculate()
            return Response({
                'shipping_cost': cost,
                'currency': 'BDT'  # You might want to make this dynamic
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def available_rates(self, request):
        """Get available shipping rates for a location."""
        country = request.query_params.get('country')
        state = request.query_params.get('state')
        city = request.query_params.get('city')
        postal_code = request.query_params.get('postal_code')
        
        if not country:
            return Response(
                {'error': 'Country is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find matching zones
        zones = ShippingZone.objects.filter(
            Q(countries__contains=[country]) &
            Q(is_active=True)
        )
        
        if state:
            zones = zones.filter(Q(states__contains=[state]) | Q(states=[]))
        
        if city:
            zones = zones.filter(Q(cities__contains=[city]) | Q(cities=[]))
        
        if postal_code:
            zones = zones.filter(Q(postal_codes__contains=[postal_code]) | Q(postal_codes=[]))
        
        # Get rates for matching zones
        rates = self.get_queryset().filter(zone__in=zones)
        serializer = self.get_serializer(rates, many=True)
        
        return Response(serializer.data)
