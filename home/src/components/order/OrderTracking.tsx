import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ClockIcon, TruckIcon, PackageIcon, XCircleIcon } from 'lucide-react';
import { orderService } from '../../services/api';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

interface TrackingEvent {
  status: string;
  title: string;
  description: string;
  timestamp: string | null;
  completed: boolean;
}

interface OrderTrackingData {
  order_id: string;
  status: string;
  payment_status: string;
  tracking_events: TrackingEvent[];
  estimated_delivery: string | null;
  shipping_address: {
    address: string;
    city: string;
    state: string;
    postal_code: string;
    phone: string;
  };
  order_total: number;
  created_at: string;
  updated_at: string;
}

interface OrderTrackingProps {
  orderId: string;
  onClose?: () => void;
}

export const OrderTracking: React.FC<OrderTrackingProps> = ({ orderId, onClose }) => {
  const [trackingData, setTrackingData] = useState<OrderTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrackingData();
  }, [orderId]);

  const fetchTrackingData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await orderService.getOrderTracking(orderId);
      setTrackingData(data);
    } catch (err) {
      console.error('Error fetching tracking data:', err);
      setError('Failed to load tracking information');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string, completed: boolean) => {
    if (!completed) {
      return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }

    switch (status) {
      case 'placed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <PackageIcon className="w-5 h-5 text-blue-500" />;
      case 'shipped':
        return <TruckIcon className="w-5 h-5 text-blue-500" />;
      case 'delivered':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Pending';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error || 'Tracking information not found'}</p>
        <Button onClick={fetchTrackingData} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Tracking</h2>
          <p className="text-gray-600">Order #{trackingData.order_id}</p>
        </div>
        {onClose && (
          <Button onClick={onClose} variant="outline" size="sm">
            Close
          </Button>
        )}
      </div>

      {/* Order Summary */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Order Details</h3>
              <p className="text-sm text-gray-600">Total: {formatCurrency(trackingData.order_total)}</p>
              <p className="text-sm text-gray-600">Status: {trackingData.status}</p>
              <p className="text-sm text-gray-600">Payment: {trackingData.payment_status}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Delivery Address</h3>
              <p className="text-sm text-gray-600">{trackingData.shipping_address.address}</p>
              <p className="text-sm text-gray-600">
                {trackingData.shipping_address.city}, {trackingData.shipping_address.state} {trackingData.shipping_address.postal_code}
              </p>
              <p className="text-sm text-gray-600">Phone: {trackingData.shipping_address.phone}</p>
            </div>
          </div>
          {trackingData.estimated_delivery && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Estimated Delivery:</strong> {formatDate(trackingData.estimated_delivery)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tracking Timeline */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Tracking Timeline</h3>
          <div className="space-y-4">
            {trackingData.tracking_events.map((event, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(event.status, event.completed)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-medium ${event.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                      {event.title}
                    </h4>
                    <span className={`text-xs ${event.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                      {formatDate(event.timestamp)}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${event.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                    {event.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="mt-6 flex justify-center">
        <Button onClick={fetchTrackingData} variant="outline">
          Refresh Tracking
        </Button>
      </div>
    </div>
  );
}; 