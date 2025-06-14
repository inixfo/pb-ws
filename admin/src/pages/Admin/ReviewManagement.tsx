import React, { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import { reviewService } from '../../services/api';
import { toast } from 'react-hot-toast';

interface Review {
  id: number;
  product: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    full_name: string;
    email: string;
  };
  rating: number;
  content: string;
  created_at: string;
  status: string;
}

const ReviewManagement: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    pendingCount: 0,
    trend: '0%'
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const data = await reviewService.getAll();
      
      // Ensure we're working with an array
      const reviewsArray = Array.isArray(data) 
        ? data 
        : data.results && Array.isArray(data.results) 
          ? data.results 
          : [];
          
      setReviews(reviewsArray);
      console.log('Reviews data:', reviewsArray);
      
      // Calculate stats
      calculateStats(reviewsArray);
      
      setError(null);
    } catch (err) {
      setError('Failed to load reviews');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (reviewsArray: Review[]) => {
    // Calculate average rating
    const totalRating = reviewsArray.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviewsArray.length > 0 ? (totalRating / reviewsArray.length).toFixed(1) : '0';
    
    // Count pending reviews
    const pendingCount = reviewsArray.filter(review => review.status === 'pending').length;
    
    // Calculate pending percentage
    const pendingPercentage = reviewsArray.length > 0 
      ? ((pendingCount / reviewsArray.length) * 100).toFixed(1) 
      : '0';
    
    // For trend, we would typically compare with historical data
    // For now, we'll use a placeholder
    const trend = '+24%';
    
    setStats({
      averageRating: parseFloat(averageRating),
      totalReviews: reviewsArray.length,
      pendingCount,
      trend
    });
  };

  const handleApproveReview = async (id: number) => {
    try {
      await reviewService.approve(id);
      
      // Update local state
      setReviews(reviews.map(review => 
        review.id === id ? { ...review, status: 'approved' } : review
      ));
      
      toast.success('Review approved successfully');
    } catch (err) {
      toast.error('Failed to approve review');
      console.error(err);
    }
  };

  const handleRejectReview = async (id: number) => {
    try {
      await reviewService.reject(id);
      
      // Update local state
      setReviews(reviews.map(review => 
        review.id === id ? { ...review, status: 'rejected' } : review
      ));
      
      toast.success('Review rejected successfully');
    } catch (err) {
      toast.error('Failed to reject review');
      console.error(err);
    }
  };

  const handleDeleteReview = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await reviewService.delete(id);
        
        // Remove from local state
        setReviews(reviews.filter(review => review.id !== id));
        
        toast.success('Review deleted successfully');
      } catch (err) {
        toast.error('Failed to delete review');
        console.error(err);
      }
    }
  };

  // Filter reviews based on search query, status, rating, and date filters
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      review.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.content?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter ? review.status.toLowerCase() === statusFilter.toLowerCase() : true;
    const matchesRating = ratingFilter ? review.rating === parseInt(ratingFilter) : true;
    
    // Date filtering
    let matchesDate = true;
    if (dateFilter) {
      const reviewDate = new Date(review.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      if (dateFilter === 'today') {
        matchesDate = reviewDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'yesterday') {
        matchesDate = reviewDate.toDateString() === yesterday.toDateString();
      } else if (dateFilter === 'last7days') {
        const last7Days = new Date(today);
        last7Days.setDate(today.getDate() - 7);
        matchesDate = reviewDate >= last7Days;
      } else if (dateFilter === 'last30days') {
        const last30Days = new Date(today);
        last30Days.setDate(today.getDate() - 30);
        matchesDate = reviewDate >= last30Days;
      } else if (dateFilter === 'thismonth') {
        matchesDate = 
          reviewDate.getMonth() === today.getMonth() && 
          reviewDate.getFullYear() === today.getFullYear();
      } else if (dateFilter === 'lastmonth') {
        const lastMonth = new Date(today);
        lastMonth.setMonth(today.getMonth() - 1);
        matchesDate = 
          reviewDate.getMonth() === lastMonth.getMonth() && 
          reviewDate.getFullYear() === lastMonth.getFullYear();
      }
    }
    
    return matchesSearch && matchesStatus && matchesRating && matchesDate;
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
        title="Review Management - Phone Bay Admin"
        description="Manage product reviews of Phone Bay e-commerce platform"
      />
      
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Review Management
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Moderate and manage customer reviews
        </p>
      </div>
      
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Reviews List
          </h3>
          
          <div className="flex flex-wrap gap-2">
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="">All Reviews</option>
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
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <select 
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>
        
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reviews by product, customer, or content..."
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
              onClick={() => fetchReviews()} 
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Product</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Customer</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Rating</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Review</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                {filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No reviews found matching the criteria
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((review) => (
                    <tr key={review.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{review.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{review.product?.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{review.user?.full_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg 
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="max-w-xs truncate">{review.content}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(review.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          review.status === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : review.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                        {review.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleApproveReview(review.id)}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleRejectReview(review.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {review.status !== 'pending' && (
                          <button 
                            onClick={() => handleDeleteReview(review.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
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
            Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredReviews.length}</span> of <span className="font-medium">{filteredReviews.length}</span> results
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-md">Previous</button>
            <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">1</button>
            <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-md">Next</button>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            Review Analytics
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Average Rating</h4>
              <div className="flex items-center">
                <span className="text-2xl font-bold text-gray-800 dark:text-white/90 mr-2">{stats.averageRating}</span>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg 
                      key={i}
                      className={`w-5 h-5 ${i < stats.averageRating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Based on {stats.totalReviews} reviews</p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Pending Reviews</h4>
              <div className="flex items-center">
                <span className="text-2xl font-bold text-yellow-500 mr-2">{stats.pendingCount}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">reviews need approval</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {stats.totalReviews > 0 ? ((stats.pendingCount / stats.totalReviews) * 100).toFixed(1) : 0}% of total reviews
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Review Trend</h4>
              <div className="flex items-center">
                <span className="text-2xl font-bold text-green-500 mr-2">{stats.trend}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">from last month</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Positive reviews increasing</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReviewManagement; 