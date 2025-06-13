from rest_framework import serializers
from .models import Payment, Transaction


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'order', 'user', 'transaction_id', 'amount', 'payment_method',
            'status', 'payment_details', 'created_at', 'updated_at'
        ]
        read_only_fields = ['transaction_id', 'status', 'payment_details']


class TransactionSerializer(serializers.ModelSerializer):
    order_id = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            'id', 'user', 'transaction_type', 'amount', 'payment',
            'created_at', 'order_id'
        ]
        read_only_fields = ['transaction_type', 'amount', 'payment']

    def get_order_id(self, obj):
        if hasattr(obj, 'payment') and obj.payment and hasattr(obj.payment, 'order'):
            return obj.payment.order.id
        return None 