import logging
from datetime import date, timedelta
from decimal import Decimal
from celery import shared_task
from django.utils import timezone
from django.conf import settings
from django.db.models import Sum, Q

from .models import EMIRecord, EMIInstallment, EMIApplication
from notifications.services import SMSService

logger = logging.getLogger(__name__)


@shared_task
def update_installment_statuses():
    """
    Update the status of all installments based on their due dates.
    This should be run daily via a scheduler (e.g., Celery).
    """
    try:
        today = date.today()
        
        # Update pending installments to due if they're due today
        pending_due_today = EMIInstallment.objects.filter(
            status='pending',
            due_date=today,
            emi_record__status='active'
        )
        
        updated_count = pending_due_today.update(status='due')
        
        # Update due installments to overdue if they're past due
        overdue_installments = EMIInstallment.objects.filter(
            status__in=['pending', 'due'],
            due_date__lt=today,
            emi_record__status='active'
        )
        
        overdue_count = overdue_installments.update(status='overdue')
        
        logger.info(f"Updated {updated_count} installments to due, {overdue_count} to overdue")
        return f"Updated {updated_count} to due, {overdue_count} to overdue"
        
    except Exception as e:
        logger.error(f"Error in update_installment_statuses task: {str(e)}")
        raise


@shared_task
def check_emi_completion():
    """Check and mark EMI records as completed when all installments are paid."""
    try:
        # Get active EMI records
        active_records = EMIRecord.objects.filter(status='active')
        
        completed_count = 0
        for emi_record in active_records:
            # Check if all installments are paid
            total_installments = emi_record.installments.count()
            paid_installments = emi_record.installments.filter(status='paid').count()
            
            if total_installments > 0 and paid_installments == total_installments:
                # Mark as completed
                emi_record.status = 'completed'
                emi_record.completed_date = date.today()
                emi_record.remaining_amount = Decimal('0.00')
                emi_record.save()
                
                # Send completion notification
                SMSService.send_event_notification(
                    event_type='emi_completed',
                    user=emi_record.user,
                    context_data={
                        'order_id': emi_record.order.id,
                        'total_paid': str(emi_record.total_payable),
                        'completion_date': emi_record.completed_date.strftime('%d %B %Y')
                    },
                    related_object=emi_record
                )
                
                completed_count += 1
        
        logger.info(f"Marked {completed_count} EMI records as completed")
        return f"Completed {completed_count} EMI records"
        
    except Exception as e:
        logger.error(f"Error in check_emi_completion task: {str(e)}")
        raise


@shared_task
def send_payment_reminders():
    """Send payment reminders for upcoming and overdue EMI installments."""
    try:
        today = date.today()
        
        # Get installments due in next 3 days
        upcoming_installments = EMIInstallment.objects.filter(
            status='pending',
            due_date__lte=today + timedelta(days=3),
            due_date__gte=today,
            reminder_sent=False,
            emi_record__status='active'
        )
        
        reminder_count = 0
        for installment in upcoming_installments:
            try:
                # Send reminder SMS
                SMSService.send_event_notification(
                    event_type='emi_payment_reminder',
                    user=installment.emi_record.user,
                    context_data={
                        'order_id': installment.emi_record.order.id,
                        'installment_number': installment.installment_number,
                        'amount': str(installment.amount),
                        'due_date': installment.due_date.strftime('%d %B %Y'),
                        'days_remaining': (installment.due_date - today).days
                    },
                    related_object=installment
                )
                
                # Mark reminder as sent
                installment.reminder_sent = True
                installment.reminder_date = timezone.now()
                installment.save()
                
                reminder_count += 1
                
            except Exception as e:
                logger.error(f"Failed to send reminder for installment {installment.id}: {str(e)}")
        
        # Get overdue installments (send more urgent reminders)
        overdue_installments = EMIInstallment.objects.filter(
            status='pending',
            due_date__lt=today,
            emi_record__status='active'
        )
        
        overdue_count = 0
        for installment in overdue_installments:
            try:
                days_overdue = (today - installment.due_date).days
                
                # Send overdue reminder
                SMSService.send_event_notification(
                    event_type='emi_payment_overdue',
                    user=installment.emi_record.user,
                    context_data={
                        'order_id': installment.emi_record.order.id,
                        'installment_number': installment.installment_number,
                        'amount': str(installment.amount),
                        'due_date': installment.due_date.strftime('%d %B %Y'),
                        'days_overdue': days_overdue
                    },
                    related_object=installment
                )
                
                # Update installment status to overdue
                installment.status = 'overdue'
                installment.save()
                
                overdue_count += 1
                
            except Exception as e:
                logger.error(f"Failed to send overdue notice for installment {installment.id}: {str(e)}")
        
        logger.info(f"Sent {reminder_count} payment reminders and {overdue_count} overdue notices")
        return f"Sent {reminder_count} reminders and {overdue_count} overdue notices"
        
    except Exception as e:
        logger.error(f"Error in send_payment_reminders task: {str(e)}")
        raise


@shared_task
def auto_approve_eligible_applications():
    """Auto-approve EMI applications that meet certain criteria."""
    try:
        # Define auto-approval criteria
        auto_approve_criteria = Q(
            status='pending',
            monthly_income__gte=50000,  # Minimum monthly income
            product_price__lte=100000,  # Maximum product price
            created_at__gte=timezone.now() - timedelta(hours=1)  # Recent applications
        )
        
        eligible_applications = EMIApplication.objects.filter(auto_approve_criteria)
        
        approved_count = 0
        for application in eligible_applications:
            try:
                # Auto-approve the application
                application.status = 'approved'
                application.admin_notes = 'Auto-approved based on eligibility criteria'
                application.approved_at = timezone.now()
                application.save()
                
                # Create EMI record
                from .views import EMIApplicationViewSet
                viewset = EMIApplicationViewSet()
                viewset._create_emi_record(application)
                
                # Send notification
                SMSService.send_event_notification(
                    event_type='emi_application_approved',
                    user=application.user,
                    context_data={
                        'order_id': application.order.id,
                        'monthly_amount': str(application.monthly_installment),
                        'tenure': application.tenure_months
                    },
                    related_object=application
                )
                
                approved_count += 1
                
            except Exception as e:
                logger.error(f"Failed to auto-approve application {application.id}: {str(e)}")
        
        logger.info(f"Auto-approved {approved_count} applications")
        return f"Auto-approved {approved_count} applications"
        
    except Exception as e:
        logger.error(f"Error in auto_approve_eligible_applications task: {str(e)}")
        raise


@shared_task
def generate_monthly_emi_report():
    """Generate monthly EMI performance report."""
    try:
        today = date.today()
        first_day_of_month = today.replace(day=1)
        
        # Calculate monthly statistics
        monthly_stats = {
            'new_applications': EMIApplication.objects.filter(
                created_at__gte=first_day_of_month,
                created_at__lt=today
            ).count(),
            'approved_applications': EMIApplication.objects.filter(
                approved_at__gte=first_day_of_month,
                approved_at__lt=today,
                status='approved'
            ).count(),
            'payments_received': EMIInstallment.objects.filter(
                paid_date__gte=first_day_of_month,
                paid_date__lt=today,
                status='paid'
            ).aggregate(
                total=Sum('paid_amount')
            )['total'] or Decimal('0.00'),
            'overdue_amount': EMIInstallment.objects.filter(
                status='overdue',
                due_date__lt=today
            ).aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0.00')
        }
        
        logger.info(f"Monthly EMI report: {monthly_stats}")
        return monthly_stats
        
    except Exception as e:
        logger.error(f"Error in generate_monthly_emi_report task: {str(e)}")
        raise 