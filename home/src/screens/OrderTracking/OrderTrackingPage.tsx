import React from 'react';
import { useParams } from 'react-router-dom';
import { HeaderByAnima } from '../ElectronicsStore/sections/HeaderByAnima/HeaderByAnima';
import { CtaFooterByAnima } from '../ElectronicsStore/sections/CtaFooterByAnima/CtaFooterByAnima';
import { OrderTracking } from '../../components/order/OrderTracking';

export const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();

  if (!orderId) {
    return (
      <div className="flex flex-col w-full bg-white min-h-screen">
        <HeaderByAnima showHeroSection={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Order ID Required</h1>
            <p className="text-gray-600">Please provide a valid order ID to track your order.</p>
          </div>
        </div>
        <CtaFooterByAnima />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <HeaderByAnima showHeroSection={false} />
      <div className="flex-1 py-8">
        <OrderTracking orderId={orderId} />
      </div>
      <CtaFooterByAnima />
    </div>
  );
}; 