import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import PageMeta from '../../components/common/PageMeta';
import { useAuth } from '../../context/AuthContext';
import { vendorAnalyticsService, vendorPaymentService } from '../../services/api';

interface EarningsSummary {
  total_earnings: number;
  available_balance: number;
  pending_balance: number;
  total_orders: number;
  total_products_sold: number;
  last_payout_amount: number;
  last_payout_date: string | null;
}

interface PayoutRequest {
  id: number;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  processed_at: string | null;
  notes: string | null;
}

interface Transaction {
  id: number;
  order_id: number;
  amount: number;
  type: 'order' | 'payout' | 'refund';
  status: string;
  created_at: string;
  description: string;
}

// Mock data for development when API is not available
const MOCK_EARNINGS_SUMMARY: EarningsSummary = {
  total_earnings: 12500.75,
  available_balance: 3750.25,
  pending_balance: 1250.50,
  total_orders: 45,
  total_products_sold: 78,
  last_payout_amount: 2500.00,
  last_payout_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
};

const MOCK_PAYOUT_REQUESTS: PayoutRequest[] = [
  {
    id: 1,
    amount: 2500.00,
    status: 'completed',
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    processed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Processed via bank transfer'
  },
  {
    id: 2,
    amount: 1800.50,
    status: 'pending',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    processed_at: null,
    notes: null
  }
];

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 101,
    order_id: 1001,
    amount: 350.25,
    type: 'order',
    status: 'completed',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Order #1001 - iPhone 13 Pro'
  },
  {
    id: 102,
    order_id: 1002,
    amount: 275.50,
    type: 'order',
    status: 'completed',
    created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Order #1002 - Samsung Galaxy S21'
  },
  {
    id: 103,
    order_id: 0,
    amount: 2500.00,
    type: 'payout',
    status: 'completed',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Payout #1 - Bank Transfer'
  },
  {
    id: 104,
    order_id: 1003,
    amount: 125.00,
    type: 'refund',
    status: 'completed',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Refund for Order #995 - Defective item'
  }
];

const VendorEarnings: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const [timeframe, setTimeframe] = useState<'all' | 'week' | 'month' | 'year'>('month');
  const [usesMockData, setUsesMockData] = useState(false);

  useEffect(() => {
    fetchData();
  }, [timeframe]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch earnings summary, payout requests, and transactions in parallel
        const [summaryData, payoutRequestsData, transactionsData] = await Promise.all([
          vendorAnalyticsService.getEarningsSummary(timeframe),
          vendorPaymentService.getPayoutRequests(),
          vendorPaymentService.getTransactions(timeframe)
        ]);

        setSummary(summaryData);
        setPayoutRequests(payoutRequestsData);
        setTransactions(transactionsData);
        setUsesMockData(false);
      } catch (apiError) {
        console.error('API Error:', apiError);
        
        // If API fails, use mock data
        toast.error('API endpoint not available. Using mock data for demonstration.');
        console.log('Using mock data for development');
        
        // Use mock data
        setSummary(MOCK_EARNINGS_SUMMARY);
        setPayoutRequests(MOCK_PAYOUT_REQUESTS);
        setTransactions(MOCK_TRANSACTIONS);
        setUsesMockData(true);
      }
    } catch (err) {
      console.error('Error fetching earnings data:', err);
      setError('Failed to load earnings data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!summary) return;
    
    if (payoutAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (payoutAmount > summary.available_balance) {
      toast.error('Amount exceeds available balance');
      return;
    }

    try {
      setIsRequestingPayout(true);
      
      if (usesMockData) {
        // Simulate API call with mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Create a new mock payout request
        const newPayoutRequest: PayoutRequest = {
          id: Math.floor(Math.random() * 1000) + 10,
          amount: payoutAmount,
          status: 'pending',
          created_at: new Date().toISOString(),
          processed_at: null,
          notes: null
        };
        
        // Add to existing payout requests
        setPayoutRequests([newPayoutRequest, ...payoutRequests]);
        
        // Update summary
        setSummary({
          ...summary,
          available_balance: summary.available_balance - payoutAmount,
          pending_balance: summary.pending_balance + payoutAmount
        });
        
        // Add transaction
        const newTransaction: Transaction = {
          id: Math.floor(Math.random() * 1000) + 100,
          order_id: 0,
          amount: payoutAmount,
          type: 'payout',
          status: 'pending',
          created_at: new Date().toISOString(),
          description: `Payout request #${newPayoutRequest.id}`
        };
        
        setTransactions([newTransaction, ...transactions]);
        
        toast.success('Payout request submitted successfully (mock)');
      } else {
        await vendorPaymentService.requestPayout(payoutAmount);
        toast.success('Payout request submitted successfully');
        fetchData(); // Refresh data
      }
      
      setPayoutAmount(0);
    } catch (err) {
      console.error('Error requesting payout:', err);
      toast.error('Failed to submit payout request');
    } finally {
      setIsRequestingPayout(false);
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
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={fetchData} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Earnings & Payouts - Vendor Dashboard"
        description="Manage your earnings and request payouts"
      />
      
      <Toaster position="top-right" />
      
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Earnings & Payouts
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your earnings and request payouts
        </p>
      </div>

      {/* Timeframe Filter */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeframe('week')}
            className={`px-4 py-2 rounded-lg ${
              timeframe === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-4 py-2 rounded-lg ${
              timeframe === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setTimeframe('year')}
            className={`px-4 py-2 rounded-lg ${
              timeframe === 'year'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            This Year
          </button>
          <button
            onClick={() => setTimeframe('all')}
            className={`px-4 py-2 rounded-lg ${
              timeframe === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Earnings Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Earnings</p>
          <h3 className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {summary ? formatCurrency(summary.total_earnings) : '$0.00'}
          </h3>
        </div>
        
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Available for Payout</p>
          <h3 className="mt-2 text-2xl font-semibold text-green-600 dark:text-green-400">
            {summary ? formatCurrency(summary.available_balance) : '$0.00'}
          </h3>
        </div>
        
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending Balance</p>
          <h3 className="mt-2 text-2xl font-semibold text-yellow-600 dark:text-yellow-400">
            {summary ? formatCurrency(summary.pending_balance) : '$0.00'}
          </h3>
        </div>
        
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Orders</p>
          <h3 className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {summary ? summary.total_orders : '0'}
          </h3>
        </div>
      </div>

      {/* Request Payout Section */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03] mb-8">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
          Request Payout
        </h2>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount (BDT)
            </label>
            <input
              type="number"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(Math.max(0, parseFloat(e.target.value) || 0))}
              min="0"
              step="0.01"
              max={summary?.available_balance || 0}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Enter amount"
            />
          </div>
          
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Available Balance
            </label>
            <div className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
              {summary ? formatCurrency(summary.available_balance) : '$0.00'}
            </div>
          </div>
          
          <button
            onClick={handleRequestPayout}
            disabled={isRequestingPayout || !summary || summary.available_balance <= 0 || payoutAmount <= 0 || payoutAmount > (summary?.available_balance || 0)}
            className={`mt-6 md:mt-0 px-6 py-2 rounded-lg text-white ${
              isRequestingPayout || !summary || summary.available_balance <= 0 || payoutAmount <= 0 || payoutAmount > (summary?.available_balance || 0)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isRequestingPayout ? 'Processing...' : 'Request Payout'}
          </button>
        </div>
        
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <p>
            Note: Payout requests are processed within 3-5 business days. Minimum payout amount is ৳50.
          </p>
        </div>
      </div>

      {/* Payout History */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03] mb-8">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
          Payout History
        </h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Date Requested</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Processed Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
              {payoutRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No payout requests found
                  </td>
                </tr>
              ) : (
                payoutRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      #{request.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(request.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(request.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        request.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : request.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : request.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {request.processed_at ? formatDate(request.processed_at) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {request.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction History */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
          Transaction History
        </h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Description</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      #{transaction.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(transaction.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.type === 'order'
                          ? 'bg-green-100 text-green-800'
                          : transaction.type === 'payout'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={transaction.type === 'order' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'order' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {transaction.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default VendorEarnings; 