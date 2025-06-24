from django.shortcuts import render
from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import Cart, CartItem, Order, OrderItem
from .serializers import (
    CartSerializer, CartItemSerializer,
    OrderSerializer, OrderCreateSerializer, OrderItemSerializer
)
from products.models import Product
from users.permissions import IsOwnerOrAdmin, IsUserOwnerOrAdmin
from notifications.services import SMSService
from shipping.services import ShippingService


class CartViewSet(viewsets.GenericViewSet):
    """ViewSet for managing shopping cart."""
    
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return the cart for the current user."""
        return Cart.objects.filter(user=self.request.user)
    
    def get_object(self):
        """Get or create a cart for the current user."""
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        return cart
    
    @action(detail=False, methods=['get'])
    def my_cart(self, request):
        """Get the current user's cart."""
        cart = self.get_object()
        serializer = self.get_serializer(cart)
         
        # Get cart data
        cart_data = serializer.data
         
        # Calculate shipping information
        cart_total = cart.total_price
         
        # Add shipping information
        cart_data['shipping_info'] = {
            'free_shipping_threshold': float(ShippingService.get_free_shipping_threshold()),
            'remaining_for_free_shipping': float(ShippingService.get_remaining_for_free_shipping(cart_total)),
            'default_shipping_cost': float(ShippingService.get_default_shipping_cost()),
            'is_eligible_for_free_shipping': cart_total >= ShippingService.get_free_shipping_threshold()
        }
         
        # Add promo code information from the cart model
        if cart.promo_code:
            cart_data['promo_code'] = {
                'code': cart.promo_code.code,
                'discount_amount': float(cart.discount_amount)
            }
             
            # Recalculate total with discount
            cart_data['discount_amount'] = float(cart.discount_amount)
            cart_data['total_after_discount'] = float(cart_total) - float(cart.discount_amount)
        # Fallback to session if no promo code in cart model
        elif 'promo_code' in request.session:
            promo_code_info = request.session.get('promo_code')
            cart_data['promo_code'] = promo_code_info
             
            # Recalculate total with discount
            discount_amount = promo_code_info['discount_amount']
            cart_data['discount_amount'] = discount_amount
            cart_data['total_after_discount'] = float(cart_total) - discount_amount
         
        return Response(cart_data)
    
    @action(detail=False, methods=['post'])
    def add_item(self, request):
        """Add an item to the cart."""
        cart = self.get_object()
        
        serializer = CartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        product_id = serializer.validated_data['product'].id
        quantity = serializer.validated_data.get('quantity', 1)
        emi_selected = serializer.validated_data.get('emi_selected', False)
        emi_period = serializer.validated_data.get('emi_period', 0)
        emi_plan = serializer.validated_data.get('emi_plan')
        emi_type = serializer.validated_data.get('emi_type')
        emi_bank = serializer.validated_data.get('emi_bank')
        variation = serializer.validated_data.get('variation')
        shipping_method = serializer.validated_data.get('shipping_method')
        
        # Check if product exists
        product = get_object_or_404(Product, id=product_id)
        
        # If variation is provided, check if it exists and belongs to the product
        if variation:
            if variation.product.id != product.id:
                return Response(
                    {'error': 'Variation does not belong to the selected product'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if variation is available
            if not variation.is_active or variation.stock_quantity < quantity:
                return Response(
                    {'error': 'Selected variation is not available in the requested quantity'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Check if product is available
            if not product.is_available or product.stock_quantity < quantity:
                return Response(
                    {'error': 'Product is not available in the requested quantity'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Check if EMI is available for this product
        if emi_selected and not product.emi_available:
            return Response(
                {'error': 'EMI is not available for this product'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if EMI plan is valid
        if emi_selected:
            # Get available EMI plans
            available_plans = product.emi_plans.all()
            
            if emi_plan and emi_plan not in available_plans:
                return Response(
                    {'error': 'Selected EMI plan is not available for this product'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            if emi_period:
                valid_periods = [plan.duration_months for plan in available_plans]
                
                if not valid_periods or emi_period not in valid_periods:
                    return Response(
                        {'error': f'Selected EMI period is not available. Valid options are: {", ".join(map(str, valid_periods))}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        
        # Add or update cart item
        try:
            # Try to find an existing cart item with the same product and variation
            cart_item = CartItem.objects.get(
                cart=cart, 
                product=product,
                variation=variation
            )
            # Update quantity and other fields
            cart_item.quantity = quantity
            cart_item.emi_selected = emi_selected
            cart_item.emi_period = emi_period if emi_selected else 0
            cart_item.emi_plan = emi_plan if emi_selected else None
            cart_item.emi_type = emi_type if emi_selected else None
            cart_item.emi_bank = emi_bank if emi_selected else None
            if shipping_method:
                cart_item.shipping_method = shipping_method
            cart_item.save()
            created = False
        except CartItem.DoesNotExist:
            # Create a new cart item
            cart_item = CartItem.objects.create(
                cart=cart,
                product=product,
                variation=variation,
                quantity=quantity,
                emi_selected=emi_selected,
                emi_period=emi_period if emi_selected else 0,
                emi_plan=emi_plan if emi_selected else None,
                emi_type=emi_type if emi_selected else None,
                emi_bank=emi_bank if emi_selected else None,
                shipping_method=shipping_method
            )
            created = True
        
        serializer = CartItemSerializer(cart_item, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def update_item(self, request, pk=None):
        """Update a cart item."""
        cart = self.get_object()
        item_id = request.data.get('item_id')
        
        if not item_id:
            return Response(
                {'error': 'Item ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            cart_item = CartItem.objects.get(id=item_id, cart=cart)
        except CartItem.DoesNotExist:
            return Response(
                {'error': 'Cart item not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = CartItemSerializer(cart_item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        quantity = serializer.validated_data.get('quantity', cart_item.quantity)
        emi_selected = serializer.validated_data.get('emi_selected', cart_item.emi_selected)
        emi_period = serializer.validated_data.get('emi_period', cart_item.emi_period)
        emi_type = serializer.validated_data.get('emi_type', cart_item.emi_type)
        emi_bank = serializer.validated_data.get('emi_bank', cart_item.emi_bank)
        
        # Check if product is available
        if not cart_item.product.is_available or cart_item.product.stock_quantity < quantity:
            return Response(
                {'error': 'Product is not available in the requested quantity'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if EMI is available for this product
        if emi_selected and not cart_item.product.emi_available:
            return Response(
                {'error': 'EMI is not available for this product'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if EMI plan is valid
        if emi_selected:
            # Get available EMI plans
            available_plans = cart_item.product.emi_plans.all()
            valid_periods = [plan.duration_months for plan in available_plans]
            
            if not valid_periods or emi_period not in valid_periods:
                return Response(
                    {'error': f'Selected EMI period is not available. Valid options are: {", ".join(map(str, valid_periods))}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        serializer.save()
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def remove_item(self, request):
        """Remove an item from the cart."""
        cart = self.get_object()
        item_id = request.data.get('item_id')
        
        if not item_id:
            return Response(
                {'error': 'Item ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            cart_item = CartItem.objects.get(id=item_id, cart=cart)
        except CartItem.DoesNotExist:
            return Response(
                {'error': 'Cart item not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        cart_item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['post'])
    def clear(self, request):
        """Clear the cart."""
        cart = self.get_object()
        cart.items.all().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class OrderViewSet(viewsets.ModelViewSet):
    """ViewSet for managing orders."""
    
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']  # Explicitly allow POST
    
    def get_queryset(self):
        """Return orders for the current user or all orders for admin."""
        user = self.request.user
        if user.is_staff or user.role == 'admin':
            return Order.objects.all()
        return Order.objects.filter(user=user)
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    def create(self, request, *args, **kwargs):
        """Create a new order."""
        print(f"DEBUG: Order create method called with data: {request.data}")
        try:
            # Extract EMI application data if present
            emi_application_data = request.data.get('emi_application_data')
            
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.context['request'] = request
            
            # Pass EMI application data to serializer context
            if emi_application_data:
                serializer.context['emi_application_data'] = emi_application_data
                
            order = serializer.save()  # Remove explicit user parameter
            
            # Send SMS notification for order confirmation
            SMSService.send_event_notification(
                event_type='order_created',
                user=order.user,
                context_data={
                    'order_id': order.id,
                    'amount': str(order.total_amount if hasattr(order, 'total_amount') else order.total),
                    'tracking_url': f"{request.scheme}://{request.get_host()}/orders/{order.id}"
                },
                related_object=order
            )
            
            print(f"DEBUG: Order created successfully: {order.id}")
            return Response(
                OrderSerializer(order, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            print(f"DEBUG: Error creating order: {str(e)}")
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an order."""
        order = self.get_object()
        
        # Check if order can be cancelled
        if order.status not in ['pending', 'processing']:
            return Response(
                {'error': 'Only pending or processing orders can be cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'cancelled'
        order.save()
        
        # Send SMS notification for order cancellation
        SMSService.send_event_notification(
            event_type='order_cancelled',
            user=order.user,
            context_data={
                'order_id': order.id
            },
            related_object=order
        )
        
        return Response({'status': 'Order cancelled'})
    
    def perform_update(self, serializer):
        """Update an order."""
        old_status = serializer.instance.status
        order = serializer.save()
        
        # Send SMS notification for status change
        if old_status != order.status:
            SMSService.send_event_notification(
                event_type='order_status_changed',
                user=order.user,
                context_data={
                    'order_id': order.id,
                    'status': order.get_status_display(),
                    'tracking_url': f"{self.request.scheme}://{self.request.get_host()}/orders/{order.id}"
                },
                related_object=order
            )
    
    @action(detail=False, methods=['get'])
    def my_orders(self, request):
        """Get orders for the current user."""
        orders = Order.objects.filter(user=request.user).order_by('-created_at')
        page = self.paginate_queryset(orders)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def tracking(self, request, pk=None):
        """Get order tracking information."""
        order = self.get_object()
        
        # Create tracking timeline based on order status
        tracking_events = []
        
        # Order placed event (always present)
        tracking_events.append({
            'status': 'placed',
            'title': 'Order Placed',
            'description': f'Your order #{order.order_id} has been placed successfully.',
            'timestamp': order.created_at.isoformat(),
            'completed': True
        })
        
        # Processing event
        if order.status in ['processing', 'shipped', 'delivered']:
            tracking_events.append({
                'status': 'processing',
                'title': 'Order Processing',
                'description': 'Your order is being prepared for shipment.',
                'timestamp': order.updated_at.isoformat() if order.status != 'pending' else None,
                'completed': order.status in ['processing', 'shipped', 'delivered']
            })
        
        # Shipped event
        if order.status in ['shipped', 'delivered']:
            tracking_events.append({
                'status': 'shipped',
                'title': 'Order Shipped',
                'description': 'Your order has been shipped and is on its way.',
                'timestamp': order.updated_at.isoformat() if order.status in ['shipped', 'delivered'] else None,
                'completed': order.status in ['shipped', 'delivered']
            })
        
        # Delivered event
        if order.status == 'delivered':
            tracking_events.append({
                'status': 'delivered',
                'title': 'Order Delivered',
                'description': 'Your order has been delivered successfully.',
                'timestamp': order.updated_at.isoformat(),
                'completed': True
            })
        
        # Cancelled event (if applicable)
        if order.status == 'cancelled':
            tracking_events.append({
                'status': 'cancelled',
                'title': 'Order Cancelled',
                'description': 'Your order has been cancelled.',
                'timestamp': order.updated_at.isoformat(),
                'completed': True
            })
        
        # Calculate estimated delivery date (if not delivered)
        estimated_delivery = None
        if order.status not in ['delivered', 'cancelled']:
            from datetime import timedelta
            # Estimate 3-7 days from order date
            estimated_delivery = (order.created_at + timedelta(days=5)).date().isoformat()
        
        return Response({
            'order_id': order.order_id,
            'status': order.status,
            'payment_status': order.payment_status,
            'tracking_events': tracking_events,
            'estimated_delivery': estimated_delivery,
            'shipping_address': {
                'address': order.shipping_address,
                'city': order.shipping_city,
                'state': order.shipping_state,
                'postal_code': order.shipping_postal_code,
                'phone': order.shipping_phone
            },
            'order_total': order.total,
            'created_at': order.created_at.isoformat(),
            'updated_at': order.updated_at.isoformat()
        })

    def get_object(self):
        lookup = self.kwargs.get(self.lookup_field)
        qs = self.get_queryset()
        if lookup.isdigit():
            return get_object_or_404(qs, pk=int(lookup))
        return get_object_or_404(qs, order_id=lookup)
