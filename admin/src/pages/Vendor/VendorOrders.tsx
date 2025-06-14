import React, { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import { orderService } from '../../services/api';
import { toast, Toaster } from 'react-hot-toast';

interface Order {
  id: number | string;
  order_number?: string;
  customer: string | { id: number; name: string; email: string };
  customer_name?: string;
  date: string;
  created_at?: string;
  total: number;
  status: string;
  payment_status: string;
  paymentStatus?: string; 
  items: number;
  item_count?: number;
}

const VendorOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Status update modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const data = await orderService.getAll();
      
      // Ensure we're working with arrays
      const ordersArray = Array.isArray(data) 
        ? data 
        : data.results && Array.isArray(data.results) 
          ? data.results 
          : [];
      
      // Format the data to match the expected format
      const formattedOrders = ordersArray.map((order: any) => ({
        id: order.id,
        order_number: order.order_number || `#ORD-${order.id}`,
        customer: typeof order.customer === 'object' ? order.customer.name : order.customer_name || 'Unknown Customer',
        date: order.created_at || order.date || new Date().toISOString().split('T')[0],
        total: order.total || 0,
        status: order.status || 'Pending',
        payment_status: order.payment_status || order.paymentStatus || 'Unknown',
        items: order.item_count || order.items || 0
      }));
      
      setOrders(formattedOrders);
      console.log('Orders data:', formattedOrders);
      setError(null);
    } catch (err) {
      setError('Failed to load orders');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    
    try {
      await orderService.update(
        typeof selectedOrder.id === 'string' ? parseInt(selectedOrder.id) : selectedOrder.id, 
        { status: newStatus }
      );
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === selectedOrder.id ? { ...order, status: newStatus } : order
      ));
      
      toast.success(`Order status updated to ${newStatus}`);
      setShowStatusModal(false);
    } catch (err) {
      toast.error('Failed to update order status');
      console.error(err);
    }
  };

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setShowStatusModal(true);
  };

  // Apply filters
  const filteredOrders = orders.filter(order => {
    // Search filter
    const matchesSearch = 
      (typeof order.id === 'string' && order.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.order_number && order.order_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (typeof order.customer === 'string' && order.customer.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Status filter
    const matchesStatus = statusFilter ? order.status.toLowerCase() === statusFilter.toLowerCase() : true;
    
    // Period filter (simplified implementation)
    let matchesPeriod = true;
    if (periodFilter) {
      const orderDate = new Date(order.date);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      
      if (periodFilter === 'today') {
        matchesPeriod = orderDate.toDateString() === today.toDateString();
      } else if (periodFilter === 'yesterday') {
        matchesPeriod = orderDate.toDateString() === yesterday.toDateString();
      } else if (periodFilter === 'last7days') {
        const last7Days = new Date();
        last7Days.setDate(today.getDate() - 7);
        matchesPeriod = orderDate >= last7Days;
      } else if (periodFilter === 'last30days') {
        const last30Days = new Date();
        last30Days.setDate(today.getDate() - 30);
        matchesPeriod = orderDate >= last30Days;
      } else if (periodFilter === 'thismonth') {
        matchesPeriod = 
          orderDate.getMonth() === today.getMonth() && 
          orderDate.getFullYear() === today.getFullYear();
      } else if (periodFilter === 'lastmonth') {
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 1);
        matchesPeriod = 
          orderDate.getMonth() === lastMonth.getMonth() && 
          orderDate.getFullYear() === lastMonth.getFullYear();
      }
    }
    
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  return (
    <>
      <PageMeta
        title="My Orders - Phone Bay Vendor"
        description="Manage customer orders for your products on Phone Bay"
      />
      
      <Toaster position="top-right" />
      
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          My Orders
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          View and manage orders for your products
        </p>
      </div>
      
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Orders List
          </h3>
          
          <div className="flex flex-wrap gap-2">
            <select 
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
            >
              <option value="">All Orders</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="thismonth">This Month</option>
              <option value="lastmonth">Last Month</option>
            </select>
            <select 
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search orders by ID or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
              onClick={() => fetchOrders()} 
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Order ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Customer</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Total</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Items</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Payment</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No orders found matching the criteria
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                        {order.order_number || `#ORD-${order.id}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {typeof order.customer === 'string' ? order.customer : order.customer.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(order.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        ${typeof order.total === 'number' ? order.total.toFixed(2) : parseFloat(String(order.total)).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {order.items}
                      </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status.toLowerCase() === 'delivered' 
                        ? 'bg-green-100 text-green-800' 
                            : order.status.toLowerCase() === 'processing' || order.status.toLowerCase() === 'shipped'
                          ? 'bg-blue-100 text-blue-800'
                              : order.status.toLowerCase() === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.payment_status?.toLowerCase() === 'paid' || order.paymentStatus?.toLowerCase() === 'paid'
                        ? 'bg-green-100 text-green-800' 
                            : order.payment_status?.toLowerCase().includes('await') || order.paymentStatus?.toLowerCase().includes('await')
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}>
                          {order.payment_status || order.paymentStatus || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <button 
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          onClick={() => window.location.href = `/vendor/orders/${order.id}`}
                        >
                          View
                        </button>
                        <button 
                          className="text-gray-600 hover:text-gray-900"
                          onClick={() => openStatusModal(order)}
                        >
                          Update Status
                        </button>
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
            Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredOrders.length}</span> of <span className="font-medium">{filteredOrders.length}</span> results
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-md">Previous</button>
            <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">1</button>
            <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-md">Next</button>
          </div>
        </div>
      </div>
      
      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full dark:bg-gray-800">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 dark:bg-gray-800">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Update Order Status
                    </h3>
                    <div className="mt-4">
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Order Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse dark:bg-gray-700">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleUpdateStatus}
                >
                  Update
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                  onClick={() => setShowStatusModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VendorOrders; 