import { ArrowRightIcon, ShoppingCartIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Separator } from "../../../../components/ui/separator";
import { orderService, productService } from "../../../../services/api";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../../../../context/CartContext";
import { getProductImageUrl } from '../../../../utils/imageUtils';

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

export const ThankYouContent = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get order ID from URL query params
        const queryParams = new URLSearchParams(location.search);
        const orderId = queryParams.get('order_id');
        
        if (!orderId) {
          setError('No order ID provided');
          setLoading(false);
          return;
        }
        
        // Fetch order details
        const orderData = await orderService.getOrderById(orderId);
        console.log('Order data:', orderData);
        setOrder(orderData);
        
        // Fetch recommended products (best sellers)
        const productsData = await productService.getBestSellers(4);
        console.log('Recommended products:', productsData);
        const products = productsData.results || productsData || [];
        setRecommendedProducts(products.slice(0, 2)); // Only show first 2 products
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load order details');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [location.search]);

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

  // Handle add to cart button click
  const handleAddToCart = (product: Product) => {
    addToCart(product.id, 1);
  };

  // Handle continue shopping button click
  const handleContinueShopping = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full py-20">
        <div className="w-10 h-10 border-4 border-primarymain border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-20">
        <h4 className="text-xl font-semibold text-gray-900 mb-4">
          {error || "Order details not found"}
        </h4>
        <Button onClick={handleContinueShopping}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row w-full items-start gap-8 py-8 px-4">
      {/* Left section - Order details */}
      <div className="flex flex-col items-start w-full md:w-1/2 max-w-[600px]">
        {/* Order confirmation header */}
        <header className="flex items-center justify-between relative w-full mb-8">
          <div className="flex items-center gap-4">
            <img className="w-12 h-12" alt="Check" src="/check.svg" />
            <div className="flex flex-col w-full items-start gap-1.5">
              <p className="w-full text-gray-600 text-sm leading-[22px] font-normal">
                Order #{order.order_id || order.order_number || order.id}
              </p>
              <h4 className="w-full font-semibold text-gray-900 text-2xl leading-8">
                Thank you for your order!
              </h4>
            </div>
          </div>
          <Button
            variant="link"
            className="text-gray-700 text-sm font-medium underline"
            onClick={() => navigate(`/track-order/${order.id}`)}
          >
            Track order
          </Button>
        </header>

        {/* Order details section */}
        <div className="flex flex-col w-full items-start gap-8 mb-8">
          <Separator className="w-full" />
          <div className="flex flex-col items-start gap-6 w-full">
            {/* Delivery address */}
            <div className="flex flex-col items-start gap-2 w-full">
              <h6 className="w-full font-semibold text-gray-900 text-base leading-6">
                Delivery
              </h6>
              <p className="w-full text-gray-600 text-sm leading-[22px] font-normal">
                {order.shipping_address}, {order.shipping_city}, {order.shipping_state}, {order.shipping_postal_code}
              </p>
            </div>

            {/* Delivery time */}
            <div className="flex flex-col items-start gap-2 w-full">
              <h6 className="w-full font-semibold text-gray-900 text-base leading-6">
                Time
              </h6>
              <p className="w-full text-gray-600 text-sm leading-[22px] font-normal">
                {formatDeliveryTime()}
              </p>
            </div>

            {/* Payment method */}
            <div className="flex flex-col items-start gap-2 w-full">
              <h6 className="w-full font-semibold text-gray-900 text-base leading-6">
                Payment
              </h6>
              <p className="w-full text-gray-600 text-sm leading-[22px] font-normal">
                {getPaymentMethodName(order.payment_method)}
              </p>
            </div>

            {/* Order Items */}
            <div className="flex flex-col items-start gap-2 w-full">
              <h6 className="w-full font-semibold text-gray-900 text-base leading-6">
                Order Items
              </h6>
              <div className="w-full space-y-4">
                {order.items && order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg">
                    <img 
                      src={item.product.primary_image} 
                      alt={item.product.name} 
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                      <div className="flex justify-between mt-1">
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        <p className="text-sm font-medium">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Total */}
            <div className="flex flex-col items-start gap-2 w-full">
              <h6 className="w-full font-semibold text-gray-900 text-base leading-6">
                Total
              </h6>
              <p className="w-full text-gray-900 text-xl font-bold">
                {formatCurrency(order.total)}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center gap-3">
          <p className="text-gray-600 text-sm leading-[22px] font-normal">
            Need help?
          </p>
          <Button
            variant="link"
            className="text-primarymain text-sm font-medium underline p-0 h-auto"
            onClick={() => navigate('/help-center')}
          >
            Contact us
          </Button>
        </footer>
      </div>

      {/* Right section - Recommended products */}
      <div className="flex flex-col w-full md:w-1/2 bg-gray-50 rounded-2xl p-8">
        <div className="w-full">
          <h4 className="text-center mb-8 font-semibold text-gray-900 text-2xl leading-8">
            You may also like
          </h4>

          {/* Product cards */}
          <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
            {recommendedProducts.map((product) => (
              <Card
                key={product.id}
                className="w-full md:w-[306px] bg-white rounded-lg overflow-hidden border-0 shadow-sm"
              >
                <div className="relative flex flex-col items-center justify-center p-6">
                  {product.sale_price && product.sale_price < product.price && (
                    <Badge className="absolute top-4 left-4 bg-dangermain text-white">
                      {`-${Math.round(((product.price - product.sale_price) / product.price) * 100)}%`}
                    </Badge>
                  )}
                  <img
                    className="w-full max-w-[258px] h-48 object-contain"
                    alt={product.name}
                    src={product.primary_image}
                    onClick={() => navigate(`/products/${product.slug || product.id}`)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                <CardContent className="flex flex-col items-start gap-3 pt-0 pb-4 px-4">
                  <div className="flex flex-col items-start gap-2 w-full">
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex items-start gap-1">
                        {renderStars(product.average_rating || 0)}
                      </div>
                      <p className="flex-1 text-gray-400 text-xs leading-[18px]">
                        ({product.total_reviews || 0})
                      </p>
                    </div>
                    <p 
                      className="font-medium text-gray-900 text-sm leading-5 cursor-pointer hover:text-primarymain"
                      onClick={() => navigate(`/products/${product.slug || product.id}`)}
                    >
                      {product.name}
                    </p>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 h-10">
                      {product.sale_price ? (
                        <>
                          <p className="font-semibold text-gray-900 text-xl leading-7">
                            {formatCurrency(product.sale_price)}
                          </p>
                          <p className="text-gray-400 text-sm leading-[21px] line-through">
                            {formatCurrency(product.price)}
                          </p>
                        </>
                      ) : (
                        <p className="font-semibold text-gray-900 text-xl leading-7">
                          {formatCurrency(product.price)}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="w-10 h-10 p-3 bg-gray-100 rounded-lg hover:bg-primarymain hover:text-white"
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingCartIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Continue shopping button */}
          <Button 
            className="flex w-full items-center justify-center gap-2 px-6 py-3 bg-primarymain text-white rounded-lg hover:bg-primarymain/90"
            onClick={handleContinueShopping}
          >
            Continue shopping
            <ArrowRightIcon className="w-[18px] h-[18px]" />
          </Button>
        </div>
      </div>
    </div>
  );
}; 