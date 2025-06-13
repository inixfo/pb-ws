import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { 
  ShippingAddress, 
  BillingAddress, 
  PaymentDetails, 
  OrderCreateRequest, 
  OrderResponse,
  ShippingMethod,
  ShippingRate
} from '../types/order';
import { CartItemType } from '../types/cart';
import { orderService } from '../services/api';
import shippingService from '../services/api/shippingService';
import { useCart } from '../context/CartContext';
import { toast } from 'react-hot-toast';
import { api as axiosInstance } from '../services/api';
import paymentService from '../services/api/paymentService';

export interface SSLCommerzInitResponse {
  status?: 'success' | 'error';
  redirect_url?: string;
  error?: string;
}

// Define the type for the new payload
interface PaymentContextPayload {
  chosenPaymentMethodKey: string; 
  amount?: number; 
  transactionType?: string; 
}

interface CheckoutContextType {
  // Shipping information
  shippingMethods: ShippingMethod[];
  shippingRates: ShippingRate[];
  selectedShippingMethod: string;
  fetchShippingMethods: (city: string) => Promise<void>;
  setSelectedShippingMethod: (methodId: string) => void;
  
  // Shipping address
  shippingAddress: ShippingAddress;
  updateShippingAddress: (field: keyof ShippingAddress, value: string) => void;
  
  // Billing address
  billingAddress: BillingAddress;
  updateBillingAddress: (field: keyof BillingAddress, value: string | boolean) => void;
  setSameAsBilling: (same: boolean) => void;
  
  // Payment
  paymentDetails: PaymentDetails;
  updatePaymentDetails: (field: keyof PaymentDetails, value: any) => void;
  
  // Checkout steps
  currentStep: number;
  setCurrentStep: (step: number) => void;
  
  // Submit order
  placeOrder: (emiApplicationData?: any) => Promise<OrderResponse | undefined>;
  isLoading: boolean;
  error: string | null;

  // Order summary
  orderTotal: number;
  shippingCost: number;

  // Updated function signature
  initiateSSLCommerzPayment: (orderId: number, paymentDetails: any) => Promise<SSLCommerzInitResponse>;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

export const CheckoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { cart, clearCart, loading: cartLoading } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Shipping methods state
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethodState] = useState<string>(() => {
    return localStorage.getItem('selected_shipping_method') || '';
  });
  
  // Checkout steps
  const [currentStep, setCurrentStep] = useState(1);
  
  // Shipping address state
  const initialShippingAddress: ShippingAddress = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postcode: ''
  };
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(() => {
    const saved = localStorage.getItem('shipping_address');
    return saved ? JSON.parse(saved) : initialShippingAddress;
  });
  
  // Billing address state
  const initialBillingAddress: BillingAddress = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postcode: '',
    same_as_shipping: true
  };
  const [billingAddress, setBillingAddress] = useState<BillingAddress>(() => {
    const saved = localStorage.getItem('billing_address');
    const parsed = saved ? JSON.parse(saved) : initialBillingAddress;
    // Ensure same_as_shipping defaults correctly if not in localStorage
    if (typeof parsed.same_as_shipping === 'undefined') {
        parsed.same_as_shipping = true;
    }
    return parsed;
  });
  
  // Payment details state
  const initialPaymentDetails: PaymentDetails = {
    payment_method: '',
    card_number: '',
    expiry_date: '',
    cvv: '',
    name_on_card: '',
    salary: '',
    job_title: '',
  };
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>(() => {
    const saved = localStorage.getItem('payment_details');
    return saved ? JSON.parse(saved) : initialPaymentDetails;
  });

  // Calculate order totals
  const { orderTotal, shippingCost } = useMemo(() => {
    let subtotal = 0;
    let discount = 0;
    let calculatedShippingCost = 0;

    if (cart && cart.subtotal) {
      subtotal = parseFloat(String(cart.subtotal)) || 0;
    }
    if (cart && cart.discount) {
      discount = parseFloat(String(cart.discount)) || 0;
    }
    if (cart && (cart as any).promo_code && (cart as any).promo_code.discount_amount) {
        discount += parseFloat(String((cart as any).promo_code.discount_amount)) || 0;
    } else if (cart && (cart as any).discount_amount) {
        discount += parseFloat(String((cart as any).discount_amount)) || 0;
    }

    if (selectedShippingMethod && shippingMethods.length > 0 && cart) {
      const methodDetails = shippingMethods.find(m => m.name === selectedShippingMethod);
      const rateDetails = shippingRates.find(r => r.method_name === selectedShippingMethod);
      
      const effectiveThreshold = parseFloat(String(rateDetails?.free_shipping_threshold || methodDetails?.free_shipping_threshold || "Infinity"));
      const baseRate = parseFloat(String(rateDetails?.base_rate || methodDetails?.base_rate || "0"));

      if (!isNaN(effectiveThreshold) && !isNaN(subtotal) && subtotal >= effectiveThreshold) {
        calculatedShippingCost = 0;
      } else if (!isNaN(baseRate)){
        calculatedShippingCost = baseRate;
      } else {
        calculatedShippingCost = 0; // Fallback if baseRate is somehow NaN
      }
    } else {
        // If no method selected or no methods available, shipping cost is 0 or needs to be calculated based on other rules
        // For now, assume 0 if not selectable.
        calculatedShippingCost = 0;
    }
    
    if (isNaN(calculatedShippingCost)) calculatedShippingCost = 0; // Final safety net

    let finalOrderTotal = subtotal - discount + calculatedShippingCost;
    finalOrderTotal = finalOrderTotal < 0 ? 0 : finalOrderTotal; // Ensure total isn't negative
    
    // console.log('CheckoutContext Calculation:', { subtotal, discount, shippingCost: calculatedShippingCost, orderTotal: finalOrderTotal, selectedShippingMethod });

    return { orderTotal: finalOrderTotal, shippingCost: calculatedShippingCost };
  }, [cart, selectedShippingMethod, shippingMethods, shippingRates]);
  
  // Fetch shipping methods and rates based on city
  const fetchShippingMethods = async (city: string) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("CheckoutContext: Fetching shipping info for city:", city);
      // Ensure city value is lowercase for API consistency if needed by backend
      const cityParam = city.toLowerCase(); 
      const methodsData = await shippingService.getAvailableMethods(
        shippingAddress.country || 'BD',
        undefined, // state is optional
        cityParam,
        shippingAddress.postcode || undefined // postalCode is optional
      );
      const ratesData = await shippingService.getAvailableRates(
        shippingAddress.country || 'BD',
        undefined, // state is optional
        cityParam,
        shippingAddress.postcode || undefined // postalCode is optional
      );
      
      setShippingMethods(methodsData || []);
      setShippingRates(ratesData || []);
      
      if (methodsData && methodsData.length > 0) {
        // const defaultMethod = methodsData[0]; // Example if a default is needed
      } else if (!selectedShippingMethod) { // Only clear if no methods and nothing was selected
        setSelectedShippingMethodState('');
      }
    } catch (err) {
      console.error("CheckoutContext: Error fetching shipping info:", err);
      setError('Failed to fetch shipping information. Please try a different city or refresh.');
      setShippingMethods([]); // Clear previous methods on error
      setShippingRates([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update shipping address
  const updateShippingAddress = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value
    }));
    
    // If billing address is same as shipping, update it too
    if (billingAddress.same_as_shipping) {
      updateBillingAddress(field as keyof BillingAddress, value);
    }
  };
  
  // Update billing address
  const updateBillingAddress = (field: keyof BillingAddress, value: string | boolean) => {
    setBillingAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Set if billing address is same as shipping
  const setSameAsBilling = (same: boolean) => {
    if (same) {
        // Corrected: Explicitly construct BillingAddress from ShippingAddress
        const newBillingAddress: BillingAddress = {
            first_name: shippingAddress.first_name,
            last_name: shippingAddress.last_name,
            email: shippingAddress.email,
            phone: shippingAddress.phone,
            address: shippingAddress.address,
            city: shippingAddress.city,
            country: shippingAddress.country,
            postcode: shippingAddress.postcode,
            same_as_shipping: true,
        };
        setBillingAddress(newBillingAddress);
    } else {
        // Ensure a fully compliant BillingAddress object is created
        const freshBillingAddress: BillingAddress = { 
            ...initialBillingAddress, // Spread initial default billing address
            same_as_shipping: false  // Explicitly set same_as_shipping to false
        };
        setBillingAddress(freshBillingAddress);
    }
  };
  
  // Update payment details
  const updatePaymentDetails = (field: keyof PaymentDetails, value: any) => {
    setPaymentDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Place order
  const placeOrder = async (emiApplicationData?: any): Promise<OrderResponse | undefined> => {
    setIsLoading(true);
    setError(null);
    try {
      if (!cart || !cart.items || cart.items.length === 0) throw new Error('Your cart is empty. Please add items before placing an order.');
      const requiresShipping = cart.items.some(item => !(item.product as any)?.is_virtual); 
      
      let finalShippingRateId: number;
      const rateObj = shippingRates.find(rate => rate.method_name === selectedShippingMethod) || 
                     shippingMethods.find(method => method.name === selectedShippingMethod);
      const rateId = rateObj?.id ? Number(rateObj.id) : undefined;

      if (requiresShipping) {
        if (!selectedShippingMethod) {
            toast.error('Please select a shipping method.');
            throw new Error('Please select a shipping method.');
        }
        if (rateId === undefined) {
          toast.error('Could not determine a valid shipping rate. Please re-select your shipping method or city.');
          throw new Error('Invalid shipping rate ID for selected method.');
        }
        finalShippingRateId = rateId;
      } else {
        finalShippingRateId = 0; // Backend should ideally handle or ignore this for non-shipped orders
      }
      
      // Corrected mapping using CartItemType from ../types/cart
      const orderItems = cart.items.map((item: CartItemType) => {
        const runtimeItem = item as any; 
        return {
          product_id: item.product.id,
          variation_id: runtimeItem.variationId || undefined, 
          quantity: item.quantity,
          price: parseFloat(
            String(
              runtimeItem.variationData?.price || 
              item.product.sale_price ||       
              item.product.price ||            
              '0'
            )
          ),
          emi_selected: item.emi_selected || false,
          emi_plan_id: item.emi_selected ? item.emi_period : undefined, 
        };
      });

      // Map frontend payment method keys to backend-compatible values
      const mapPaymentMethodToBackend = (frontendMethod: string): string => {
        const mapping: Record<string, string> = {
          'COD': 'cod',
          'cashOnDelivery': 'cod',
          'SSLCOMMERZ_STANDARD': 'card', // SSLCommerz Standard uses card payment
          'SSLCOMMERZ_CARD_EMI': 'card', // Card EMI through SSLCommerz
          'SSLCOMMERZ_CARDLESS_EMI': 'mobile', // Cardless EMI can use mobile banking
          'card': 'card',
          'bank': 'bank',
          'mobile': 'mobile',
          'cod': 'cod'
        };
        
        return mapping[frontendMethod] || 'cod'; // Default to COD if unknown
      };

      // Construct the order data
      const orderData = {
        // Flatten shipping address fields  
        shipping_address: shippingAddress.address,
        shipping_city: shippingAddress.city,
        shipping_state: shippingAddress.country, // Use country as state for now
        shipping_postal_code: shippingAddress.postcode,
        shipping_phone: (() => {
          const digits = (shippingAddress.phone || '').replace(/\D/g, '');
          return digits.length >= 10 ? digits : '0000000000';
        })(),
        
        // Payment method - convert to lowercase to match backend choices
        payment_method: mapPaymentMethodToBackend(paymentDetails.payment_method),
        
        // EMI status
        has_emi: cart.items.some((item: any) => item.emi_selected),
        
        // Include EMI application data if provided
        ...(emiApplicationData && { emi_application_data: emiApplicationData }),
      };

      console.log('Placing order with data:', orderData);
      const response = await orderService.createOrder(orderData as any);
      console.log('Order created successfully:', response);
      return response;

    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to place order. Please check your details and try again.';
      setError(errorMessage);
      // Do not toast here, let the component calling placeOrder handle UI feedback if needed
      console.error('CheckoutContext: Error placing order:', err.response?.data || err);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  // Pre-fill user information if available in the cart
  useEffect(() => {
    if (cart && cart.user) {
      // If we have user information from the cart, pre-fill the shipping address
      const userEmail = localStorage.getItem('user_email') || '';
      
      if (userEmail) {
        setShippingAddress(prev => ({
          ...prev,
          email: userEmail
        }));
        
        if (billingAddress.same_as_shipping) {
          setBillingAddress(prev => ({
            ...prev,
            email: userEmail
          }));
        }
      }
    }
  }, [cart]);
  
  // Set selected shipping method with recalculation
  const handleSelectShippingMethod = (methodName: string) => {
    console.log('Setting selected shipping method to:', methodName);
    setSelectedShippingMethodState(methodName);
    
    // Save selected shipping method to localStorage for persistence
    try {
      localStorage.setItem('selected_shipping_method', methodName);
      
      // Also save shipping cost details to localStorage
      const selectedRate = shippingRates?.find(rate => rate.method_name === methodName);
      const selectedMethod = shippingMethods?.find(method => method.name === methodName);
      
      if (selectedRate || selectedMethod) {
        const subtotal = cart ? parseFloat(String(cart.subtotal || '0')) : 0;
        const threshold = selectedRate?.free_shipping_threshold || selectedMethod?.free_shipping_threshold;
        const hasThreshold = threshold !== undefined;
        const exceedsThreshold = hasThreshold && subtotal >= parseFloat(String(threshold));
        const baseRate = parseFloat(String(selectedRate?.base_rate || selectedMethod?.base_rate || 0));
        const finalCost = hasThreshold && exceedsThreshold ? 0 : baseRate;
        
        localStorage.setItem('shipping_details', JSON.stringify({
          method: methodName,
          cost: finalCost,
          isFree: finalCost === 0,
          reason: exceedsThreshold ? 'qualified' : (finalCost === 0 ? 'free' : 'paid')
        }));
        
        console.log('Saved shipping details to localStorage:', {
          method: methodName,
          cost: finalCost,
          isFree: finalCost === 0,
          reason: exceedsThreshold ? 'qualified' : (finalCost === 0 ? 'free' : 'paid')
        });
      }
    } catch (e) {
      console.error('Error saving shipping method to localStorage:', e);
    }
  };
  
  // Initiate SSLCommerz payment
  const initiateSSLCommerzPayment = async (orderId: number, paymentDetails: any): Promise<SSLCommerzInitResponse> => {
    try {
      const response = await paymentService.initiateSslcommerzPayment(
        orderId,
        paymentDetails  // Pass the entire payment details object
      );
      
      if (response.status === 'success') {
        return { 
          status: 'success', 
          redirect_url: response.redirect_url 
        };
      } else {
        return { 
          status: 'error', 
          error: response.message || 'Failed to initiate payment' 
        };
      }
    } catch (error: any) {
      console.error('Error initiating SSL payment:', error);
      return { 
        status: 'error', 
        error: error.message || 'Failed to initiate payment' 
      };
    }
  };
  
  const value = {
    shippingMethods,
    shippingRates,
    selectedShippingMethod,
    fetchShippingMethods,
    setSelectedShippingMethod: handleSelectShippingMethod,
    
    shippingAddress,
    updateShippingAddress,
    
    billingAddress,
    updateBillingAddress,
    setSameAsBilling,
    
    paymentDetails,
    updatePaymentDetails,
    
    currentStep,
    setCurrentStep,
    
    placeOrder,
    isLoading,
    error,

    orderTotal,
    shippingCost,

    initiateSSLCommerzPayment,
  };
  
  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckout = () => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}; 