from rest_framework import serializers
from django.utils import timezone
from users.serializers import UserMinimalSerializer
from orders.serializers_minimal import OrderMinimalSerializer
from .models import EMIPlan, EMIApplication, EMIRecord, EMIInstallment


class EMIPlanSerializer(serializers.ModelSerializer):
    """Serializer for EMI plans."""
    
    # Add an emi_type field for backwards compatibility with frontend
    emi_type = serializers.SerializerMethodField()
    plan_name = serializers.CharField(source='name', read_only=True)  # For backwards compatibility
    
    class Meta:
        model = EMIPlan
        fields = [
            'id', 'name', 'plan_name', 'description', 'plan_type', 'emi_type',
            'is_sslcommerz_emi', 'sslcommerz_bank_list', 'sslcommerz_bank_id',
            'duration_months', 'interest_rate', 
            'min_price', 'max_price',
            'down_payment_percentage', 'processing_fee_percentage',
            'processing_fee_fixed', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_emi_type(self, obj):
        """Map plan_type to emi_type for backwards compatibility."""
        # Map new plan_type values to old emi_type values
        mapping = {
            'card_emi': 'normal',
            'cardless_emi': 'cardless'
        }
        return mapping.get(obj.plan_type, 'normal')

    def to_representation(self, instance):
        """Add calculated fields for frontend display."""
        representation = super().to_representation(instance)
        
        # Add additional fields for frontend compatibility
        representation['requires_nid'] = self.get_emi_type(instance) == 'cardless'
        
        # Get product price from context if available
        product_price = self.context.get('product_price', None)
        if product_price:
            # Calculate EMI details for this product price
            emi_details = instance.calculate_monthly_payment(product_price, instance.duration_months)
            representation['monthly_installment'] = round(emi_details['monthly_payment'], 2)
            representation['down_payment'] = round(emi_details['down_payment'], 2)
            representation['total_payable_with_emi'] = round(emi_details['total_payment'], 2)
            representation['total_interest'] = round(emi_details['total_interest'], 2)
        
        return representation


class EMICalculationSerializer(serializers.Serializer):
    """Serializer for EMI calculation requests."""
    
    product_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    tenure_months = serializers.IntegerField(min_value=1)
    emi_plan_id = serializers.IntegerField()
    
    def validate(self, data):
        """Validate that the EMI plan exists and tenure is within range."""
        try:
            emi_plan = EMIPlan.objects.get(id=data['emi_plan_id'], is_active=True)
        except EMIPlan.DoesNotExist:
            raise serializers.ValidationError("Invalid or inactive EMI plan")
        
        # Check if tenure is reasonable (e.g., between 1 and 60 months)
        if data['tenure_months'] < 1 or data['tenure_months'] > 60:
            raise serializers.ValidationError(
                f"Tenure must be between 1 and 60 months"
            )
        
        if data['product_price'] < emi_plan.min_price:
            raise serializers.ValidationError(
                f"Product price must be at least {emi_plan.min_price}"
            )
        
        if emi_plan.max_price and data['product_price'] > emi_plan.max_price:
            raise serializers.ValidationError(
                f"Product price must not exceed {emi_plan.max_price}"
            )
        
        # Add EMI plan to validated data
        data['emi_plan'] = emi_plan
        return data


class EMIInstallmentSerializer(serializers.ModelSerializer):
    """Serializer for EMI installments."""
    
    # Add associated order ID and EMI record details for easier consumption in the
    # front-end without requiring additional API round-trips.
    order_id = serializers.SerializerMethodField()
    emi_record_id = serializers.IntegerField(source='emi_record.id', read_only=True)

    def get_order_id(self, obj):
        try:
            return obj.emi_record.order.id
        except Exception:
            return None

    class Meta:
        model = EMIInstallment
        # We expose all model fields plus the enriched helper fields above.
        fields = list(f.name for f in EMIInstallment._meta.get_fields() if f.concrete) + [
            'order_id',
            'emi_record_id',
        ]
        read_only_fields = ['emi_record', 'installment_number', 'amount', 'due_date']


class EMIApplicationSerializer(serializers.ModelSerializer):
    """Serializer for EMI applications."""
    
    user = UserMinimalSerializer(read_only=True)
    order = OrderMinimalSerializer(read_only=True)
    emi_plan = EMIPlanSerializer(read_only=True)
    
    class Meta:
        model = EMIApplication
        fields = '__all__'


class EMIRecordSerializer(serializers.ModelSerializer):
    """Serializer for EMI records."""
    
    user = UserMinimalSerializer(read_only=True)
    order = OrderMinimalSerializer(read_only=True)
    application = EMIApplicationSerializer(read_only=True)
    emi_plan = EMIPlanSerializer(read_only=True)
    
    class Meta:
        model = EMIRecord
        fields = '__all__'


class EMIRecordDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for EMI records with installments."""
    
    user = UserMinimalSerializer(read_only=True)
    order = OrderMinimalSerializer(read_only=True)
    application = EMIApplicationSerializer(read_only=True)
    emi_plan = EMIPlanSerializer(read_only=True)
    installments = EMIInstallmentSerializer(many=True, read_only=True)
    
    # Add calculated fields
    next_installment = serializers.SerializerMethodField()
    overdue_installments = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = EMIRecord
        fields = '__all__'
    
    def get_next_installment(self, obj):
        """Get the next unpaid installment."""
        next_installment = obj.installments.filter(status='pending').order_by('installment_number').first()
        if next_installment:
            return EMIInstallmentSerializer(next_installment).data
        return None
    
    def get_overdue_installments(self, obj):
        """Get overdue installments."""
        overdue = obj.installments.filter(
            status='pending',
            due_date__lt=timezone.now().date()
        ).order_by('installment_number')
        return EMIInstallmentSerializer(overdue, many=True).data
    
    def get_progress_percentage(self, obj):
        """Calculate payment progress percentage."""
        if obj.total_payable > 0:
            return round((obj.amount_paid / obj.total_payable) * 100, 2)
        return 0


class EMIApplicationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating EMI applications."""
    
    class Meta:
        model = EMIApplication
        exclude = ['created_at', 'updated_at', 'approved_at', 'status', 'admin_notes', 'rejection_reason']
        read_only_fields = ['user']
    
    def create(self, validated_data):
        """Create a new EMI application."""
        user = self.context['request'].user
        validated_data['user'] = user
        validated_data['status'] = 'pending'
        return super().create(validated_data)


class EMIApplicationAdminSerializer(serializers.ModelSerializer):
    """Serializer for admin actions on EMI applications."""
    
    class Meta:
        model = EMIApplication
        fields = [
            'id', 'status', 'admin_notes', 'rejection_reason'
        ]
    
    def validate(self, data):
        """Validate admin actions."""
        status = data.get('status')
        rejection_reason = data.get('rejection_reason')
        
        if status == 'rejected' and not rejection_reason:
            raise serializers.ValidationError("Rejection reason is required when rejecting an application")
        
        return data
    
    def update(self, instance, validated_data):
        """Update application status and handle approval/rejection."""
        status = validated_data.get('status')
        old_status = instance.status
        
        # Update instance with validated data
        instance = super().update(instance, validated_data)
        
        # Handle status change to approved
        if status == 'approved' and old_status != 'approved':
            instance.approved_at = timezone.now()
            instance.save()
            instance.approve()
        
        return instance 