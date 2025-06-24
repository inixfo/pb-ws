import { ArrowRightIcon, ShoppingCartIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Separator } from "../../../../components/ui/separator";
import { productService } from "../../../../services/api";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../../../../context/CartContext";
import { getProductImageUrl } from '../../../../utils/imageUtils';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api } from '../../../../services/api';
import { orderService } from '../../../../services/api/orderService';
import { OrderDetails } from '../../../../types/order';

// Helper function to format currency
const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined) {
    return '৳0.00';
  }
  
  // Convert to number if it's a string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Check if it's a valid number
  if (isNaN(numAmount)) {
    return '৳0.00';
  }
  
  return `৳${numAmount.toFixed(2)}`;
};

// Define types for order data
interface OrderData {
  id: number;
  order_id: string;
  order_number?: string;
  status: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_phone: string;
  payment_method: string;
  payment_status: string;
  total: number;
  created_at: string;
  items: OrderItem[];
  is_emi_payment?: boolean;
  emi_details?: {
    plan_name: string;
    monthly_installment: number;
    tenure_months: number;
    down_payment: number;
    total_interest: number;
  };
}

interface OrderItem {
  id: number;
  product: {
    id: number;
    name: string;
    primary_image: string;
  };
  quantity: number;
  price: number;
}

// Define types for product data
interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  sale_price?: number;
  primary_image: string;
  average_rating: number;
  total_reviews: number;
}

export const ThankYouContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const orderId = queryParams.get('order_id');
  const paymentStatus = queryParams.get('payment_status');
  const isEmi = queryParams.get('emi') === 'true';
  const hasError = queryParams.get('error') === 'true';

  useEffect(() => {
    // Clear the cart when thank you page is loaded
    clearCart();
    
    // Fetch order details
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError('No order ID provided. Unable to fetch order details.');
        setLoading(false);
        return;
      }
      
      try {
        const response = await api.get(`/orders/${orderId}/`);
        setOrderDetails(response.data);
        
        // If this was an EMI order but no EMI details in the response,
        // try to fetch EMI details separately
        if (isEmi && !response.data.emi_details) {
          try {
            const emiResponse = await orderService.getEMIDetails(orderId);
            if (emiResponse.data) {
              setOrderDetails(prev => ({
                ...prev!,
                emi_details: {
                  plan_name: emiResponse.data.plan_name || 'EMI Plan',
                  monthly_installment: emiResponse.data.monthly_installment || 0,
                  tenure_months: emiResponse.data.tenure_months || 0,
                  down_payment: emiResponse.data.down_payment || 0,
                  total_interest: emiResponse.data.total_interest || 0
                }
              }));
            }
          } catch (emiError) {
            console.error('Failed to fetch EMI details:', emiError);
            // Don't set error state here as we still have the basic order details
          }
        }
      } catch (err: any) {
        console.error('Error fetching order details:', err);
        setError(err.response?.data?.message || 'Failed to fetch order details. Please contact customer support.');
        
        // Create fallback order details if we have an order ID but can't fetch details
        if (orderId) {
          setOrderDetails({
            id: parseInt(orderId),
            order_id: orderId,
            order_number: `#${orderId}`,
            status: 'processing',
            payment_status: paymentStatus || 'pending',
            total: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            items: [],
            shipping_address: 'N/A',
            shipping_city: 'N/A',
            shipping_state: 'N/A',
            shipping_postal_code: 'N/A',
            shipping_phone: 'N/A',
            payment_method: 'N/A',
            subtotal: 0,
            shipping_cost: 0,
            tax: 0,
            has_emi: isEmi,
            is_emi_payment: isEmi,
            emi_details: isEmi ? {
              plan_name: 'EMI Plan',
              monthly_installment: 0,
              tenure_months: 0,
              down_payment: 0,
              total_interest: 0
            } : undefined
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, clearCart, isEmi, paymentStatus]);

  // Render star ratings
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(
          <img
            key={i}
            className="w-3 h-3"
            alt="Star fill"
            src="/star-fill.svg"
          />,
        );
      } else if (i - 0.5 === rating) {
        stars.push(
          <img
            key={i}
            className="w-3 h-3"
            alt="Star half"
            src="/star-half.svg"
          />,
        );
      } else {
        stars.push(
          <img key={i} className="w-3 h-3" alt="Star" src="/star.svg" />,
        );
      }
    }
    return stars;
  };

  // Format delivery time for display
  const formatDeliveryTime = () => {
    const date = new Date();
    date.setDate(date.getDate() + 3); // Delivery in 3 days
    
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('en-US', options);
  };

  // Map payment method code to display name
  const getPaymentMethodName = (code: string) => {
    const methods: Record<string, string> = {
      'card': 'Credit/Debit Card',
      'bank': 'Bank Transfer',
      'cod': 'Cash on Delivery',
      'mobile': 'Mobile Banking'
    };
    
    return methods[code] || code;
  };

  // Handle continue shopping
  const handleContinueShopping = () => {
    navigate('/');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primarymain mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800">Loading Order Details...</h2>
          <p className="text-gray-600 mt-2">Please wait while we fetch your order information.</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !orderDetails) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto">
          <div className="flex flex-col items-center text-center">
            <div className="bg-red-100 p-3 rounded-full mb-4">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => navigate('/account/orders')}>
                View My Orders
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-green-100 p-3 rounded-full mb-4">
            <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Thank You for Your Order!</h2>
          {hasError ? (
            <p className="text-amber-600 mt-2">
              There was an issue processing your payment, but your order has been recorded.
              Our team will contact you shortly.
            </p>
          ) : (
            <p className="text-gray-600 mt-2">
              Your order has been received and is now being processed.
            </p>
          )}
        </div>

        {orderDetails && (
          <div className="border-t border-gray-200 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Order Details</h3>
                <p className="text-gray-600">Order Number: <span className="font-medium">{orderDetails.order_number || orderDetails.order_id}</span></p>
                <p className="text-gray-600">Date: <span className="font-medium">{new Date(orderDetails.created_at).toLocaleDateString()}</span></p>
                <p className="text-gray-600">Status: <span className="font-medium capitalize">{orderDetails.status}</span></p>
                <p className="text-gray-600">Payment Status: <span className="font-medium capitalize">{orderDetails.payment_status}</span></p>
                <p className="text-gray-600">Total: <span className="font-medium">{formatCurrency(orderDetails.total)}</span></p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Shipping Information</h3>
                <p className="text-gray-600">Address: <span className="font-medium">{orderDetails.shipping_address}</span></p>
                <p className="text-gray-600">City: <span className="font-medium">{orderDetails.shipping_city}</span></p>
                <p className="text-gray-600">State: <span className="font-medium">{orderDetails.shipping_state}</span></p>
                <p className="text-gray-600">Postal Code: <span className="font-medium">{orderDetails.shipping_postal_code}</span></p>
                <p className="text-gray-600">Phone: <span className="font-medium">{orderDetails.shipping_phone}</span></p>
              </div>
            </div>

            {/* EMI Details Section */}
            {(isEmi || orderDetails.is_emi_payment) && orderDetails.emi_details && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">EMI Details</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600">Plan: <span className="font-medium">{orderDetails.emi_details.plan_name}</span></p>
                      <p className="text-gray-600">Tenure: <span className="font-medium">{orderDetails.emi_details.tenure_months} months</span></p>
                    </div>
                    <div>
                      <p className="text-gray-600">Monthly Installment: <span className="font-medium">{formatCurrency(orderDetails.emi_details.monthly_installment)}</span></p>
                      <p className="text-gray-600">Down Payment: <span className="font-medium">{formatCurrency(orderDetails.emi_details.down_payment)}</span></p>
                      {orderDetails.emi_details.total_interest > 0 && (
                        <p className="text-gray-600">Total Interest: <span className="font-medium">{formatCurrency(orderDetails.emi_details.total_interest)}</span></p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <Button onClick={() => navigate('/account/orders')}>
            View My Orders
          </Button>
          <Button variant="outline" onClick={handleContinueShopping}>
            Continue Shopping
          </Button>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-700 text-sm">
              <strong>Note:</strong> {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 