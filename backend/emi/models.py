from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.conf import settings
from products.models import Product

User = get_user_model()


class EMIPlan(models.Model):
    """Model for EMI plans configuration."""
    
    EMI_TYPE_CHOICES = (
        ('card_emi', 'Card EMI'),
        ('cardless_emi', 'Cardless EMI'),
    )
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # EMI type
    plan_type = models.CharField(
        max_length=20, 
        choices=EMI_TYPE_CHOICES, 
        default='card_emi',
        help_text="Type of EMI plan"
    )
    
    # SSLCOMMERZ EMI specific fields
    is_sslcommerz_emi = models.BooleanField(
        default=False,
        help_text="Whether this plan uses SSLCOMMERZ's EMI system"
    )
    sslcommerz_bank_list = models.JSONField(
        null=True, 
        blank=True,
        help_text="List of banks supported for this EMI plan (as array of bank codes)"
    )
    
    # For direct integration with specific banks in SSLCOMMERZ
    sslcommerz_bank_id = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        help_text="Bank ID for direct integration with SSLCOMMERZ (optional)"
    )
    
    # Bank-specific interest rates for SSLCOMMERZ EMI
    sslcommerz_bank_interest_rates = models.JSONField(
        null=True,
        blank=True,
        help_text="JSON mapping of bank codes to their interest rates (e.g., {'DBBL': 9.5, 'BRAC': 10.0})"
    )
    
    # Duration option
    duration_months = models.PositiveIntegerField(
        default=12,
        validators=[MinValueValidator(1), MaxValueValidator(60)],
        help_text="Duration of the EMI plan in months"
    )
    
    # Interest rates
    interest_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        null=True,  # Making it optional for SSLCOMMERZ card EMI
        blank=True,  # Where bank sets the interest rate
        help_text="Annual interest rate in percentage. Leave blank for SSLCOMMERZ card EMI where bank sets the rate."
    )
    
    # Eligibility criteria
    min_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        help_text="Minimum product price eligible for this EMI plan"
    )
    max_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Maximum product price eligible for this EMI plan (blank for no limit)"
    )
    
    # Down payment
    down_payment_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Percentage of product price required as down payment"
    )
    
    # Processing fee
    processing_fee_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Processing fee as percentage of product price"
    )
    processing_fee_fixed = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        help_text="Fixed processing fee amount"
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.get_plan_type_display()})"
    
    def calculate_monthly_payment(self, product_price, tenure_months=None, bank_code=None):
        """Calculate monthly EMI payment amount."""
        # Use provided tenure or default to plan's duration
        tenure = tenure_months or self.duration_months
        
        # Calculate down payment
        down_payment = (product_price * self.down_payment_percentage / 100)
        
        # Calculate principal amount
        principal = product_price - down_payment
        
        # Calculate processing fee
        processing_fee = (principal * self.processing_fee_percentage / 100) + self.processing_fee_fixed
        
        # For SSLCOMMERZ Card EMI, check if we have bank-specific interest rates
        if self.is_sslcommerz_emi and self.plan_type == 'card_emi':
            # Try to get bank-specific interest rate if bank_code is provided
            bank_interest_rate = None
            if bank_code and self.sslcommerz_bank_interest_rates:
                try:
                    bank_interest_rate = self.sslcommerz_bank_interest_rates.get(bank_code)
                except (AttributeError, KeyError):
                    pass
                
            if bank_interest_rate is not None:
                # Calculate EMI with bank-specific interest rate
                monthly_interest_rate = float(bank_interest_rate) / (12 * 100)  # Convert annual rate to monthly
                
                if monthly_interest_rate > 0:
                    # EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
                    emi = principal * monthly_interest_rate * (1 + monthly_interest_rate) ** tenure
                    emi = emi / ((1 + monthly_interest_rate) ** tenure - 1)
                    total_interest = (emi * tenure) - principal
                    
                    return {
                        'product_price': product_price,
                        'down_payment': down_payment,
                        'principal': principal,
                        'processing_fee': processing_fee,
                        'monthly_payment': emi,
                        'total_payment': (emi * tenure) + down_payment + processing_fee,
                        'total_interest': total_interest,
                        'is_bank_determined_interest': False,
                        'bank_interest_rate': bank_interest_rate
                    }
            
            # If no bank-specific rate or bank not specified, provide an estimated payment without interest
            emi = principal / tenure
            return {
                'product_price': product_price,
                'down_payment': down_payment,
                'principal': principal,
                'processing_fee': processing_fee,
                'monthly_payment': emi,
                'total_payment': (emi * tenure) + down_payment + processing_fee,
                'total_interest': 0,  # Interest will be determined by SSLCOMMERZ/bank
                'is_bank_determined_interest': True
            }
        
        # Calculate EMI using reducing balance formula if interest rate is provided
        if self.interest_rate:
            monthly_interest_rate = self.interest_rate / (12 * 100)  # Convert annual rate to monthly
            
            if monthly_interest_rate > 0:
                # EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
                emi = principal * monthly_interest_rate * (1 + monthly_interest_rate) ** tenure
                emi = emi / ((1 + monthly_interest_rate) ** tenure - 1)
                total_interest = (emi * tenure) - principal
            else:
                # If interest rate is 0, simple division
                emi = principal / tenure
                total_interest = 0
        else:
            # No interest rate provided (for some card EMI plans)
            emi = principal / tenure
            total_interest = 0
        
        return {
            'product_price': product_price,
            'down_payment': down_payment,
            'principal': principal,
            'processing_fee': processing_fee,
            'monthly_payment': emi,
            'total_payment': (emi * tenure) + down_payment + processing_fee,
            'total_interest': total_interest
        }


class EMIApplication(models.Model):
    """Model for EMI applications from users."""
    
    STATUS_CHOICES = (
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    )
    
    EMPLOYMENT_TYPE_CHOICES = (
        ('salaried', 'Salaried Employee'),
        ('self_employed', 'Self Employed'),
        ('business_owner', 'Business Owner'),
        ('student', 'Student'),
        ('unemployed', 'Unemployed'),
        ('other', 'Other'),
    )
    
    # User and order
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='emi_applications')
    order = models.OneToOneField('orders.Order', on_delete=models.CASCADE, related_name='emi_application')
    
    # EMI plan and details
    emi_plan = models.ForeignKey(EMIPlan, on_delete=models.PROTECT, related_name='applications')
    tenure_months = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(60)],
        help_text="EMI tenure in months"
    )
    
    # Financial details
    product_price = models.DecimalField(max_digits=10, decimal_places=2)
    down_payment = models.DecimalField(max_digits=10, decimal_places=2)
    principal_amount = models.DecimalField(max_digits=10, decimal_places=2)
    processing_fee = models.DecimalField(max_digits=10, decimal_places=2)
    monthly_installment = models.DecimalField(max_digits=10, decimal_places=2)
    total_payable = models.DecimalField(max_digits=10, decimal_places=2)
    total_interest = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Application status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Employment and income details
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE_CHOICES)
    employer_name = models.CharField(max_length=200, blank=True)
    job_title = models.CharField(max_length=100, blank=True)
    monthly_income = models.DecimalField(max_digits=12, decimal_places=2)
    years_employed = models.DecimalField(
        max_digits=4, 
        decimal_places=1, 
        null=True, 
        blank=True,
        help_text="Years at current employment"
    )
    
    # ID verification
    nid_number = models.CharField(max_length=50, help_text="National ID number")
    nid_front_image = models.ImageField(upload_to='emi/nid_images/')
    nid_back_image = models.ImageField(upload_to='emi/nid_images/')
    
    # Additional documents
    income_proof = models.FileField(upload_to='emi/income_proof/', null=True, blank=True)
    additional_document = models.FileField(upload_to='emi/additional_docs/', null=True, blank=True)
    
    # Review notes
    admin_notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"EMI Application #{self.id} - {self.user.get_full_name()}"
    
    def approve(self, admin_user=None):
        """Approve the EMI application and create installment records."""
        if self.status == 'approved':
            return False
        
        self.status = 'approved'
        self.approved_at = timezone.now()
        self.save()
        
        # Create EMI record
        emi_record = EMIRecord.objects.create(
            application=self,
            user=self.user,
            order=self.order,
            emi_plan=self.emi_plan,
            tenure_months=self.tenure_months,
            principal_amount=self.principal_amount,
            monthly_installment=self.monthly_installment,
            total_payable=self.total_payable,
            down_payment_paid=False  # Will be updated when payment is confirmed
        )
        
        # Create installment records
        emi_record.generate_installments()
        
        return True


class EMIRecord(models.Model):
    """Model for active EMI records."""
    
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('defaulted', 'Defaulted'),
        ('cancelled', 'Cancelled'),
    )
    
    # User and order
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='emi_app_records')
    order = models.OneToOneField('orders.Order', on_delete=models.CASCADE, related_name='emi_record')
    application = models.OneToOneField(EMIApplication, on_delete=models.CASCADE, related_name='emi_record')
    
    # EMI plan and details
    emi_plan = models.ForeignKey(EMIPlan, on_delete=models.PROTECT, related_name='records')
    tenure_months = models.PositiveIntegerField()
    principal_amount = models.DecimalField(max_digits=10, decimal_places=2)
    monthly_installment = models.DecimalField(max_digits=10, decimal_places=2)
    total_payable = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    down_payment_paid = models.BooleanField(default=False)
    installments_paid = models.PositiveIntegerField(default=0)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    remaining_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Timestamps
    start_date = models.DateField(default=timezone.now)
    expected_end_date = models.DateField()
    completed_date = models.DateField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"EMI Record #{self.id} - {self.user.get_full_name()}"
    
    def save(self, *args, **kwargs):
        # Calculate expected end date if not set
        if not self.expected_end_date:
            from datetime import timedelta
            if isinstance(self.start_date, str):
                from datetime import datetime
                start_date = datetime.strptime(self.start_date, "%Y-%m-%d").date()
            else:
                start_date = self.start_date
            self.expected_end_date = start_date + timedelta(days=30 * self.tenure_months)
        
        # Set initial remaining amount
        if not self.pk:  # Only on creation
            self.remaining_amount = self.total_payable - self.amount_paid
            
        super().save(*args, **kwargs)
    
    def generate_installments(self):
        """Generate installment records for this EMI."""
        from datetime import timedelta
        for i in range(1, self.tenure_months + 1):
            if isinstance(self.start_date, str):
                from datetime import datetime
                start_date = datetime.strptime(self.start_date, "%Y-%m-%d").date()
            else:
                start_date = self.start_date
            due_date = start_date + timedelta(days=30 * i)
            
            EMIInstallment.objects.create(
                emi_record=self,
                installment_number=i,
                amount=self.monthly_installment,
                due_date=due_date,
                status='pending'
            )
    
    def update_payment_status(self):
        """Update payment status based on installments."""
        # Count paid installments
        paid_installments = self.installments.filter(status='paid').count()
        self.installments_paid = paid_installments
        
        # Calculate amount paid and remaining
        self.amount_paid = sum(inst.amount for inst in self.installments.filter(status='paid'))
        self.remaining_amount = self.total_payable - self.amount_paid
        
        # Check if all installments are paid
        if paid_installments == self.tenure_months and self.down_payment_paid:
            self.status = 'completed'
            self.completed_date = timezone.now().date()
        
        self.save()


class EMIInstallment(models.Model):
    """Model for individual EMI installments."""
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('due', 'Due'),
        ('overdue', 'Overdue'),
        ('paid', 'Paid'),
    )
    
    emi_record = models.ForeignKey(EMIRecord, on_delete=models.CASCADE, related_name='installments')
    installment_number = models.PositiveIntegerField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    
    # Payment details
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    paid_date = models.DateField(null=True, blank=True)
    payment_method = models.CharField(max_length=50, blank=True)
    transaction_id = models.CharField(max_length=100, blank=True)
    
    # Reminders
    reminder_sent = models.BooleanField(default=False)
    reminder_date = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['installment_number']
        unique_together = ['emi_record', 'installment_number']
    
    def __str__(self):
        return f"Installment #{self.installment_number} for EMI #{self.emi_record_id}"
    
    def mark_as_paid(self, paid_amount, payment_method='', transaction_id=''):
        """Mark this installment as paid."""
        self.status = 'paid'
        self.paid_amount = paid_amount
        self.paid_date = timezone.now().date()
        self.payment_method = payment_method
        self.transaction_id = transaction_id
        self.save()
        
        # Update the parent EMI record
        self.emi_record.update_payment_status()
    
    def update_status(self):
        """Update status based on due date."""
        today = timezone.now().date()
        
        if self.status == 'paid':
            return
        
        if today > self.due_date:
            self.status = 'overdue'
        elif today == self.due_date:
            self.status = 'due'
        else:
            self.status = 'pending'
        
        self.save()
