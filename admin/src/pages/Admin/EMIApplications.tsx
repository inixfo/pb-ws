import React, { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import { emiService } from '../../services/api';
import { toast } from 'react-hot-toast';

interface EMIApplication {
  id: number;
  customer_name: string;
  product_name: string;
  amount: number;
  plan_name: string;
  status: string;
  created_at: string;
  user_id: number;
  product_id: number;
  plan_id: number;
}

const EMIApplications: React.FC = () => {
  const [applications, setApplications] = useState<EMIApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const data = await emiService.getApplications();
      
      // Ensure we're working with an array
      const applicationsArray = Array.isArray(data) 
        ? data 
        : data.results && Array.isArray(data.results) 
          ? data.results 
          : [];
          
      setApplications(applicationsArray);
      console.log('EMI Applications data:', applicationsArray);
      setError(null);
    } catch (err) {
      setError('Failed to load EMI applications');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewApplication = (id: number) => {
    // Future implementation: open application details modal or navigate to application details page
    console.log(`View application: ${id}`);
  };

  const handleApproveApplication = async (id: number) => {
    try {
      await emiService.approveApplication(id);
      
      // Update local state
      setApplications(applications.map(app => 
        app.id === id ? { ...app, status: 'approved' } : app
      ));
      
      toast.success('Application approved successfully');
    } catch (err) {
      toast.error('Failed to approve application');
      console.error(err);
    }
  };

  const handleRejectApplication = async (id: number) => {
    try {
      await emiService.rejectApplication(id);
      
      // Update local state
      setApplications(applications.map(app => 
        app.id === id ? { ...app, status: 'rejected' } : app
      ));
      
      toast.success('Application rejected successfully');
    } catch (err) {
      toast.error('Failed to reject application');
      console.error(err);
    }
  };

  // Filter applications based on search query and filter selections
  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      (app.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      app.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.id.toString().includes(searchQuery));
    
    const matchesStatus = statusFilter ? app.status.toLowerCase() === statusFilter.toLowerCase() : true;
    
    // Date filtering
    let matchesDate = true;
    if (dateFilter) {
      const appDate = new Date(app.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      if (dateFilter === 'today') {
        matchesDate = appDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'yesterday') {
        matchesDate = appDate.toDateString() === yesterday.toDateString();
      } else if (dateFilter === 'last7days') {
        const last7Days = new Date(today);
        last7Days.setDate(today.getDate() - 7);
        matchesDate = appDate >= last7Days;
      } else if (dateFilter === 'last30days') {
        const last30Days = new Date(today);
        last30Days.setDate(today.getDate() - 30);
        matchesDate = appDate >= last30Days;
      } else if (dateFilter === 'thismonth') {
        matchesDate = 
          appDate.getMonth() === today.getMonth() && 
          appDate.getFullYear() === today.getFullYear();
      } else if (dateFilter === 'lastmonth') {
        const lastMonth = new Date(today);
        lastMonth.setMonth(today.getMonth() - 1);
        matchesDate = 
          appDate.getMonth() === lastMonth.getMonth() && 
          appDate.getFullYear() === lastMonth.getFullYear();
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <>
      <PageMeta
        title="EMI Applications - Phone Bay Admin"
        description="Manage EMI applications of Phone Bay e-commerce platform"
      />
      
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          EMI Applications
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Review and manage installment payment applications
        </p>
      </div>
      
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Applications List
          </h3>
          
          <div className="flex flex-wrap gap-2">
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="">All Applications</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="thismonth">This Month</option>
              <option value="lastmonth">Last Month</option>
            </select>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search applications by ID, customer, or product..."
            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
            <button 
              onClick={() => fetchApplications()} 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Customer</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Product</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Plan</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No applications found matching the criteria
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((application) => (
                    <tr key={application.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">#{application.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{application.customer_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{application.product_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${application.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{application.plan_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(application.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          application.status.toLowerCase() === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : application.status.toLowerCase() === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <button 
                          onClick={() => handleViewApplication(application.id)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View
                        </button>
                        {application.status.toLowerCase() === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleApproveApplication(application.id)}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleRejectApplication(application.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="flex justify-between mt-4 py-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredApplications.length}</span> of <span className="font-medium">{filteredApplications.length}</span> results
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-md">Previous</button>
            <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">1</button>
            <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-md">Next</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EMIApplications; 