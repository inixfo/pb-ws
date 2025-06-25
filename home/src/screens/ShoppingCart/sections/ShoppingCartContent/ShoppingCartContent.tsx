import React, { useEffect, useState } from "react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Progress } from "../../../../components/ui/progress";
import { Separator } from "../../../../components/ui/separator";
import { 
  ArrowLeftIcon, 
  ChevronRightIcon, 
  MinusIcon, 
  PlusIcon, 
  XIcon, 
  PercentIcon, 
  MoveRightIcon, 
  StarIcon,
  AlertCircleIcon,
  Loader2Icon,
  CheckIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../../../services/api";
import CartManager from "../../../../services/CartManager";
import { toast } from "react-hot-toast";
import promoCodeService from "../../../../services/api/promoCodeService";
import { getProductImageUrl } from '../../../../utils/imageUtils';

// Define order summary data structure
interface OrderSummary {
  subtotal: string;
  saving: string;
  tax: string;
  shipping: string;
  total: string;
  bonuses: string;
}

export const ShoppingCartContent = (): JSX.Element => {
  // Debug logs
  console.log('ShoppingCartContent rendering');
  console.log('localStorage cart:', localStorage.getItem('cart'));
  
  // Check authentication status
  const isAuthenticated = authService.isAuthenticated();
  
  // Cart state
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Promo code state
  const [promoCode, setPromoCode] = useState<string>('');
  const [promoCodeLoading, setPromoCodeLoading] = useState<boolean>(false);
  const [promoCodeError, setPromoCodeError] = useState<string | null>(null);
  const [appliedPromoCode, setAppliedPromoCode] = useState<any>(null);
  const [showPromoInput, setShowPromoInput] = useState<boolean>(false);
  
  const [orderSummary, setOrderSummary] = useState<OrderSummary>({
    subtotal: "৳0.00",
    saving: "৳0.00",
    tax: "৳0.00",
    shipping: "Calculated at checkout",
    total: "৳0.00",
    bonuses: "0 bonuses",
  });
  
  const navigate = useNavigate();

  // Fetch cart data
  const fetchCart = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get cart data from CartManager (handles both backend and local cart)
      const cartData = await CartManager.getCart();
      
      console.log('Cart data received:', cartData);
      
      // Update the cart state
      setCart(cartData);
      
      // Get shipping information
      const shippingInfo = cartData.shipping_info || {
        free_shipping_threshold: 5000,
        remaining_for_free_shipping: 5000,
        default_shipping_cost: 120,
        is_eligible_for_free_shipping: false
      };
      
      // Get promo code information
      let promoCodeInfo = cartData.promo_code;
      console.log('Promo code info from cart:', promoCodeInfo);
      
      // If no promo code in cart data, check localStorage directly
      if (!promoCodeInfo) {
        try {
          const localPromoCode = localStorage.getItem('promo_code');
          if (localPromoCode) {
            promoCodeInfo = JSON.parse(localPromoCode);
            console.log('Found promo code in localStorage:', promoCodeInfo);
          }
        } catch (e) {
          console.error('Error parsing promo code from localStorage:', e);
        }
      }
      
      if (promoCodeInfo) {
        console.log("Promo code info found:", promoCodeInfo);
        setAppliedPromoCode(promoCodeInfo);
      } else {
        // Clear any previously applied promo code if not present in cart data
        if (appliedPromoCode) {
          setAppliedPromoCode(null);
        }
      }
      
      // Calculate order summary
      if (cartData.items && cartData.items.length > 0) {
        const subtotal = parseFloat(cartData.total_price);
        // No tax calculation
        
        // Calculate savings
        const savings = cartData.items.reduce((total, item) => {
          const regularPrice = item.product.price;
          const salePrice = item.variation?.price || item.product.sale_price || regularPrice;
          return total + ((regularPrice - salePrice) * item.quantity);
        }, 0);
        
        // Calculate shipping cost
        const shippingCost = shippingInfo.is_eligible_for_free_shipping ? 0 : shippingInfo.default_shipping_cost;
        
        // Calculate discount from promo code
        const discount = promoCodeInfo ? 
          (typeof promoCodeInfo.discount_amount === 'string' ? 
            parseFloat(promoCodeInfo.discount_amount) : 
            promoCodeInfo.discount_amount) : 0;
        
        // Calculate final total (ensure discount is subtracted)
        const total = subtotal - discount;
        
        console.log('Order summary calculation:', {
          subtotal,
          discount,
          total
        });
        
        setOrderSummary({
          subtotal: `৳${subtotal.toFixed(2)}`,
          saving: savings > 0 ? `-৳${savings.toFixed(2)}` : "৳0.00",
          tax: "৳0.00", // Set tax to zero
          shipping: "Shipping will be calculated at checkout",
          total: `৳${total.toFixed(2)}`,
          bonuses: `${Math.floor(total / 10)} bonuses`,
        });
      } else {
        // Empty cart
        setOrderSummary({
          subtotal: "৳0.00",
          saving: "৳0.00",
          tax: "৳0.00",
          shipping: "Shipping will be calculated at checkout",
          total: "৳0.00",
          bonuses: "0 bonuses",
        });
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Failed to fetch cart data');
    } finally {
      setLoading(false);
    }
  };

  // Load cart on component mount
  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  // Handle quantity changes
  const handleQuantityChange = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      await CartManager.updateItem(itemId, newQuantity);
      fetchCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };

  // Handle item removal
  const handleRemoveItem = async (itemId: number) => {
    try {
      await CartManager.removeItem(itemId);
      fetchCart();
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  // Handle cart clearing
  const handleClearCart = async () => {
    try {
      await CartManager.clearCart();
      fetchCart();
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  // Handle checkout
  const handleCheckout = () => {
    console.log('Checkout button clicked, auth status:', isAuthenticated);
    
    if (!isAuthenticated) {
      // Store the current URL to return after login
      const currentPath = '/checkout';
      // Redirect to login with return path
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }
    
    // Proceed to checkout
    navigate('/checkout');
  };
  
  // Handle promo code application
  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoCodeError('Please enter a promo code');
      return;
    }
    
    setPromoCodeLoading(true);
    setPromoCodeError(null);
    
    try {
      if (!isAuthenticated) {
        // For guest users, validate the promo code
        const response = await promoCodeService.validatePromoCode(promoCode, parseFloat(cart.total_price));
        
        console.log('Promo code validation response:', response);
        
        // Check if the promo code has minimum purchase requirements
        if (response.min_purchase_amount > parseFloat(cart.total_price)) {
          setPromoCodeError(`This promo code requires a minimum purchase of ৳${response.min_purchase_amount.toFixed(2)}`);
          setPromoCodeLoading(false);
          return;
        }
        
        // Show success message with discount amount
        toast.success(`Promo code ${promoCode} applied! You saved ৳${response.discount_amount.toFixed(2)}`);
        
        // Store promo code info
        const promoCodeInfo = {
          code: promoCode,
          discount_amount: response.discount_amount
        };
        
        // Store in localStorage directly
        localStorage.setItem('promo_code', JSON.stringify(promoCodeInfo));
        
        setAppliedPromoCode(promoCodeInfo);
        
        // Hide promo input
        setShowPromoInput(false);
        
        // Refresh cart to update totals
        fetchCart();
      } else {
        // For authenticated users, apply the promo code to their cart
        const response = await promoCodeService.applyPromoCode(promoCode);
        
        console.log('Promo code apply response:', response);
        
        // Show success message with discount amount
        toast.success(`Promo code ${promoCode} applied! You saved ৳${response.discount_amount.toFixed(2)}`);
        
        // Hide promo input
        setShowPromoInput(false);
        
        // Refresh cart to get updated data with promo code
        fetchCart();
      }
    } catch (error: any) {
      console.error('Error applying promo code:', error);
      // Extract error message from response if available
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to apply promo code';
                          
      setPromoCodeError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setPromoCodeLoading(false);
    }
  };
  
  // Handle promo code removal
  const handleRemovePromoCode = async () => {
    setPromoCodeLoading(true);
    
    try {
      if (isAuthenticated) {
        // For authenticated users, remove the promo code from their cart
        const response = await promoCodeService.removePromoCode();
        console.log('Promo code removal response:', response);
      } else {
        // For guest users, just remove from localStorage directly
        localStorage.removeItem('promo_code');
        console.log('Removed promo code from localStorage');
      }
      
      // Clear applied promo code
      setAppliedPromoCode(null);
      setPromoCode('');
      
      // Show success message
      toast.success('Promo code removed successfully');
      
      // Refresh cart
      fetchCart();
    } catch (error: any) {
      console.error('Error removing promo code:', error);
      // Extract error message from response if available
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to remove promo code';
                          
      toast.error(errorMessage);
      
      // Even if the API call fails, we should still remove it from local state
      // This ensures the UI is consistent even if the backend has issues
      setAppliedPromoCode(null);
      localStorage.removeItem('promo_code');
      fetchCart();
    } finally {
      setPromoCodeLoading(false);
    }
  };

  // Calculate free shipping progress
  const calculateFreeShippingProgress = () => {
    if (!cart || !cart.shipping_info) return 0;
    
    const { free_shipping_threshold, remaining_for_free_shipping } = cart.shipping_info;
    
    if (remaining_for_free_shipping <= 0) return 100;
    
    const progress = ((free_shipping_threshold - remaining_for_free_shipping) / free_shipping_threshold) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  // Get remaining amount for free shipping
  const getRemainingForFreeShipping = () => {
    if (!cart || !cart.shipping_info) return 0;
    return cart.shipping_info.remaining_for_free_shipping;
  };

  const freeShippingProgress = calculateFreeShippingProgress();
  const remainingForFreeShipping = getRemainingForFreeShipping();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-16">
        <Loader2Icon className="w-12 h-12 text-primarymain animate-spin mb-4" />
        <p className="text-gray-600">Loading your cart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-16">
        <AlertCircleIcon className="w-12 h-12 text-dangermain mb-4" />
        <p className="text-gray-900 font-medium mb-2">Error loading cart</p>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchCart}>Try Again</Button>
      </div>
    );
  }

  const hasItems = cart && cart.items && cart.items.length > 0;

  if (!hasItems) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-16">
        <div className="max-w-md text-center">
          <h2 className="font-heading-desktop-h4 text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Looks like you haven't added any products to your cart yet.</p>
          <Button 
            onClick={() => navigate('/')}
            className="bg-primarymain hover:bg-primarymain/90 text-white-100"
          >
            Start Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-[1296px] px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-2 mb-10">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          onClick={() => navigate('/')}
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Continue shopping
        </Button>
      </div>

      <h1 className="font-heading-desktop-h3 text-gray-900 mb-10">
        Shopping Cart ({cart.total_items} {cart.total_items === 1 ? 'item' : 'items'})
      </h1>

      <div className="flex flex-col md:flex-row items-start gap-8 md:gap-14 w-full">
        {/* Left Column - Cart Items */}
        <div className="flex flex-col gap-8 w-full md:w-auto">
          {/* Free Shipping Progress */}
          {remainingForFreeShipping > 0 && (
            <div className="w-full md:w-[824px]">
              <div className="flex flex-col w-full items-start gap-[3px]">
                <div className="w-full text-sm">
                  <span className="text-[#4e5562] leading-[22px]">Buy </span>
                  <span className="font-semibold text-[#181d25] leading-[22px]">
                    ৳{remainingForFreeShipping.toFixed(2)}
                  </span>
                  <span className="text-[#4e5562] leading-[22px]">
                    {" "}
                    more to get{" "}
                  </span>
                  <span className="font-semibold text-[#181d25] leading-[22px]">
                    Free Shipping
                  </span>
                </div>

                <div className="relative w-full h-6">
                  <Progress
                    value={freeShippingProgress}
                    className="h-1 mt-2.5 bg-gray-100 rounded-full"
                  />
                  <div 
                    className="absolute w-6 h-6 top-0 bg-white-100 rounded-xl border border-solid border-[#fc9231] flex items-center justify-center"
                    style={{ right: `${100 - freeShippingProgress}%` }}
                  >
                    <StarIcon className="w-3 h-3 fill-current text-[#fc9231]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cart Items Table */}
          <div className="flex flex-col w-full md:w-[824px] gap-6">
            {/* Table Header */}
            <div className="flex flex-col items-start gap-4 w-full">
              <div className="w-full h-[21px] flex">
                <div className="w-[306px] font-body-small text-gray-600">
                  Product
                </div>
                <div className="hidden md:block w-[140px] font-body-small text-gray-600">
                  Price
                </div>
                <div className="hidden md:block w-[158px] font-body-small text-gray-600">
                  Quantity
                </div>
                <div className="hidden md:block w-[90px] font-body-small text-gray-600">
                  Total
                </div>
                <Button
                  variant="link"
                  className="ml-auto p-0 font-normal text-sm text-gray-600 underline"
                  onClick={handleClearCart}
                >
                  Clear cart
                </Button>
              </div>

              <Separator className="w-full h-[1px] bg-gray-200" />
            </div>

            {/* Cart Items */}
            {cart.items.map((item: any, index: number) => (
              <div key={`${item.id}-${index}`} className="flex flex-col md:flex-row w-full items-start gap-4">
                <div className="flex items-center gap-3 w-full md:w-[306px]">
                  <div 
                    className="w-[70px] h-[70px] bg-gray-100 rounded-lg bg-center bg-cover"
                    style={{ 
                      backgroundImage: `url(${item.product ? getProductImageUrl(item.product) : '/placeholder-product.png'})` 
                    }}
                  />
                  <div className="flex flex-col items-start">
                    <div className="font-body-small-medium text-gray-900">
                      {item.product.name}
                    </div>
                    {item.variation && (
                      <div className="text-xs text-gray-600 mt-1">
                        Variation: {item.variation.name}
                      </div>
                    )}
                    <div className="md:hidden flex items-center gap-1 mt-1">
                      <div className="font-body-small text-gray-600">
                        Price:
                      </div>
                      <div className="font-body-small-medium text-gray-900">
                        ৳{(parseFloat(item.variation?.price) || parseFloat(item.product.sale_price) || parseFloat(item.product.price) || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex items-center w-[140px]">
                  <div className="font-body-small-medium text-gray-900">
                    ৳{(parseFloat(item.variation?.price) || parseFloat(item.product.sale_price) || parseFloat(item.product.price) || 0).toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-[158px]">
                  <div className="flex items-center border border-gray-200 rounded-lg h-10 px-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="p-0 h-auto"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <MinusIcon className="w-3 h-3 text-gray-600" />
                    </Button>
                    <div className="w-8 text-center font-body-small-medium text-gray-900">
                      {item.quantity}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="p-0 h-auto"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    >
                      <PlusIcon className="w-3 h-3 text-gray-600" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="p-0 h-auto md:hidden"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    <XIcon className="w-4 h-4 text-gray-600" />
                  </Button>
                </div>

                <div className="hidden md:flex items-center w-[90px]">
                  <div className="font-body-small-medium text-gray-900">
                    ৳{parseFloat(item.total_price).toFixed(2)}
                  </div>
                </div>

                <div className="hidden md:flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="p-0 h-auto"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    <XIcon className="w-4 h-4 text-gray-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="flex flex-col gap-4 w-full md:w-auto">
          {/* Order Summary Card */}
          <Card className="w-full md:w-[416px] bg-gray-50 rounded-2xl">
            <CardHeader className="px-8 pt-8 pb-0">
              <h2 className="font-heading-desktop-h5 text-gray-900">
                Order summary
              </h2>
            </CardHeader>
            <Separator className="mx-8 my-6" />
            <CardContent className="px-8 pb-0">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Subtotal ({cart.total_items} items):
                  </span>
                  <span className="font-navigation-nav-link-small text-gray-900 text-right">
                    {orderSummary.subtotal}
                  </span>
                </div>
                
                {/* Only show savings if there are any */}
                {orderSummary.saving !== "৳0.00" && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Saving:</span>
                    <span className="font-navigation-nav-link-small text-dangermain text-right">
                      {orderSummary.saving}
                    </span>
                  </div>
                )}
                
                {/* Show promo code discount if applied */}
                {appliedPromoCode && (
                  <div className="flex justify-between items-center bg-green-50 p-2 rounded-md">
                    <div className="flex items-center gap-2">
                      <CheckIcon className="w-4 h-4 text-green-600" />
                      <div>
                        <span className="text-sm text-gray-700 font-medium">Promo discount:</span>
                        <div className="text-xs text-green-700">{appliedPromoCode.code}</div>
                      </div>
                    </div>
                    <span className="font-navigation-nav-link-small text-green-600 text-right font-medium">
                      -৳{appliedPromoCode.discount_amount.toFixed(2)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Shipping:</span>
                  <span className="font-navigation-nav-link-small text-gray-900 text-right">
                    {orderSummary.shipping}
                  </span>
                </div>
              </div>
            </CardContent>
            <Separator className="mx-8 my-6" />
            <CardFooter className="px-8 pb-8 flex flex-col gap-4">
              <div className="flex justify-between items-center w-full">
                <span className="text-sm text-gray-600">
                  Estimated total:
                </span>
                <span className="font-heading-desktop-h5 text-gray-900 text-right w-[156px]">
                  {orderSummary.total}
                </span>
              </div>
              {appliedPromoCode && (
                <div className="bg-green-50 p-3 rounded-lg w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckIcon className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">
                        You saved ৳{appliedPromoCode.discount_amount.toFixed(2)}
                      </span>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      {appliedPromoCode.code}
                    </span>
                  </div>
                </div>
              )}
              <Button 
                className="w-full bg-primarymain hover:bg-primarymain/90 text-white-100 rounded-lg py-3 font-navigation-nav-link-regular"
                onClick={handleCheckout}
              >
                Proceed to checkout
                <MoveRightIcon className="w-[18px] h-[18px] ml-2" />
              </Button>
              <div className="text-sm text-center text-gray-900">
                <span className="text-[#4e5562] underline">
                  Create an account
                </span>
                <span className="text-[#4e5562]"> and get</span>
                <span className="text-[#181d25]">&nbsp;</span>
                <span className="font-navigation-nav-link-small text-[#181d25]">
                  {orderSummary.bonuses}{" "}
                </span>
              </div>
            </CardFooter>
          </Card>

          {/* Promo Code Card */}
          <Card className="w-full md:w-[416px] bg-gray-50 rounded-2xl px-8 py-1">
            <CardContent className="p-0">
              {!showPromoInput && !appliedPromoCode ? (
                <div className="flex items-center justify-between py-5 w-full">
                  <div className="flex items-center gap-3 flex-1">
                    <PercentIcon className="w-5 h-5 text-gray-700" />
                    <span className="flex-1 font-heading-desktop-h6 text-gray-900">
                      Apply promo code
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="p-0 h-auto"
                    onClick={() => setShowPromoInput(true)}
                  >
                    <PlusIcon className="w-4 h-4 text-gray-700" />
                  </Button>
                </div>
              ) : appliedPromoCode ? (
                <div className="flex items-center justify-between py-5 w-full">
                  <div className="flex items-center gap-3 flex-1">
                    <CheckIcon className="w-5 h-5 text-green-500" />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-heading-desktop-h6 text-gray-900 mr-2">
                          {appliedPromoCode.code}
                        </span>
                        <Badge className="bg-green-100 text-green-700 text-xs">Applied</Badge>
                      </div>
                      <p className="text-sm text-green-600 font-medium">
                        You saved ৳{appliedPromoCode.discount_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="p-0 h-auto"
                    onClick={handleRemovePromoCode}
                    disabled={promoCodeLoading}
                  >
                    {promoCodeLoading ? (
                      <Loader2Icon className="w-4 h-4 animate-spin" />
                    ) : (
                      <XIcon className="w-4 h-4 text-gray-600" />
                    )}
                  </Button>
                </div>
              ) : (
                <div className="py-5 w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <Input
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleApplyPromoCode}
                      disabled={promoCodeLoading || !promoCode.trim()}
                    >
                      {promoCodeLoading ? (
                        <Loader2Icon className="w-4 h-4 animate-spin" />
                      ) : (
                        'Apply'
                      )}
                    </Button>
                  </div>
                  {promoCodeError && (
                    <p className="text-xs text-red-500">{promoCodeError}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};