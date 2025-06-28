import { api } from '../api';
import { getAuthHeaders } from './authHeaders';

// Helper wrapper so we don't have to repeat API_URL
const get = (url: string, config: any = {}) => api.get(url, config);
const post = (url: string, data: any, config: any = {}) => api.post(url, data, config);

class EMIService {
  async getEMIPlans(params: any = {}) {
    try {
      const response = await get(`/emi/plans/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching EMI plans:', error);
      throw error;
    }
  }

  async getAvailableBanks() {
    try {
      const response = await get(`/emi/plans/available_banks/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching available banks:', error);
      return {
        status: 'error',
        banks: [],
        count: 0
      };
    }
  }

  async calculateEMI(planId: number, productPrice: number, bankCode?: string) {
    try {
      const params: any = {
        plan_id: planId,
        product_price: productPrice
      };
      
      if (bankCode) {
        params.bank_code = bankCode;
      }
      
      const response = await get(`/emi/plans/calculate_emi/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error calculating EMI:', error);
      
      // Provide fallback EMI calculation data
      // This is a simplified calculation for display purposes only
      const fallbackData = {
        base_amount: productPrice,
        down_payment: 0,
        financed_amount: productPrice,
        total_interest: 0,
        total_payable: productPrice,
        monthly_installment: productPrice / 12, // Default to 12 months
        tenure_months: 12,
        interest_rate: 0,
        message: "Estimated EMI calculation (server calculation failed)",
        status: "fallback"
      };
      
      // If we have plan ID, try to make a reasonable estimate
      if (planId) {
        // For cardless EMI, use the correct flat interest calculation
        let downPaymentPercent = 40; // Default 40% down payment
        let interestRate = 10.8; // Default 10.8% interest rate
        let tenureMonths = 12; // Default 12 months
        
        // Adjust based on plan ID (these are estimates)
        if (planId <= 3) {
          tenureMonths = planId * 3; // 3, 6, 9 months
          interestRate = 8 + planId; // 9%, 10%, 11%
        } else if (planId <= 6) {
          tenureMonths = (planId - 3) * 6; // 6, 12, 18 months
          interestRate = 10 + (planId - 3); // 10%, 11%, 12%
        } else {
          tenureMonths = 12;
          interestRate = 10.8;
        }
        
        // Calculate EMI values using correct cardless EMI formula
        // 1. Calculate interest on full product price
        const totalInterest = productPrice * (interestRate / 100);
        
        // 2. Calculate total amount (price + interest)
        const totalWithInterest = productPrice + totalInterest;
        
        // 3. Calculate down payment on total amount
        const downPayment = totalWithInterest * (downPaymentPercent / 100);
        
        // 4. Calculate financed amount (total - down payment)
        const financedAmount = totalWithInterest - downPayment;
        
        // 5. Calculate monthly installment
        const monthlyInstallment = financedAmount / tenureMonths;
        
        fallbackData.down_payment = downPayment;
        fallbackData.financed_amount = financedAmount;
        fallbackData.total_interest = totalInterest;
        fallbackData.total_payable = totalWithInterest;
        fallbackData.monthly_installment = monthlyInstallment;
        fallbackData.tenure_months = tenureMonths;
        fallbackData.interest_rate = interestRate;
      }
      
      return fallbackData;
    }
  }

  // EMI Application Methods
  async submitEMIApplication(applicationData: any) {
    try {
      const response = await post(
        `/emi/applications/`,
        applicationData,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error submitting EMI application:', error);
      throw error;
    }
  }

  async submitEMIApplicationWithDocuments(applicationData: any) {
    try {
      const formData = new FormData();
      
      // Append all form fields
      Object.keys(applicationData).forEach(key => {
        if (applicationData[key] !== null && applicationData[key] !== undefined) {
          if (key === 'nid_front_image' || key === 'nid_back_image') {
            // Handle file uploads
            if (applicationData[key] instanceof File) {
              formData.append(key, applicationData[key]);
            }
          } else {
            formData.append(key, String(applicationData[key]));
          }
        }
      });

      const response = await post(
        `/emi/applications/`,
        formData,
        { 
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error submitting EMI application with documents:', error);
      throw error;
    }
  }

  async getEMIApplications() {
    try {
      const headers = getAuthHeaders();
      console.log('EMI Applications - Request headers:', headers);
      console.log('EMI Applications - API URL:', `/emi/applications/`);
      
      const response = await get(`/emi/applications/`, {
        headers: headers
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching EMI applications:', error);
      throw error;
    }
  }

  async getEMIApplication(applicationId: number) {
    try {
      const response = await get(`/emi/applications/${applicationId}/`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching EMI application:', error);
      throw error;
    }
  }

  // Admin Methods
  async approveEMIApplication(applicationId: number, adminNotes?: string) {
    try {
      const response = await post(
        `/emi/applications/${applicationId}/approve/`,
        { admin_notes: adminNotes || '' },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error approving EMI application:', error);
      throw error;
    }
  }

  async rejectEMIApplication(applicationId: number, rejectionReason: string, adminNotes?: string) {
    try {
      const response = await post(
        `/emi/applications/${applicationId}/reject/`,
        { 
          rejection_reason: rejectionReason,
          admin_notes: adminNotes || ''
        },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error rejecting EMI application:', error);
      throw error;
    }
  }

  // EMI Record Methods
  async getEMIRecords() {
    try {
      const headers = getAuthHeaders();
      console.log('EMI Records - Request headers:', headers);
      console.log('EMI Records - API URL:', `/emi/records/`);
      
      const response = await get(`/emi/records/`, {
        headers: headers
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching EMI records:', error);
      throw error;
    }
  }

  async getEMIRecordDetails(recordId: number) {
    try {
      const response = await get(`/emi/records/${recordId}/`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching EMI record details:', error);
      throw error;
    }
  }

  async processDownPayment(recordId: number, paymentData: any) {
    try {
      const response = await post(
        `/emi/records/${recordId}/process_down_payment/`,
        paymentData,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error processing down payment:', error);
      throw error;
    }
  }

  async getNextInstallment(recordId: number) {
    try {
      const response = await get(
        `/emi/records/${recordId}/next_installment/`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching next installment:', error);
      throw error;
    }
  }

  async getOverdueInstallments(recordId: number) {
    try {
      const response = await get(
        `/emi/records/${recordId}/overdue_installments/`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching overdue installments:', error);
      throw error;
    }
  }

  // Installment Methods
  async payInstallment(installmentId: number, paymentData: any) {
    try {
      // First get the installment details to get the EMI record and order
      const response = await api.get(`/emi/installments/${installmentId}/`, {
        headers: getAuthHeaders()
      });
      const installment = response.data;

      // Resolve orderId: use newly exposed order_id; fall back to extra fetch if missing
      let orderId: number | undefined = installment.order_id;

      if (!orderId) {
        try {
          const recordResp = await api.get(`/emi/records/${installment.emi_record_id || installment.emi_record}/`, {
            headers: getAuthHeaders()
          });
          orderId = recordResp.data?.order?.id;
        } catch (e) {
          console.warn('Could not resolve order ID from EMI record', e);
        }
      }

      if (!orderId) {
        throw new Error('Unable to determine order ID for installment payment');
      }

      // Then initiate the payment with the correct data
      const paymentResponse = await api.post(`/payments/initiate-sslcommerz/`, {
        order_id: orderId,
        amount: installment.amount,
        transaction_type: 'INSTALLMENT_PAYMENT',
        installment_id: installmentId
      }, { headers: getAuthHeaders() });
      return paymentResponse.data;
    } catch (error: any) {
      if (error?.response) {
        console.error('Error paying installment:', error.response.status, error.response.data);
      } else {
        console.error('Error paying installment:', error);
      }
      throw error;
    }
  }

  async markInstallmentAsPaid(installmentId: number, paymentData: any) {
    try {
      const response = await post(
        `/emi/installments/${installmentId}/mark_as_paid/`,
        paymentData,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking installment as paid:', error);
      throw error;
    }
  }

  async sendPaymentReminder(installmentId: number) {
    try {
      const response = await post(
        `/emi/installments/${installmentId}/send_reminder/`,
        {},
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      throw error;
    }
  }

  // Admin Dashboard Methods
  async getEMISummary() {
    try {
      const response = await get(`/emi/records/summary/`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching EMI summary:', error);
      throw error;
    }
  }

  async getDueReminders() {
    try {
      const response = await get(`/emi/installments/due_reminders/`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching due reminders:', error);
      throw error;
    }
  }

  // Initiate full remaining payment for an EMI record via gateway
  async initiateFullPayment(recordId: number, _orderId?: number, _amount?: number) {
    try {
      // Initiate payment for the remaining balance of the EMI record via the backend helper
      // The backend `process_down_payment` action will internally create the SSLCOMMERZ session
      // and return a payload containing `redirect_url` on success.
      const headers = getAuthHeaders();
      console.log('Full payment - Request headers:', headers);
      const response = await api.post(
        `/emi/records/${recordId}/process_down_payment/`,
        {
          // Empty payload – backend infers full-payment; we just need an authenticated POST.
        },
        { headers }
      );

      // Avoid unused parameter lint errors when strict flag is enabled
      void _orderId;
      void _amount;
      return response.data;
    } catch (error: any) {
      if (error?.response) {
        console.error('Error initiating full EMI payment:', error.response.status, error.response.data);
      } else {
        console.error('Error initiating full EMI payment:', error);
      }
      throw error;
    }
  }

  // Legacy Methods (keeping for backward compatibility)
  applyForEMI = this.submitEMIApplication;
}

export const emiService = new EMIService(); 