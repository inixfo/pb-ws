import React, { useState, useEffect } from 'react';
import { orderService, paymentService, authService } from '../../../services/api';
import { OrderCreateRequest } from '../../../types/order';

interface CheckoutSectionProps {
  cartItems: any[];
  cartTotal: number;
  onOrderComplete: (orderId: number) => void;
}

export const CheckoutSection: React.FC<CheckoutSectionProps> = ({
  cartItems,
  cartTotal,
  onOrderComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
    firstName: '',
    lastName: '',
    email: '',
    country: 'Bangladesh'
  });

  useEffect(() => {
    // Load user addresses if authenticated
    if (authService.isAuthenticated()) {
      loadAddresses();
    }
  }, []);

  const loadAddresses = async () => {
    try {
      // This would need to be implemented in the API service
      // const response = await addressService.getAddresses();
      // setAddresses(response.data);
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const handleAddressSelect = (address: any) => {
    setSelectedAddress(address);
    setShippingInfo({
      address: address.address_line1 + (address.address_line2 ? '\n' + address.address_line2 : ''),
      city: address.city,
      state: address.state,
      postalCode: address.postal_code,
      phone: address.phone,
      firstName: address.first_name,
      lastName: address.last_name,
      email: address.email,
      country: 'Bangladesh'
    });
  };

  const handlePlaceOrder = async () => {
    if (!authService.isAuthenticated()) {
      setError('Please login to place an order');
      return;
    }

    if (cartItems.length === 0) {
      setError('Your cart is empty');
      return;
    }

    // Validate shipping information
    const requiredFields = ['firstName', 'lastName', 'email', 'address', 'city', 'state', 'postalCode', 'phone'];
    const missingFields = requiredFields.filter(field => !shippingInfo[field as keyof typeof shippingInfo]);
    
    if (missingFields.length > 0) {
      setError(`Please fill in all shipping information: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create order
      const orderData: OrderCreateRequest = {
        shipping_address: {
          first_name: shippingInfo.firstName || '',
          last_name: shippingInfo.lastName || '',
          email: shippingInfo.email || '',
          phone: shippingInfo.phone,
          address: shippingInfo.address,
          city: shippingInfo.city,
          country: 'Bangladesh',
          postcode: shippingInfo.postalCode
        },
        billing_address: {
          first_name: shippingInfo.firstName || '',
          last_name: shippingInfo.lastName || '',
          email: shippingInfo.email || '',
          phone: shippingInfo.phone,
          address: shippingInfo.address,
          city: shippingInfo.city,
          country: 'Bangladesh',
          postcode: shippingInfo.postalCode,
          same_as_shipping: true
        },
        payment_method: paymentMethod,
        payment_details: {
          payment_method: paymentMethod
        },
        shipping_method: 'standard',
        shipping_rate_id: 1
      };

      const orderResponse = await orderService.createOrder(orderData);
      
      if (orderResponse.id) {
        // Order created successfully, now initiate payment
        if (paymentMethod === 'cod') {
          // For cash on delivery, just redirect to success page
          onOrderComplete(orderResponse.id);
        } else {
          // For other payment methods, initiate SSLCOMMERZ payment
          const paymentResponse = await paymentService.initiateSslcommerzPayment(
            orderResponse.id,
            cartTotal,
            'REGULAR_FULL_AMOUNT'
          );

          if (paymentResponse.status === 'success' && paymentResponse.redirect_url) {
            // Redirect to payment gateway
            window.location.href = paymentResponse.redirect_url;
          } else {
            setError('Failed to initiate payment. Please try again.');
          }
        }
      } else {
        setError('Failed to create order. Please try again.');
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      setError(error.response?.data?.message || error.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-section bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Checkout</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Shipping Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
        
        {/* Address Selection */}
        {addresses.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Saved Address
            </label>
            <select
              value={selectedAddress?.id || ''}
              onChange={(e) => {
                const address = addresses.find(addr => addr.id === parseInt(e.target.value));
                if (address) handleAddressSelect(address);
              }}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose an address</option>
              {addresses.map(address => (
                <option key={address.id} value={address.id}>
                  {address.address_line1}, {address.city}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Manual Address Entry */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              value={shippingInfo.firstName}
              onChange={(e) => setShippingInfo(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="First Name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              value={shippingInfo.lastName}
              onChange={(e) => setShippingInfo(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Last Name"
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={shippingInfo.email}
              onChange={(e) => setShippingInfo(prev => ({ ...prev, email: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Email Address"
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <textarea
              value={shippingInfo.address}
              onChange={(e) => setShippingInfo(prev => ({ ...prev, address: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Enter your complete address"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              type="text"
              value={shippingInfo.city}
              onChange={(e) => setShippingInfo(prev => ({ ...prev, city: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="City"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State *
            </label>
            <input
              type="text"
              value={shippingInfo.state}
              onChange={(e) => setShippingInfo(prev => ({ ...prev, state: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="State"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Postal Code *
            </label>
            <input
              type="text"
              value={shippingInfo.postalCode}
              onChange={(e) => setShippingInfo(prev => ({ ...prev, postalCode: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Postal Code"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone *
            </label>
            <input
              type="tel"
              value={shippingInfo.phone}
              onChange={(e) => setShippingInfo(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Phone Number"
              required
            />
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-2"
            />
            Credit/Debit Card
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="mobile"
              checked={paymentMethod === 'mobile'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-2"
            />
            Mobile Banking
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="bank"
              checked={paymentMethod === 'bank'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-2"
            />
            Bank Transfer
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="cod"
              checked={paymentMethod === 'cod'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-2"
            />
            Cash on Delivery
          </label>
        </div>
      </div>

      {/* Order Summary */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
        <div className="flex justify-between mb-2">
          <span>Items ({cartItems.length})</span>
          <span>৳{cartTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Shipping</span>
          <span>৳0.00</span>
        </div>
        <div className="border-t pt-2">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>৳{cartTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Place Order Button */}
      <button
        onClick={handlePlaceOrder}
        disabled={loading || cartItems.length === 0}
        className={`w-full py-3 px-4 rounded-md font-semibold ${
          loading || cartItems.length === 0
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? 'Processing...' : `Place Order - ৳${cartTotal.toFixed(2)}`}
      </button>
    </div>
  );
};

export default CheckoutSection; 