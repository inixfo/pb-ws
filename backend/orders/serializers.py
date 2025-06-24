from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Cart, CartItem, Order, OrderItem
from products.models import Product, ProductVariation
from products.serializers import ProductListSerializer, ProductVariationSerializer
from users.serializers import UserSerializer, AddressSerializer
from users.models import Address
from emi.models import EMIPlan, EMIRecord, EMIInstallment
from .serializers_minimal import OrderMinimalSerializer
from emi.serializers import EMIPlanSerializer

User = get_user_model()


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for cart items."""
    
    product = ProductListSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )
    variation = ProductVariationSerializer(read_only=True)
    variation_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductVariation.objects.all(),
        source='variation',
        write_only=True,
        required=False,
        allow_null=True
    )
    emi_plan_id = serializers.PrimaryKeyRelatedField(
        queryset=EMIPlan.objects.all(),
        source='emi_plan',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    # Read-only representation of the selected EMI plan so the frontend can
    # determine whether it is a card or cardless plan and its parameters.
    emi_plan = EMIPlanSerializer(read_only=True)
    
    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'product_id', 'variation', 'variation_id', 'quantity',
            'emi_selected', 'emi_period', 'emi_plan_id', 'emi_plan', 'emi_type', 'emi_bank',
            'shipping_method', 'total_price'
        ]
        read_only_fields = ['total_price']


class CartSerializer(serializers.ModelSerializer):
    """Serializer for shopping cart."""
    
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    promo_code_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = ['id', 'user', 'items', 'total_price', 'total_items', 'promo_code_info', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def get_promo_code_info(self, obj):
        """Get information about the applied promo code."""
        if not obj.promo_code:
            return None
        
        return {
            'code': obj.promo_code.code,
            'discount_amount': float(obj.discount_amount)
        }


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for order items."""
    
    product = ProductListSerializer(read_only=True)
    variation = serializers.PrimaryKeyRelatedField(read_only=True)
    emi_plan = EMIPlanSerializer(read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'variation', 'quantity', 'price', 'has_emi', 
                 'emi_plan', 'emi_type', 'emi_bank', 'total_price']
        read_only_fields = ['price', 'total_price']


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for orders."""
    
    items = OrderItemSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)
    promo_code_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_id', 'user', 'status', 'payment_status', 'payment_method',
            'shipping_address', 'shipping_city', 'shipping_state',
            'shipping_postal_code', 'shipping_phone',
            'subtotal', 'shipping_cost', 'tax', 'discount_amount', 'total',
            'promo_code_info',
            'has_emi', 'items',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['order_id', 'created_at', 'updated_at']
    
    def get_promo_code_info(self, obj):
        """Get information about the applied promo code."""
        if not obj.promo_code:
            return None
        
        return {
            'code': obj.promo_code.code,
            'discount_type': obj.promo_code.discount_type,
            'discount_value': obj.promo_code.discount_value,
            'discount_amount': obj.discount_amount
        }


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating orders."""
    
    address_id = serializers.PrimaryKeyRelatedField(
        write_only=True,
        queryset=Address.objects.all(),
        required=False
    )
    
    promo_code = serializers.CharField(write_only=True, required=False)
    shipping_phone = serializers.CharField(required=True, help_text="Required for SMS notifications")
    
    class Meta:
        model = Order
        fields = [
            'payment_method', 'address_id',
            'shipping_address', 'shipping_city', 'shipping_state',
            'shipping_postal_code', 'shipping_phone',
            'has_emi', 'promo_code'
        ]
    
    def validate(self, data):
        """Validate order data."""
        # If address_id is provided, use it to fill shipping information
        address_id = data.pop('address_id', None)
        if address_id:
            address = address_id
            data['shipping_address'] = address.address_line1
            if address.address_line2:
                data['shipping_address'] += f"\n{address.address_line2}"
            data['shipping_city'] = address.city
            data['shipping_state'] = address.state
            data['shipping_postal_code'] = address.postal_code
            data['shipping_phone'] = address.phone
        
        # Ensure all required shipping fields are provided
        required_fields = [
            'shipping_address', 'shipping_city', 'shipping_state',
            'shipping_postal_code', 'shipping_phone'
        ]
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            raise serializers.ValidationError(
                f"Missing required shipping fields: {', '.join(missing_fields)}"
            )
        
        # Validate phone number format
        phone = data.get('shipping_phone', '')
        cleaned_phone = ''.join(filter(str.isdigit, phone))
        if len(cleaned_phone) < 10:
            raise serializers.ValidationError({
                'shipping_phone': 'Phone number must be at least 10 digits'
            })
        
        # Validate promo code if provided
        promo_code_str = data.pop('promo_code', None)
        if promo_code_str:
            try:
                from promotions.models import PromoCode
                promo_code = PromoCode.objects.get(code=promo_code_str, is_active=True)
                
                if not promo_code.is_valid:
                    raise serializers.ValidationError({"promo_code": "This promo code is no longer valid"})
                
                # Store promo code for later use in create method
                self.context['promo_code'] = promo_code
            except PromoCode.DoesNotExist:
                raise serializers.ValidationError({"promo_code": "Invalid promo code"})
        
        return data
    
    def create(self, validated_data):
        """Create a new order from cart items."""
        user = self.context['request'].user
        
        # Get user's cart
        try:
            cart = Cart.objects.get(user=user)
        except Cart.DoesNotExist:
            raise serializers.ValidationError("User has no items in cart")
        
        # Check if cart has items
        if cart.items.count() == 0:
            raise serializers.ValidationError("Cart is empty")
        
        # Calculate order totals
        subtotal = cart.total_price
        shipping_cost = 0  # Can be calculated based on business logic
        tax = 0  # No tax calculation
        
        # Apply promo code if available
        discount_amount = 0
        promo_code = self.context.get('promo_code')
        
        if promo_code:
            discount_amount = promo_code.calculate_discount(subtotal)
            
            # Check if discount is valid
            if discount_amount <= 0:
                promo_code = None
        
        # Calculate EMI interest if applicable
        emi_interest = 0
        has_cardless_emi = False
        
        for cart_item in cart.items.all():
            if cart_item.emi_selected and cart_item.emi_plan:
                if cart_item.emi_plan.plan_type == 'cardless_emi':
                    has_cardless_emi = True
                    # Calculate interest for cardless EMI
                    calculation = cart_item.emi_plan.calculate_monthly_payment(
                        cart_item.total_price,
                        cart_item.emi_period or cart_item.emi_plan.duration_months
                    )
                    emi_interest += calculation['total_interest']
        
        # Calculate final total with EMI interest
        total = subtotal + shipping_cost + tax - discount_amount + emi_interest
        
        # Check if cart has EMI items
        has_emi = any(item.emi_selected for item in cart.items.all())
        
        # Remove has_emi from validated_data to avoid duplicate keyword argument
        validated_data.pop('has_emi', None)
        
        # Create order
        order = Order.objects.create(
            user=user,
            status='pending',
            payment_status='pending',
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            tax=tax,
            discount_amount=discount_amount,
            promo_code=promo_code,
            total=total,
            has_emi=has_emi,
            **validated_data
        )
        
        # Create order items from cart items
        for cart_item in cart.items.all():
            # Use variation price if available, otherwise use product price
            if cart_item.variation:
                price = cart_item.variation.price
            else:
                price = cart_item.product.sale_price if cart_item.product.sale_price else cart_item.product.price
                
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                variation=cart_item.variation,
                quantity=cart_item.quantity,
                price=price,
                has_emi=cart_item.emi_selected,
                emi_plan=cart_item.emi_plan if cart_item.emi_selected else None,
                emi_type=cart_item.emi_type if cart_item.emi_selected else None,
                emi_bank=cart_item.emi_bank if cart_item.emi_selected else None
            )
        
        # Record promo code usage if applied
        if promo_code:
            from promotions.models import PromoCodeUsage
            PromoCodeUsage.objects.create(
                promo_code=promo_code,
                user=user,
                order=order,
                discount_amount=discount_amount
            )
            
            # Increment usage count
            promo_code.use()
        
        # Create EMI applications for EMI items
        self._create_emi_applications(order, cart)
        
        # Clear cart after order is created
        cart.items.all().delete()
        
        return order 
    
    def _create_emi_applications(self, order, cart):
        """Create EMI applications for EMI items in the order."""
        from emi.models import EMIApplication
        
        # Get EMI application data from context if available
        emi_application_data = self.context.get('emi_application_data')
        
        # Get EMI items from cart
        emi_items = cart.items.filter(emi_selected=True)
        
        for cart_item in emi_items:
            if cart_item.emi_plan:
                try:
                    # Calculate EMI details
                    emi_plan = cart_item.emi_plan
                    product_price = cart_item.total_price
                    
                    # Calculate EMI amounts
                    calculation = emi_plan.calculate_monthly_payment(
                        product_price, 
                        cart_item.emi_period or emi_plan.duration_months
                    )
                    
                    # For Cardless EMI, create an application that requires admin review
                    if emi_plan.plan_type == 'cardless_emi':
                        # Use provided EMI application data or defaults
                        if emi_application_data:
                            employment_type = 'salaried'  # Default based on provided job title
                            monthly_income = emi_application_data.get('monthly_salary', 0)
                            job_title = emi_application_data.get('job_title', '')
                            nid_front_image = emi_application_data.get('nid_front_image')
                            nid_back_image = emi_application_data.get('nid_back_image')
                        else:
                            employment_type = 'salaried'
                            monthly_income = 0
                            job_title = ''
                            nid_front_image = None
                            nid_back_image = None
                        
                        # Create EMI application for admin review
                        application = EMIApplication.objects.create(
                            user=order.user,
                            order=order,
                            emi_plan=emi_plan,
                            tenure_months=cart_item.emi_period or emi_plan.duration_months,
                            product_price=product_price,
                            down_payment=calculation['down_payment'],
                            principal_amount=calculation['principal'],
                            processing_fee=calculation['processing_fee'],
                            monthly_installment=calculation['monthly_payment'],
                            total_payable=calculation['total_payment'],
                            total_interest=calculation['total_interest'],
                            employment_type=employment_type,
                            job_title=job_title,
                            monthly_income=monthly_income,
                            nid_number='',  # Will be extracted from documents
                            nid_front_image=nid_front_image,
                            nid_back_image=nid_back_image,
                            status='pending',  # Always pending for cardless EMI
                            admin_notes='Pending admin review for Cardless EMI application'
                        )
                        
                        # Send notification about application submission
                        from notifications.services import SMSService
                        SMSService.send_event_notification(
                            event_type='emi_application_submitted',
                            user=order.user,
                            context_data={
                                'order_id': order.id,
                                'application_id': application.id
                            },
                            related_object=application
                        )
                    
                    # For Card EMI, auto-approve and create EMI record immediately
                    elif emi_plan.plan_type == 'card_emi' and emi_plan.is_sslcommerz_emi:
                        # Auto-approve card EMI applications
                        application = EMIApplication.objects.create(
                            user=order.user,
                            order=order,
                            emi_plan=emi_plan,
                            tenure_months=cart_item.emi_period or emi_plan.duration_months,
                            product_price=product_price,
                            down_payment=calculation['down_payment'],
                            principal_amount=calculation['principal'],
                            processing_fee=calculation['processing_fee'],
                            monthly_installment=calculation['monthly_payment'],
                            total_payable=calculation['total_payment'],
                            total_interest=calculation['total_interest'],
                            employment_type='not_required',  # Not required for card EMI
                            monthly_income=0,  # Not required for card EMI
                            nid_number='not_required',  # Not required for card EMI
                            status='approved',  # Auto-approve
                            approved_at=timezone.now(),
                            admin_notes='Auto-approved for SSLCOMMERZ Card EMI'
                        )
                        
                        # Create EMI record immediately
                        from emi.models import EMIRecord
                        emi_record = EMIRecord.objects.create(
                            user=order.user,
                            order=order,
                            application=application,
                            emi_plan=emi_plan,
                            tenure_months=application.tenure_months,
                            principal_amount=application.principal_amount,
                            monthly_installment=application.monthly_installment,
                            total_payable=application.total_payable,
                            remaining_amount=application.total_payable,
                            down_payment_paid=False  # Will be updated when payment is processed
                        )
                        
                        # Generate installments
                        emi_record.generate_installments()
                        
                except Exception as e:
                    # Log error but don't fail order creation
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Failed to create EMI application for order {order.id}: {str(e)}") 