from django.contrib import admin
from .models import EMIPlan, EMIApplication, EMIRecord, EMIInstallment


class EMIInstallmentInline(admin.TabularInline):
    """Inline admin for EMI installments."""
    model = EMIInstallment
    extra = 0
    readonly_fields = ['installment_number', 'amount', 'due_date', 'created_at', 'updated_at']
    fields = [
        'installment_number', 'amount', 'due_date', 'status',
        'paid_amount', 'paid_date', 'payment_method', 'transaction_id'
    ]


@admin.register(EMIPlan)
class EMIPlanAdmin(admin.ModelAdmin):
    """Admin interface for EMI plans."""
    list_display = [
        'name', 'plan_type', 'interest_rate', 'duration_months',
        'down_payment_percentage', 'processing_fee_percentage', 'is_active'
    ]
    list_filter = ['is_active', 'plan_type', 'is_sslcommerz_emi']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = [
        ('Basic Information', {
            'fields': ['name', 'description', 'plan_type', 'is_active']
        }),
        ('SSLCOMMERZ Integration', {
            'fields': ['is_sslcommerz_emi', 'sslcommerz_bank_list', 'sslcommerz_bank_id']
        }),
        ('Duration Option', {
            'fields': ['duration_months']
        }),
        ('Financial Details', {
            'fields': [
                'interest_rate', 'min_price', 'max_price',
                'down_payment_percentage', 'processing_fee_percentage', 'processing_fee_fixed'
            ]
        }),
        ('Timestamps', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        })
    ]


@admin.register(EMIApplication)
class EMIApplicationAdmin(admin.ModelAdmin):
    """Admin interface for EMI applications."""
    list_display = [
        'id', 'user', 'order', 'emi_plan', 'product_price',
        'monthly_installment', 'tenure_months', 'status', 'created_at'
    ]
    list_filter = ['status', 'employment_type', 'created_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'nid_number']
    readonly_fields = [
        'user', 'order', 'product_price', 'down_payment', 'principal_amount',
        'processing_fee', 'monthly_installment', 'total_payable', 'total_interest',
        'created_at', 'updated_at', 'approved_at'
    ]
    fieldsets = [
        ('Application Information', {
            'fields': ['user', 'order', 'emi_plan', 'tenure_months', 'status']
        }),
        ('Financial Details', {
            'fields': [
                'product_price', 'down_payment', 'principal_amount',
                'processing_fee', 'monthly_installment', 'total_payable', 'total_interest'
            ]
        }),
        ('Employment & Income', {
            'fields': [
                'employment_type', 'employer_name', 'job_title',
                'monthly_income', 'years_employed'
            ]
        }),
        ('ID Verification', {
            'fields': ['nid_number', 'nid_front_image', 'nid_back_image']
        }),
        ('Additional Documents', {
            'fields': ['income_proof', 'additional_document']
        }),
        ('Review Notes', {
            'fields': ['admin_notes', 'rejection_reason']
        }),
        ('Timestamps', {
            'fields': ['created_at', 'updated_at', 'approved_at'],
            'classes': ['collapse']
        })
    ]
    actions = ['approve_applications', 'reject_applications']
    
    def approve_applications(self, request, queryset):
        """Admin action to approve selected applications."""
        for application in queryset.filter(status='pending'):
            application.approve()
        
        self.message_user(request, f"{queryset.filter(status='pending').count()} applications approved.")
    approve_applications.short_description = "Approve selected applications"
    
    def reject_applications(self, request, queryset):
        """Admin action to reject selected applications."""
        queryset.filter(status='pending').update(
            status='rejected',
            rejection_reason='Rejected by admin through bulk action'
        )
        self.message_user(request, f"{queryset.filter(status='pending').count()} applications rejected.")
    reject_applications.short_description = "Reject selected applications"


@admin.register(EMIRecord)
class EMIRecordAdmin(admin.ModelAdmin):
    """Admin interface for EMI records."""
    list_display = [
        'id', 'user', 'order', 'emi_plan', 'principal_amount',
        'monthly_installment', 'tenure_months', 'status', 'installments_paid'
    ]
    list_filter = ['status', 'down_payment_paid', 'start_date']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = [
        'user', 'order', 'application', 'emi_plan', 'principal_amount',
        'monthly_installment', 'total_payable', 'installments_paid',
        'amount_paid', 'remaining_amount', 'start_date', 'expected_end_date',
        'completed_date', 'created_at', 'updated_at'
    ]
    fieldsets = [
        ('Record Information', {
            'fields': ['user', 'order', 'application', 'emi_plan', 'status']
        }),
        ('Financial Details', {
            'fields': [
                'principal_amount', 'monthly_installment', 'total_payable',
                'tenure_months', 'down_payment_paid'
            ]
        }),
        ('Payment Status', {
            'fields': ['installments_paid', 'amount_paid', 'remaining_amount']
        }),
        ('Dates', {
            'fields': ['start_date', 'expected_end_date', 'completed_date']
        }),
        ('Timestamps', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        })
    ]
    inlines = [EMIInstallmentInline]
    actions = ['mark_down_payment_paid']
    
    def mark_down_payment_paid(self, request, queryset):
        """Admin action to mark down payment as paid."""
        queryset.filter(down_payment_paid=False).update(down_payment_paid=True)
        self.message_user(request, f"{queryset.filter(down_payment_paid=False).count()} records marked as down payment paid.")
    mark_down_payment_paid.short_description = "Mark down payment as paid"


@admin.register(EMIInstallment)
class EMIInstallmentAdmin(admin.ModelAdmin):
    """Admin interface for EMI installments."""
    list_display = [
        'id', 'emi_record_display', 'installment_number', 'amount',
        'due_date', 'status', 'paid_date'
    ]
    list_filter = ['status', 'due_date', 'paid_date']
    search_fields = ['emi_record__user__email', 'emi_record__user__first_name', 'emi_record__user__last_name']
    readonly_fields = ['emi_record', 'installment_number', 'amount', 'due_date', 'created_at', 'updated_at']
    fieldsets = [
        ('Installment Information', {
            'fields': ['emi_record', 'installment_number', 'amount', 'due_date', 'status']
        }),
        ('Payment Details', {
            'fields': ['paid_amount', 'paid_date', 'payment_method', 'transaction_id']
        }),
        ('Reminders', {
            'fields': ['reminder_sent', 'reminder_date']
        }),
        ('Timestamps', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        })
    ]
    actions = ['mark_as_paid', 'send_reminders']
    
    def emi_record_display(self, obj):
        """Display EMI record with user name."""
        return f"{obj.emi_record.user.get_full_name()} - EMI #{obj.emi_record.id}"
    emi_record_display.short_description = "EMI Record"
    
    def mark_as_paid(self, request, queryset):
        """Admin action to mark installments as paid."""
        for installment in queryset.filter(status__in=['pending', 'due', 'overdue']):
            installment.mark_as_paid(installment.amount)
        
        self.message_user(request, f"{queryset.filter(status__in=['pending', 'due', 'overdue']).count()} installments marked as paid.")
    mark_as_paid.short_description = "Mark selected installments as paid"
    
    def send_reminders(self, request, queryset):
        """Admin action to send reminders for installments."""
        from notifications.utils import send_notification
        from django.utils import timezone
        
        count = 0
        for installment in queryset.filter(status__in=['due', 'overdue'], reminder_sent=False):
            # Send notification
            send_notification(
                recipient=installment.emi_record.user,
                notification_type='emi_installment_reminder',
                title='EMI Installment Reminder',
                message=f'Your EMI installment #{installment.installment_number} is due on {installment.due_date}.',
                data={
                    'installment_id': installment.id,
                    'emi_record_id': installment.emi_record.id,
                    'installment_number': installment.installment_number,
                    'due_date': str(installment.due_date),
                    'amount': str(installment.amount)
                }
            )
            
            # Update reminder status
            installment.reminder_sent = True
            installment.reminder_date = timezone.now()
            installment.save()
            count += 1
        
        self.message_user(request, f"{count} reminders sent.")
    send_reminders.short_description = "Send reminders for selected installments"
