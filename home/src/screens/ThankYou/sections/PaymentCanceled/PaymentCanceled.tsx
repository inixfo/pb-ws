import { ArrowRightIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";

export const PaymentCanceled = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderId, setOrderId] = useState<string | null>(null);
  
  useEffect(() => {
    // Get order ID from URL query params
    const queryParams = new URLSearchParams(location.search);
    const orderIdParam = queryParams.get('order_id');
    
    if (orderIdParam) {
      setOrderId(orderIdParam);
    }
  }, [location.search]);

  // Handle retry payment button click
  const handleRetryPayment = () => {
    if (orderId) {
      navigate(`/checkout?order_id=${orderId}`);
    } else {
      navigate('/cart');
    }
  };

  // Handle continue shopping button click
  const handleContinueShopping = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[600px] mx-auto py-8">
      <Card className="w-full bg-white rounded-lg shadow-md">
        <CardContent className="flex flex-col items-center p-8 gap-6">
          <div className="rounded-full bg-yellow-50 p-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Canceled</h2>
            <p className="text-gray-600 mb-4">
              Your payment was canceled. Please complete the payment to proceed with your order.
            </p>
            {orderId && (
              <p className="text-sm text-gray-500">
                Order #{orderId}
              </p>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <Button
              onClick={handleRetryPayment}
              className="w-full bg-primarymain hover:bg-primarydark text-white"
            >
              Retry Payment
            </Button>
            
            <Button
              variant="outline"
              onClick={handleContinueShopping}
              className="w-full border-gray-300 text-gray-700"
            >
              Continue Shopping
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 