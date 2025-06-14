import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import PageMeta from '../../components/common/PageMeta';
import { adminPaymentService } from '../../services/api';

interface PayoutRequest {
  id: number;
  vendor: {
    id: number;
    name: string;
    email: string;
    company_name: string;
  };
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  processed_at: string | null;
  notes: string | null;
  payment_method: {
    type: 'bank' | 'paypal';
    details: any;
  };
}

// Mock data for development when API is not available
const MOCK_PAYOUT_REQUESTS: PayoutRequest[] = [
  {
    id: 1,
    vendor: {
      id: 1,
      name: 'John Smith',
      email: 'john@example.com',
      company_name: 'Smith Electronics'
    },
    amount: 1250.00,
    status: 'pending',
    created_at: new Date().toISOString(),
    processed_at: null,
    notes: null,
    payment_method: {
      type: 'bank',
      details: {
        bank_name: 'Chase Bank',
        account_name: 'John Smith',
        account_number: '1234567890',
        routing_number: '021000021'
      }
    }
  },
  {
    id: 2,
    vendor: {
      id: 2,
      name: 'Jane Doe',
      email: 'jane@example.com',
      company_name: 'Doe Mobile'
    },
    amount: 875.50,
    status: 'approved',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    processed_at: new Date().toISOString(),
    notes: 'Approved for payment on next cycle',
    payment_method: {
      type: 'paypal',
      details: {
        email: 'jane@example.com'
      }
    }
  },
  {
    id: 3,
    vendor: {
      id: 3,
      name: 'Robert Johnson',
      email: 'robert@example.com',
      company_name: 'Johnson Tech'
    },
    amount: 2100.75,
    status: 'completed',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    processed_at: new Date(Date.now() - 86400000).toISOString(),
    notes: 'Payment completed via bank transfer',
    payment_method: {
      type: 'bank',
      details: {
        bank_name: 'Bank of America',
        account_name: 'Robert Johnson',
        account_number: '0987654321',
        routing_number: '026009593'
      }
    }
  },
  {
    id: 4,
    vendor: {
      id: 4,
      name: 'Sarah Williams',
      email: 'sarah@example.com',
      company_name: 'Williams Phones'
    },
    amount: 750.25,
    status: 'rejected',
    created_at: new Date(Date.now() - 259200000).toISOString(),
    processed_at: new Date(Date.now() - 172800000).toISOString(),
    notes: 'Insufficient documentation provided',
    payment_method: {
      type: 'paypal',
      details: {
        email: 'sarah@example.com'
      }
    }
  }
];

const VendorPayouts: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingNotes, setProcessingNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [usesMockData, setUsesMockData] = useState(false);

  useEffect(() => {
    fetchPayoutRequests();
  }, [filterStatus]);

  const fetchPayoutRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);

      try {
        const data = await adminPaymentService.getVendorPayoutRequests(filterStatus);
        // Ensure data is an array before setting it
        if (Array.isArray(data)) {
          setPayoutRequests(data);
        } else if (data && typeof data === 'object' && data.results && Array.isArray(data.results)) {
          // Handle case where API returns a paginated response object with results array
          setPayoutRequests(data.results);
        } else {
          // Handle unexpected data format
          console.error('API returned unexpected data format:', data);
          setPayoutRequests([]);
          toast.error('Received unexpected data format from API');
        }
        setUsesMockData(false);
      } catch (apiError) {
        console.error('API Error:', apiError);
        
        // If API fails, use mock data
        toast.error('API endpoint not available. Using mock data for demonstration.');
        console.log('Using mock data for development');
        
        // Filter mock data based on status if needed
        let filteredMockData = MOCK_PAYOUT_REQUESTS;
        if (filterStatus) {
          filteredMockData = MOCK_PAYOUT_REQUESTS.filter(req => req.status === filterStatus);
        }
        
        setPayoutRequests(filteredMockData);
        setUsesMockData(true);
      }
    } catch (err) {
      console.error('Error fetching payout requests:', err);
      setError('Failed to load payout requests. Please try again later.');
      setPayoutRequests([]); // Ensure we set an empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;
    
    try {
      setIsProcessing(true);
      
      if (usesMockData) {
        // Simulate API call with mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update mock data
        const updatedRequests = payoutRequests.map(req => 
          req.id === selectedRequest.id 
            ? { ...req, status: 'approved' as const, notes: processingNotes || req.notes } 
            : req
        );
        
        setPayoutRequests(updatedRequests);
        toast.success('Payout request approved successfully (mock)');
      } else {
        // Real API call
        await adminPaymentService.approvePayoutRequest(selectedRequest.id, processingNotes);
        toast.success('Payout request approved successfully');
      }
      
      setSelectedRequest(null);
      setProcessingNotes('');
    } catch (err) {
      console.error('Error approving payout request:', err);
      toast.error('Failed to approve payout request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;
    
    if (!processingNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      if (usesMockData) {
        // Simulate API call with mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update mock data
        const updatedRequests = payoutRequests.map(req => 
          req.id === selectedRequest.id 
            ? { ...req, status: 'rejected' as const, notes: processingNotes } 
            : req
        );
        
        setPayoutRequests(updatedRequests);
        toast.success('Payout request rejected (mock)');
      } else {
        // Real API call
        await adminPaymentService.rejectPayoutRequest(selectedRequest.id, processingNotes);
        toast.success('Payout request rejected');
      }
      
      setSelectedRequest(null);
      setProcessingNotes('');
    } catch (err) {
      console.error('Error rejecting payout request:', err);
      toast.error('Failed to reject payout request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteRequest = async () => {
    if (!selectedRequest) return;
    
    try {
      setIsProcessing(true);
      
      if (usesMockData) {
        // Simulate API call with mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update mock data
        const updatedRequests = payoutRequests.map(req => 
          req.id === selectedRequest.id 
            ? { ...req, status: 'completed' as const, notes: processingNotes || req.notes, processed_at: new Date().toISOString() } 
            : req
        );
        
        setPayoutRequests(updatedRequests);
        toast.success('Payout marked as completed (mock)');
      } else {
        // Real API call
        await adminPaymentService.completePayoutRequest(selectedRequest.id, processingNotes);
        toast.success('Payout marked as completed');
      }
      
      setSelectedRequest(null);
      setProcessingNotes('');
    } catch (err) {
      console.error('Error completing payout request:', err);
      toast.error('Failed to complete payout request');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      currencyDisplay: 'symbol'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter payout requests based on search query
  const filteredRequests = Array.isArray(payoutRequests) 
    ? payoutRequests.filter(request => {
        const searchLower = searchQuery.toLowerCase();
        return (
          request.vendor.name.toLowerCase().includes(searchLower) ||
          request.vendor.company_name.toLowerCase().includes(searchLower) ||
          request.vendor.email.toLowerCase().includes(searchLower) ||
          request.id.toString().includes(searchLower)
        );
      })
    : [];

  if (isLoading && (!payoutRequests || payoutRequests.length === 0)) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Vendor Payouts - Admin Dashboard"
        description="Manage vendor payout requests"
      />
      
      <Toaster position="top-right" />
      
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Vendor Payouts
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Review and process vendor payout requests
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg ${
              filterStatus === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-4 py-2 rounded-lg ${
              filterStatus === 'approved'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-4 py-2 rounded-lg ${
              filterStatus === 'rejected'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            Rejected
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-2 rounded-lg ${
              filterStatus === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilterStatus('')}
            className={`px-4 py-2 rounded-lg ${
              filterStatus === ''
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            All
          </button>
        </div>
        
        <div className="w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search by vendor name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {error && (
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={fetchPayoutRequests} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Payout Requests Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Vendor</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Payment Method</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Date Requested</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No payout requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      #{request.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.vendor.company_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {request.vendor.name} • {request.vendor.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(request.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {request.payment_method.type === 'bank' ? (
                        <span>Bank Transfer</span>
                      ) : (
                        <span>PayPal</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(request.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        request.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : request.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : request.status === 'approved'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Request Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-2xl mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Payout Request Details
              </h3>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setProcessingNotes('');
                }}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Vendor</p>
                  <p className="font-medium text-gray-800 dark:text-white">{selectedRequest.vendor.company_name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{selectedRequest.vendor.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{selectedRequest.vendor.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Request Details</p>
                  <p className="font-medium text-gray-800 dark:text-white">Amount: {formatCurrency(selectedRequest.amount)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Requested on: {formatDate(selectedRequest.created_at)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Status: <span className="font-medium">{selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}</span>
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Payment Method</p>
                <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  {selectedRequest.payment_method.type === 'bank' ? (
                    <>
                      <p className="font-medium text-gray-800 dark:text-white">Bank Transfer</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Bank: {selectedRequest.payment_method.details.bank_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Account Name: {selectedRequest.payment_method.details.account_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Account Number: {selectedRequest.payment_method.details.account_number.replace(/\d(?=\d{4})/g, '*')}
                      </p>
                      {selectedRequest.payment_method.details.routing_number && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Routing Number: {selectedRequest.payment_method.details.routing_number}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-gray-800 dark:text-white">PayPal</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Email: {selectedRequest.payment_method.details.email}
                      </p>
                    </>
                  )}
                </div>
              </div>
              
              {selectedRequest.notes && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    {selectedRequest.notes}
                  </p>
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Processing Notes
                </label>
                <textarea
                  value={processingNotes}
                  onChange={(e) => setProcessingNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Add notes about this payout request..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap justify-end gap-3">
              {selectedRequest.status === 'pending' && (
                <>
                  <button
                    onClick={handleRejectRequest}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={handleApproveRequest}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Approve'}
                  </button>
                </>
              )}
              {selectedRequest.status === 'approved' && (
                <button
                  onClick={handleCompleteRequest}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Mark as Completed'}
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setProcessingNotes('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VendorPayouts; 