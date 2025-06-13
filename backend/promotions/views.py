from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import PromoCode, PromoCodeUsage, HeaderPromoBanner, HeroSlide, NewArrivalsBanner, SaleBanner, CatalogTopBanner, CatalogBottomBanner
from .serializers import (
    PromoCodeSerializer, PromoCodeValidateSerializer, PromoCodeApplySerializer,
    HeaderPromoBannerSerializer, HeroSlideSerializer, NewArrivalsBannerSerializer, SaleBannerSerializer,
    CatalogTopBannerSerializer, CatalogBottomBannerSerializer
)
from orders.models import Cart


class PromoCodeViewSet(viewsets.ModelViewSet):
    """ViewSet for managing promo codes."""
    
    queryset = PromoCode.objects.all()
    serializer_class = PromoCodeSerializer
    permission_classes = [permissions.IsAdminUser]
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def validate(self, request):
        """Validate a promo code without applying it."""
        serializer = PromoCodeValidateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        code = serializer.validated_data['code']
        cart_total = serializer.validated_data.get('cart_total', 0)
        
        try:
            promo_code = PromoCode.objects.get(code=code, is_active=True)
        except PromoCode.DoesNotExist:
            return Response({'error': 'Invalid promo code'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if the promo code is valid
        if not promo_code.is_valid:
            if promo_code.is_expired:
                return Response({'error': 'This promo code has expired'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'error': 'This promo code is no longer valid'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check minimum purchase amount
        if cart_total < promo_code.min_purchase_amount:
            return Response({
                'error': f'Minimum purchase amount of ৳{promo_code.min_purchase_amount} required',
                'min_purchase_amount': promo_code.min_purchase_amount
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user has already used this one-time code
        user = request.user
        if user.is_authenticated and promo_code.is_one_time_use:
            if PromoCodeUsage.objects.filter(promo_code=promo_code, user=user).exists():
                return Response({'error': 'You have already used this promo code'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate discount
        discount = promo_code.calculate_discount(cart_total)
        
        return Response({
            'valid': True,
            'code': promo_code.code,
            'discount_type': promo_code.discount_type,
            'discount_value': promo_code.discount_value,
            'discount_amount': discount,
            'min_purchase_amount': promo_code.min_purchase_amount,
            'max_discount_amount': promo_code.max_discount_amount
        })
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def apply(self, request):
        """Apply a promo code to the user's cart."""
        serializer = PromoCodeApplySerializer(data=request.data, context={'request': request})
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        code = serializer.validated_data['code']
        
        try:
            promo_code = PromoCode.objects.get(code=code, is_active=True)
        except PromoCode.DoesNotExist:
            return Response({'error': 'Invalid promo code'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get user's cart
        try:
            cart = Cart.objects.get(user=request.user)
        except Cart.DoesNotExist:
            return Response({'error': 'You have no items in your cart'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if cart has items
        if cart.items.count() == 0:
            return Response({'error': 'Your cart is empty'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate cart total
        cart_total = cart.total_price
        
        # Check minimum purchase amount
        if cart_total < promo_code.min_purchase_amount:
            return Response({
                'error': f'Minimum purchase amount of ৳{promo_code.min_purchase_amount} required',
                'min_purchase_amount': promo_code.min_purchase_amount
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate discount
        discount = promo_code.calculate_discount(cart_total)
        
        # Store the promo code in the cart
        cart.promo_code = promo_code
        cart.discount_amount = discount
        cart.save()
        
        # Also store in session for backward compatibility
        request.session['promo_code'] = {
            'code': promo_code.code,
            'discount_amount': float(discount)
        }
        
        return Response({
            'success': True,
            'message': f'Promo code {promo_code.code} applied successfully',
            'discount_amount': discount,
            'cart_total_before_discount': cart_total,
            'cart_total_after_discount': cart_total - discount
        })
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def remove(self, request):
        """Remove the applied promo code from the cart and session."""
        # Remove from cart
        try:
            cart = Cart.objects.get(user=request.user)
            if cart.promo_code:
                cart.promo_code = None
                cart.discount_amount = 0
                cart.save()
        except Cart.DoesNotExist:
            pass
        
        # Remove from session
        if 'promo_code' in request.session:
            del request.session['promo_code']
            request.session.modified = True
            
        return Response({
            'success': True,
            'message': 'Promo code removed successfully'
        })


class HeaderPromoBannerViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for retrieving header promotional banners."""
    queryset = HeaderPromoBanner.objects.filter(is_active=True).order_by('priority')
    serializer_class = HeaderPromoBannerSerializer
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get the currently active header promo banner."""
        banner = HeaderPromoBanner.objects.filter(is_active=True).order_by('priority').first()
        if banner:
            serializer = self.get_serializer(banner)
            return Response(serializer.data)
        return Response({}, status=status.HTTP_404_NOT_FOUND)


class HeroSlideViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for retrieving hero slides."""
    queryset = HeroSlide.objects.filter(is_active=True).order_by('priority')
    serializer_class = HeroSlideSerializer
    permission_classes = [permissions.AllowAny]


class NewArrivalsBannerViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for retrieving new arrivals banner."""
    queryset = NewArrivalsBanner.objects.filter(is_active=True)
    serializer_class = NewArrivalsBannerSerializer
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get the currently active new arrivals banner."""
        banner = NewArrivalsBanner.objects.filter(is_active=True).first()
        if banner:
            serializer = self.get_serializer(banner)
            return Response(serializer.data)
        return Response({}, status=status.HTTP_404_NOT_FOUND)


class SaleBannerViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for retrieving sale banner."""
    queryset = SaleBanner.objects.filter(is_active=True)
    serializer_class = SaleBannerSerializer
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get the currently active sale banner."""
        banner = SaleBanner.objects.filter(is_active=True).first()
        if banner:
            serializer = self.get_serializer(banner)
            return Response(serializer.data)
        return Response({}, status=status.HTTP_404_NOT_FOUND)


class CatalogTopBannerViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for retrieving catalog top banners."""
    queryset = CatalogTopBanner.objects.filter(is_active=True).order_by('priority')
    serializer_class = CatalogTopBannerSerializer
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get the currently active catalog top banner."""
        banner = CatalogTopBanner.objects.filter(is_active=True).order_by('priority').first()
        if banner:
            serializer = self.get_serializer(banner)
            return Response(serializer.data)
        return Response({}, status=status.HTTP_404_NOT_FOUND)


class CatalogBottomBannerViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for retrieving catalog bottom banners."""
    queryset = CatalogBottomBanner.objects.filter(is_active=True).order_by('priority')
    serializer_class = CatalogBottomBannerSerializer
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get the currently active catalog bottom banner."""
        banner = CatalogBottomBanner.objects.filter(is_active=True).order_by('priority').first()
        if banner:
            serializer = self.get_serializer(banner)
            return Response(serializer.data)
        return Response({}, status=status.HTTP_404_NOT_FOUND)
