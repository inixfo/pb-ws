from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from django.db import transaction
from datetime import datetime, timedelta
from decimal import Decimal
from rest_framework.permissions import IsAuthenticated

from .models import EMIPlan, EMIApplication, EMIRecord, EMIInstallment
from .serializers import (
    EMIPlanSerializer, EMICalculationSerializer, EMIApplicationSerializer,
    EMIApplicationCreateSerializer, EMIApplicationAdminSerializer,
    EMIRecordSerializer, EMIInstallmentSerializer, EMIRecordDetailSerializer
)
from .permissions import IsAdminOrOwnerReadOnly, EMIPermission
from notifications.services import SMSService
from products.models import Product
import logging

logger = logging.getLogger(__name__)


class EMIPlanViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for EMI plans."""
    
    queryset = EMIPlan.objects.filter(is_active=True)
    serializer_class = EMIPlanSerializer
    permission_classes = [EMIPermission]
    
    def get_queryset(self):
        """Filter EMI plans based on query parameters."""
        queryset = super().get_queryset()
        
        # Filter by plan type
        plan_type = self.request.query_params.get('plan_type')
        if plan_type:
            queryset = queryset.filter(plan_type=plan_type)
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        
        if min_price:
            try:
                min_price = float(min_price)
                queryset = queryset.filter(min_price__lte=min_price)
            except ValueError:
                pass
        
        if max_price:
            try:
                max_price = float(max_price)
                queryset = queryset.filter(
                    Q(max_price__isnull=True) | Q(max_price__gte=max_price)
                )
            except ValueError:
                pass
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def available_banks(self, request):
        """Get list of available banks for EMI"""
        banks = [
            {"code": "DBBL", "name": "Dutch-Bangla Bank", "interest_rate": 12.5},
            {"code": "EBLC", "name": "Eastern Bank", "interest_rate": 13.0},
            {"code": "BCBL", "name": "Bangladesh Commerce Bank", "interest_rate": 11.5},
            {"code": "BBL", "name": "BRAC Bank", "interest_rate": 12.0},
            {"code": "ABBL", "name": "AB Bank", "interest_rate": 13.5},
            {"code": "MTBL", "name": "Mutual Trust Bank", "interest_rate": 12.0},
            {"code": "SCB", "name": "Standard Chartered Bank", "interest_rate": 11.0},
            {"code": "CITI", "name": "Citibank", "interest_rate": 10.5},
            {"code": "EBL", "name": "Eastern Bank Limited", "interest_rate": 12.5},
            {"code": "HSBC", "name": "HSBC Bank", "interest_rate": 11.5}
        ]
        
        return Response({
            'status': 'success',
            'banks': banks,
            'count': len(banks)
        })
    
    @action(detail=False, methods=['get'])
    def calculate_emi(self, request):
        """Calculate EMI details for a plan"""
        try:
            plan_id = request.query_params.get('plan_id')
            product_price = request.query_params.get('product_price')
            bank_code = request.query_params.get('bank_code')
            
            if not plan_id or not product_price:
                return Response({
                    'error': 'plan_id and product_price are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                plan = EMIPlan.objects.get(id=plan_id, is_active=True)
                price = Decimal(str(product_price))
            except (EMIPlan.DoesNotExist, ValueError):
                return Response({
                    'error': 'Invalid plan_id or product_price'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Calculate EMI details
            down_payment = price * (plan.down_payment_percentage / 100)
            financed_amount = price - down_payment
            
            # Get interest rate (from bank if provided, otherwise use plan rate)
            interest_rate = plan.interest_rate
            if bank_code:
                # This would typically come from a bank configuration
                bank_rates = {
                    'DBBL': 12.5, 'EBLC': 13.0, 'BCBL': 11.5, 'BBL': 12.0,
                    'ABBL': 13.5, 'MTBL': 12.0, 'SCB': 11.0, 'CITI': 10.5,
                    'EBL': 12.5, 'HSBC': 11.5
                }
                interest_rate = bank_rates.get(bank_code, plan.interest_rate)
            
            # Calculate interest and monthly installment
            monthly_interest_rate = interest_rate / 100 / 12
            if monthly_interest_rate > 0:
                monthly_installment = financed_amount * (
                    monthly_interest_rate * (1 + monthly_interest_rate) ** plan.duration_months
                ) / ((1 + monthly_interest_rate) ** plan.duration_months - 1)
            else:
                monthly_installment = financed_amount / plan.duration_months
            
            total_payment = monthly_installment * plan.duration_months
            total_interest = total_payment - financed_amount
            
            return Response({
                'status': 'success',
                'details': {
                    'plan_name': plan.plan_name,
                    'duration_months': plan.duration_months,
                    'product_price': float(price),
                    'down_payment': float(down_payment),
                    'down_payment_percentage': plan.down_payment_percentage,
                    'financed_amount': float(financed_amount),
                    'interest_rate': interest_rate,
                    'monthly_installment': float(monthly_installment),
                    'total_payment': float(total_payment),
                    'total_interest': float(total_interest),
                    'total_payable': float(price + total_interest),
                    'bank_code': bank_code
                }
            })
            
        except Exception as e:
            logger.error(f"Error calculating EMI: {e}")
            return Response({
                'error': 'Error calculating EMI details'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EMIApplicationViewSet(viewsets.ModelViewSet):
    """ViewSet for EMI applications."""
    
    queryset = EMIApplication.objects.all()
    serializer_class = EMIApplicationSerializer
    permission_classes = [EMIPermission]
    
    def get_queryset(self):
        logger.info(f"EMIApplicationViewSet - User: {self.request.user}")
        logger.info(f"EMIApplicationViewSet - Is authenticated: {self.request.user.is_authenticated}")
        
        if self.request.user.is_staff or self.request.user.is_superuser:
            return EMIApplication.objects.all()
        elif self.request.user.is_authenticated:
            return EMIApplication.objects.filter(user=self.request.user)
        else:
            # Try to authenticate via Authorization header (e.g., if SessionAuth failed)
            auth_header = self.request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                try:
                    from rest_framework_simplejwt.authentication import JWTAuthentication
                    jwt_auth = JWTAuthentication()
                    token = jwt_auth.get_validated_token(auth_header.replace('Bearer ', ''))
                    user = jwt_auth.get_user(token)
                    if user:
                        return EMIApplication.objects.filter(user=user)
                except Exception as e:
                    logger.error(f"EMIApplicationViewSet get_queryset JWT fallback failed: {e}")
                    # Fall through to empty
            # For development, return empty queryset to avoid 403 when anonymous
            return EMIApplication.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return EMIApplicationCreateSerializer
        return EMIApplicationSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        """Approve an EMI application (Admin only)"""
        try:
            # Check if user is admin
            if not (request.user.is_staff or request.user.is_superuser):
                return Response({
                    'error': 'Only admin users can approve applications'
                }, status=status.HTTP_403_FORBIDDEN)
                
            application = self.get_object()
            admin_notes = request.data.get('admin_notes', '')
            
            with transaction.atomic():
                # Update application status
                application.status = 'approved'
                application.admin_notes = admin_notes
                application.approved_at = datetime.now()
                application.save()
                
                # Create EMI record
                emi_record = EMIRecord.objects.create(
                    user=application.user,
                    emi_plan=application.emi_plan,
                    order=application.order,
                    product_price=application.product_price,
                    down_payment=application.down_payment,
                    financed_amount=application.financed_amount,
                    monthly_installment=application.monthly_installment,
                    total_amount=application.total_amount,
                    interest_rate=application.interest_rate,
                    status='active'
                )
                
                # Generate installments
                emi_record.generate_installments()
            
            return Response({
                'status': 'success',
                'message': 'EMI application approved successfully',
                'emi_record_id': emi_record.id
            })
            
        except Exception as e:
            logger.error(f"Error approving EMI application: {e}")
            return Response({
                'error': 'Error approving application'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        """Reject an EMI application (Admin only)"""
        try:
            # Check if user is admin
            if not (request.user.is_staff or request.user.is_superuser):
                return Response({
                    'error': 'Only admin users can reject applications'
                }, status=status.HTTP_403_FORBIDDEN)
                
            application = self.get_object()
            rejection_reason = request.data.get('rejection_reason', '')
            admin_notes = request.data.get('admin_notes', '')
            
            application.status = 'rejected'
            application.rejection_reason = rejection_reason
            application.admin_notes = admin_notes
            application.save()
            
            return Response({
                'status': 'success',
                'message': 'EMI application rejected successfully'
            })
            
        except Exception as e:
            logger.error(f"Error rejecting EMI application: {e}")
            return Response({
                'error': 'Error rejecting application'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EMIRecordViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for EMI records."""
    
    queryset = EMIRecord.objects.all()
    serializer_class = EMIRecordSerializer
    permission_classes = [EMIPermission]
    
    def get_queryset(self):
        logger.info(f"EMIRecordViewSet - User: {self.request.user}")
        logger.info(f"EMIRecordViewSet - Is authenticated: {self.request.user.is_authenticated}")
        
        if self.request.user.is_staff or self.request.user.is_superuser:
            return EMIRecord.objects.all()
        elif self.request.user.is_authenticated:
            return EMIRecord.objects.filter(user=self.request.user)
        else:
            # Attempt JWT fallback similar to EMIApplicationViewSet
            auth_header = self.request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                try:
                    from rest_framework_simplejwt.authentication import JWTAuthentication
                    jwt_auth = JWTAuthentication()
                    token = jwt_auth.get_validated_token(auth_header.replace('Bearer ', ''))
                    user = jwt_auth.get_user(token)
                    if user:
                        return EMIRecord.objects.filter(user=user)
                except Exception as e:
                    logger.error(f"EMIRecordViewSet get_queryset JWT fallback failed: {e}")
            return EMIRecord.objects.none()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'retrieve':
            return EMIRecordDetailSerializer
        return EMIRecordSerializer
    
    @action(detail=True, methods=['get'])
    def installments(self, request, pk=None):
        """Get installments for a specific EMI record."""
        emi_record = self.get_object()
        installments = emi_record.installments.all().order_by('due_date')
        serializer = EMIInstallmentSerializer(installments, many=True)
        return Response({
            'status': 'success',
            'installments': serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def next_installment(self, request, pk=None):
        """Get the next due installment"""
        emi_record = self.get_object()
        next_installment = emi_record.installments.filter(
            status='pending'
        ).order_by('due_date').first()
        
        if next_installment:
            serializer = EMIInstallmentSerializer(next_installment)
            return Response({
                'status': 'success',
                'installment': serializer.data
            })
        else:
            return Response({
                'status': 'success',
                'installment': None,
                'message': 'No pending installments found'
            })
    
    @action(detail=True, methods=['get'])
    def overdue_installments(self, request, pk=None):
        """Get overdue installments"""
        emi_record = self.get_object()
        overdue_installments = emi_record.installments.filter(
            status='pending',
            due_date__lt=datetime.now().date()
        ).order_by('due_date')
        
        serializer = EMIInstallmentSerializer(overdue_installments, many=True)
        return Response({
            'status': 'success',
            'overdue_installments': serializer.data
        })

    @action(detail=True, methods=['post'])
    def process_down_payment(self, request, pk=None):
        """Process down-payment or pay remaining balance for an EMI record."""
        try:
            emi_record: EMIRecord = self.get_object()

            pay_full = bool(request.data.get('pay_full'))
            payment_method = request.data.get('payment_method', 'ONLINE')

            # For sandbox we simply mark payments as done without gateway
            if pay_full:
                # mark all pending installments paid
                pending_installments = emi_record.installments.filter(status__in=['pending', 'due', 'overdue'])
                for inst in pending_installments:
                    inst.mark_as_paid(inst.amount, payment_method=payment_method, transaction_id='FULLPAY')
                emi_record.down_payment_paid = True
                emi_record.status = 'completed'
                emi_record.completed_date = datetime.now().date()
                emi_record.update_payment_status()
            else:
                # Initiate payment via existing payments API
                from payments.views import initiate_sslcommerz_payment
                from rest_framework.test import APIRequestFactory

                factory = APIRequestFactory()
                dummy_request = factory.post(
                    '/api/payments/initiate-sslcommerz/',
                    {
                        'order_id': emi_record.order.id,
                        'amount': float(emi_record.remaining_amount),
                        'transaction_type': 'INSTALLMENT_PAYMENT',
                        'installment_id': 0,  # signifies full payment of record
                    },
                    format='json'
                )
                dummy_request.user = request.user
                return initiate_sslcommerz_payment(dummy_request)

            return Response({'status': 'success', 'redirected': False})
        except Exception as e:
            logger.error(f"Error processing down payment: {e}")
            return Response({'error': 'Error processing payment'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EMIInstallmentViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for EMI installments (read-only)."""
    
    queryset = EMIInstallment.objects.all()
    serializer_class = EMIInstallmentSerializer
    permission_classes = [EMIPermission]
    
    def get_queryset(self):
        if self.request.user.is_staff or self.request.user.is_superuser:
            return EMIInstallment.objects.all()
        elif self.request.user.is_authenticated:
            return EMIInstallment.objects.filter(emi_record__user=self.request.user)
        else:
            return EMIInstallment.objects.none()
    
    @action(detail=True, methods=['post'])
    def pay_online(self, request, pk=None):
        """Process online payment for an installment"""
        try:
            installment = self.get_object()
            payment_method = request.data.get('payment_method', 'SSLCOMMERZ')
            
            # Here you would integrate with payment gateway
            # For now, we'll just mark as paid
            
            installment.status = 'paid'
            installment.paid_date = datetime.now().date()
            installment.payment_method = payment_method
            installment.save()
            
            # Check if this was the last installment
            emi_record = installment.emi_record
            remaining_installments = emi_record.installments.filter(status='pending').count()
            
            if remaining_installments == 0:
                emi_record.status = 'completed'
                emi_record.completed_at = datetime.now()
                emi_record.save()
            
            return Response({
                'status': 'success',
                'message': 'Payment processed successfully',
                'installment_id': installment.id,
                'emi_completed': remaining_installments == 0
            })
            
        except Exception as e:
            logger.error(f"Error processing installment payment: {e}")
            return Response({
                'error': 'Error processing payment'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EMIDashboardView(APIView):
    """API view for EMI dashboard."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get EMI dashboard data for the current user."""
        user = request.user
        
        # For admin users, return overall statistics
        if user.is_staff:
            return self._get_admin_dashboard()
        
        # For regular users, return their EMI statistics
        return self._get_user_dashboard(user)
    
    def _get_admin_dashboard(self):
        """Get EMI dashboard data for admin users."""
        # Get application statistics
        applications = EMIApplication.objects.all()
        applications_pending = applications.filter(status='pending').count()
        applications_approved = applications.filter(status='approved').count()
        applications_rejected = applications.filter(status='rejected').count()
        
        # Get EMI record statistics
        records = EMIRecord.objects.all()
        records_active = records.filter(status='active').count()
        records_completed = records.filter(status='completed').count()
        records_defaulted = records.filter(status='defaulted').count()
        
        # Get installment statistics
        installments = EMIInstallment.objects.all()
        installments_pending = installments.filter(status='pending').count()
        installments_due = installments.filter(status='due').count()
        installments_overdue = installments.filter(status='overdue').count()
        installments_paid = installments.filter(status='paid').count()
        
        # Get recent applications
        recent_applications = EMIApplication.objects.order_by('-created_at')[:5]
        recent_applications_data = EMIApplicationSerializer(recent_applications, many=True).data
        
        # Get upcoming installments
        today = timezone.now().date()
        upcoming_installments = EMIInstallment.objects.filter(
            status__in=['pending', 'due'],
            due_date__gte=today
        ).order_by('due_date')[:10]
        upcoming_installments_data = EMIInstallmentSerializer(upcoming_installments, many=True).data
        
        # Get overdue installments
        overdue_installments = EMIInstallment.objects.filter(
            status='overdue'
        ).order_by('due_date')[:10]
        overdue_installments_data = EMIInstallmentSerializer(overdue_installments, many=True).data
        
        return Response({
            'applications': {
                'total': applications.count(),
                'pending': applications_pending,
                'approved': applications_approved,
                'rejected': applications_rejected,
                'recent': recent_applications_data
            },
            'records': {
                'total': records.count(),
                'active': records_active,
                'completed': records_completed,
                'defaulted': records_defaulted
            },
            'installments': {
                'total': installments.count(),
                'pending': installments_pending,
                'due': installments_due,
                'overdue': installments_overdue,
                'paid': installments_paid,
                'upcoming': upcoming_installments_data,
                'overdue': overdue_installments_data
            }
        })
    
    def _get_user_dashboard(self, user):
        """Get EMI dashboard data for regular users."""
        # Get user's applications
        applications = EMIApplication.objects.filter(user=user)
        
        # Get user's active EMI records
        records = EMIRecord.objects.filter(user=user)
        active_records = records.filter(status='active')
        
        # Get upcoming installments
        today = timezone.now().date()
        upcoming_installments = EMIInstallment.objects.filter(
            emi_record__user=user,
            status__in=['pending', 'due'],
            due_date__gte=today
        ).order_by('due_date')[:5]
        upcoming_installments_data = EMIInstallmentSerializer(upcoming_installments, many=True).data
        
        # Get overdue installments
        overdue_installments = EMIInstallment.objects.filter(
            emi_record__user=user,
            status='overdue'
        ).order_by('due_date')
        overdue_installments_data = EMIInstallmentSerializer(overdue_installments, many=True).data
        
        # Get recent applications
        recent_applications = applications.order_by('-created_at')[:3]
        recent_applications_data = EMIApplicationSerializer(recent_applications, many=True).data
        
        # Get active EMI records
        active_records_data = EMIRecordSerializer(active_records, many=True).data
        
        return Response({
            'applications': {
                'total': applications.count(),
                'pending': applications.filter(status='pending').count(),
                'approved': applications.filter(status='approved').count(),
                'rejected': applications.filter(status='rejected').count(),
                'recent': recent_applications_data
            },
            'records': {
                'total': records.count(),
                'active': active_records.count(),
                'completed': records.filter(status='completed').count(),
                'active_records': active_records_data
            },
            'installments': {
                'upcoming': upcoming_installments_data,
                'overdue': overdue_installments_data,
                'overdue_count': overdue_installments.count()
            }
        })
