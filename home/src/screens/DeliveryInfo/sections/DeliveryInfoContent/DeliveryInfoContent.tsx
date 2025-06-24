import React, { useState, useEffect } from "react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Separator } from "../../../../components/ui/separator";
import { ChevronRightIcon, ArrowRightIcon, CheckIcon, TruckIcon, PackageIcon, PlusIcon, InfoIcon, CreditCardIcon, DollarSignIcon, BanknoteIcon, UploadIcon } from "lucide-react";
import { Select } from "../../../../components/ui/Select";
import { useCheckout } from "../../../../contexts/CheckoutContext";
import { useCart } from "../../../../context/CartContext";
import { CountryOption, CityOption } from "../../../../types/order";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ProductEMIPlan } from "../../../../types/products";
import { emiService } from "../../../../services/api/emiService";
// Add import for the imageUtils
import { getProductImageUrl } from '../../../../utils/imageUtils';

// Helper function to calculate shipping details
const calculateShippingDetails = (
  selectedMethodName: string | null | undefined,
  currentShippingMethods: ReturnType<typeof useCheckout>['shippingMethods'],
  currentShippingRates: ReturnType<typeof useCheckout>['shippingRates'],
  currentCart: ReturnType<typeof useCart>['cart']
) => {
  const defaultReturn = {
    cost: 0,
    display: "Calculated at checkout",
    color: "text-gray-900",
    isFree: false,
    qualified: false,
    numericThreshold: undefined as number | undefined,
  };

  if (!currentCart) { // If no cart, cannot calculate accurately
    return defaultReturn;
  }
  
  if (!selectedMethodName) { // If no method selected, return default (e.g. "Calculated at checkout")
     return defaultReturn;
  }

  const selectedMethod = currentShippingMethods.find(method => method.name === selectedMethodName);
  const selectedRate = currentShippingRates?.find(rate => rate.method_name === selectedMethodName);

  if (!selectedMethod) {
    return {
      ...defaultReturn,
      display: "Error: method not found",
      color: "text-red-500",
    };
  }

  const rawMethodThreshold = selectedMethod.free_shipping_threshold;
  const rawRateThreshold = selectedRate?.free_shipping_threshold;
  let effectiveThreshold: number | undefined = undefined;

  const parseThreshold = (val: any): number | undefined => {
    if (val !== null && val !== undefined) {
      const num = parseFloat(String(val));
      if (!isNaN(num) && num > 0) return num; // Ensure threshold is a positive number
    }
    return undefined;
  };

  const rateThreshNum = parseThreshold(rawRateThreshold);
  const methodThreshNum = parseThreshold(rawMethodThreshold);

  effectiveThreshold = rateThreshNum ?? methodThreshNum;

  const subtotal = parseFloat(String(currentCart.subtotal || '0'));
  // Ensure base_rate is treated as a number, default to 0 if not present or invalid
  const baseShippingCost = parseFloat(String(selectedRate?.base_rate || selectedMethod?.base_rate || 0));
   if (isNaN(baseShippingCost)) { // Fallback if baseShippingCost is NaN
    console.error("Warning: baseShippingCost is NaN for method", selectedMethodName);
   }

  let actualCost = isNaN(baseShippingCost) ? 0 : baseShippingCost; // Use 0 if NaN
  let isFreeShipping = false;
  let isQualifiedForFree = false;

  if (effectiveThreshold !== undefined && subtotal >= effectiveThreshold) {
    actualCost = 0;
    isFreeShipping = true;
    isQualifiedForFree = true;
  } else if (actualCost === 0 && baseShippingCost === 0) { // Handles cases where base rate is explicitly 0
      isFreeShipping = true;
  }


  let shippingDisplayValue = `৳${actualCost.toFixed(2)}`;
  let shippingColorValue = "text-gray-900";

  if (isFreeShipping) {
    shippingDisplayValue = isQualifiedForFree ? "Free (Qualified)" : "Free";
    shippingColorValue = "text-green-600";
  } else if (actualCost === 0 && !isQualifiedForFree) { // If cost is 0 but not "qualified", still show "Free"
    shippingDisplayValue = "Free";
    shippingColorValue = "text-green-600";
  }


  return {
    cost: actualCost,
    display: shippingDisplayValue,
    color: shippingColorValue,
    isFree: isFreeShipping,
    qualified: isQualifiedForFree,
    numericThreshold: effectiveThreshold,
  };
};

export const DeliveryInfoContent = (): JSX.Element => {
  const { 
    shippingMethods,
    selectedShippingMethod, 
    fetchShippingMethods, 
    setSelectedShippingMethod,
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
    shippingRates,
    initiateSSLCommerzPayment,
    shippingCost
  } = useCheckout();

  const { cart, loading: cartLoading } = useCart();
  const navigate = useNavigate();
  
  const [city, setCity] = useState(shippingAddress.city || "");
  const [showShippingMethods, setShowShippingMethods] = useState(false);
  const [deliveryInfoCompleted, setDeliveryInfoCompleted] = useState(false);
  const [shippingAddressCompleted, setShippingAddressCompleted] = useState(false);
  const [cityError, setCityError] = useState<string | null>(null);
  const [isCheckingCity, setIsCheckingCity] = useState(false);

  // Payment form state
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");

  // EMI and Cardless EMI data
  const [salary, setSalary] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [nidFrontPhoto, setNidFrontPhoto] = useState<File | null>(null);
  const [nidBackPhoto, setNidBackPhoto] = useState<File | null>(null);

  // EMI related derived state
  const [cartHasCardEMI, setCartHasCardEMI] = useState(false);
  const [selectedCardlessEMIPlanDetails, setSelectedCardlessEMIPlanDetails] = useState<ProductEMIPlan | null>(null);
  const [activeCardlessEMIDownpayment, setActiveCardlessEMIDownpayment] = useState<number | null>(null);
  const [activeCardlessEMIMonthly, setActiveCardlessEMIMonthly] = useState<number | null>(null);
  const [activeCardlessEMIBasePrice, setActiveCardlessEMIBasePrice] = useState<number | null>(null);
  const [activeCardlessEMIFinancedAmount, setActiveCardlessEMIFinancedAmount] = useState<number | null>(null);

  // New state for active Card EMI plan details from cart
  const [activeCardEMIPlanDetails, setActiveCardEMIPlanDetails] = useState<ProductEMIPlan | null>(null);
  const [activeCardEMICalculatedDetails, setActiveCardEMICalculatedDetails] = useState<{
    baseAmount: number;
    downPayment: number;
    financedAmount: number;
    totalInterest: number;
    totalPayable: number;
    monthlyInstallment: number;
    tenureMonths: number;
    interestPercent: number;
    downPaymentPercent: number;
    planName: string;
  } | null>(null);

  // Bank selection for Card EMI
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [availableBanks, setAvailableBanks] = useState<Array<{
    code: string;
    name: string;
    interest_rate?: number;
    plan_id?: number;
    plan_name?: string;
    tenure_months?: number;
  }>>([
    { code: "DBBL", name: "Dutch-Bangla Bank" },
    { code: "EBLC", name: "Eastern Bank" },
    { code: "BCBL", name: "Bangladesh Commerce Bank" },
    { code: "BBL", name: "BRAC Bank" },
    { code: "ABBL", name: "AB Bank" },
    { code: "MTBL", name: "Mutual Trust Bank" },
    { code: "SCB", name: "Standard Chartered Bank" },
    { code: "CITI", name: "Citibank" },
    { code: "EBL", name: "Eastern Bank Limited" },
    { code: "HSBC", name: "HSBC Bank" }
  ]);
  const [banksLoading, setBanksLoading] = useState(false);

  const [isProcessingPayment, setIsProcessingPayment] = useState(false); // Added state for payment processing

  // Determine if order is eligible for bonus points
  const isOrderEligibleForBonus = orderTotal > 0; // Define based on orderTotal

  // Order summary state
  const [orderSummaryItems, setOrderSummaryItems] = useState<Array<{
    label: string;
    value: string;
    color: string;
  }>>([]);

  // Total amount state to properly track the order total with EMI
  const [calculatedOrderTotal, setCalculatedOrderTotal] = useState<number>(0);

  // Effect to determine EMI status of the cart
  useEffect(() => {
    if (cart && cart.items) {
      let hasCardEMI = false;
      let cardlessPlan: ProductEMIPlan | null = null;
      let cardlessItemPrice = 0;
      let foundCardEMIPlan: ProductEMIPlan | null = null;
      let cardEMIItemPrice = 0;
      let foundBankCode: string | null = null;

      for (const item of cart.items) {
        // Check both emi_selected from API and emiSelected from localStorage
        const localStorageItem = item as any; // Type assertion for localStorage format
        const isEmiSelected = item.emi_selected || localStorageItem.emiSelected;
        const emiPlanId = item.emi_period || localStorageItem.emiPeriod;
        
        // Type-safe access to properties that might be in the API response or localStorage
        const itemEmiBank = (item as any).emi_bank || localStorageItem.emiBank; 
        const itemEmiType = (item as any).emi_type || localStorageItem.emiType;
        
        console.log('Checking cart item for EMI:', { 
          isEmiSelected, 
          emiPlanId, 
          itemEmiBank, 
          itemEmiType,
          productName: item.product?.name || 'Unknown'
        });

        if (isEmiSelected && (item as any).emi_plan) {
          const selectedPlan = (item as any).emi_plan as ProductEMIPlan;

          if (selectedPlan.plan_type === 'card_emi') {
            hasCardEMI = true;
            if (!foundCardEMIPlan) {
              foundCardEMIPlan = selectedPlan;
              cardEMIItemPrice = parseFloat(String(item.product.sale_price || item.product.price || '0'));
              // Store the bank code if available
              if (itemEmiBank) {
                foundBankCode = itemEmiBank;
                console.log('Found bank code from emi_plan:', itemEmiBank);
              }
            }
          } else if (selectedPlan.plan_type === 'cardless_emi') {
            if (!cardlessPlan) {
              cardlessPlan = selectedPlan;
              cardlessItemPrice = parseFloat(String(item.product.sale_price || item.product.price || '0'));
            }
          }
        } else if (isEmiSelected && item.product && item.product.emi_plans) {
          // There can be both card and cardless plans with the same tenure.
          // Find the exact plan for each type separately based on tenure AND plan_type.
          
          // Check emi_type if available to determine which plan type to look for
          const targetPlanType = itemEmiType || (itemEmiBank ? 'card_emi' : null);
          
          const possiblePlans = item.product.emi_plans.filter((plan: ProductEMIPlan) => 
            plan.duration_months === emiPlanId);

          // Card EMI plan (if any)
          const cardPlanMatch = possiblePlans.find((plan) => 
            plan.plan_type === 'card_emi' || (targetPlanType === 'card_emi'));
            
          if (cardPlanMatch) {
            hasCardEMI = true;
            if (!foundCardEMIPlan) {
              foundCardEMIPlan = cardPlanMatch;
              cardEMIItemPrice = parseFloat(String(item.product.sale_price || item.product.price || '0'));
              // Store the bank code if available
              if (itemEmiBank) {
                foundBankCode = itemEmiBank;
                console.log('Found bank code from cardPlanMatch:', itemEmiBank);
              }
            }
          }

          // Cardless EMI plan (if any)
          const cardlessPlanMatch = possiblePlans.find((plan) => 
            plan.plan_type === 'cardless_emi' || (targetPlanType === 'cardless_emi'));
            
          if (cardlessPlanMatch && !cardlessPlan) {
            cardlessPlan = cardlessPlanMatch;
            cardlessItemPrice = parseFloat(String(item.product.sale_price || item.product.price || '0'));
          }
        }
      }
      
      console.log('EMI Status Check:', { hasCardEMI, cardlessPlan, foundCardEMIPlan, selectedBank: foundBankCode });
      
      // Set the EMI status flags
      setCartHasCardEMI(hasCardEMI);
      setSelectedCardlessEMIPlanDetails(cardlessPlan);
      setActiveCardEMIPlanDetails(foundCardEMIPlan);

      // Automatically select the appropriate payment method based on EMI status
      if (hasCardEMI) {
        updatePaymentDetails('payment_method', 'SSLCOMMERZ_CARD_EMI');
        
        // Pre-select the bank if it was chosen on the product page
        if (foundBankCode && foundBankCode.trim() !== '') {
          console.log('Setting selected bank to:', foundBankCode);
          setSelectedBank(foundBankCode);
        }
      } else if (cardlessPlan) {
        updatePaymentDetails('payment_method', 'SSLCOMMERZ_CARDLESS_EMI');
      }

      // Calculate and set Cardless EMI payment details
      if (cardlessPlan && cardlessItemPrice > 0 && cardlessPlan.down_payment_percentage !== undefined && cardlessPlan.duration_months) {
        const downpayment = cardlessItemPrice * (cardlessPlan.down_payment_percentage / 100);
        const financedAmount = cardlessItemPrice - downpayment;
        
        // Calculate interest - treat interest_rate as flat rate for the entire period, not annual
        const interestRate = (cardlessPlan.interest_rate || 0) / 100;
        const totalInterest = financedAmount * interestRate;
        const totalPayable = financedAmount + totalInterest;
        
        // Monthly installment includes interest
        const monthly = totalPayable / cardlessPlan.duration_months;
        
        setActiveCardlessEMIDownpayment(downpayment);
        setActiveCardlessEMIMonthly(monthly);
        setActiveCardlessEMIBasePrice(cardlessItemPrice);
        setActiveCardlessEMIFinancedAmount(financedAmount);
      } else {
        setActiveCardlessEMIDownpayment(null);
        setActiveCardlessEMIMonthly(null);
        setActiveCardlessEMIBasePrice(null);
        setActiveCardlessEMIFinancedAmount(null);
      }

      // Calculate and set Card EMI financial details if a plan is found
      if (foundCardEMIPlan && cardEMIItemPrice > 0) {
        const planParams = foundCardEMIPlan;
        const baseAmount = cardEMIItemPrice; // Assuming card EMI is for a single item price for now
        const downPaymentPercent = planParams.down_payment_percentage || 0;
        const interestPercent = planParams.interest_rate || 0;
        const tenureMonths = planParams.duration_months || 1;

        const downPayment = baseAmount * (downPaymentPercent / 100);
        const financedAmount = baseAmount - downPayment;
        const totalInterest = financedAmount * (interestPercent / 100) * (tenureMonths / 12);
        const totalPayable = financedAmount + totalInterest;
        const monthlyInstallment = tenureMonths > 0 ? totalPayable / tenureMonths : 0;
        
        console.log('Card EMI Calculation:', {
          baseAmount,
          downPayment,
          financedAmount,
          totalInterest,
          totalPayable,
          monthlyInstallment,
          tenureMonths,
          interestPercent,
          downPaymentPercent
        });
        
        setActiveCardEMICalculatedDetails({
          baseAmount,
          downPayment,
          financedAmount,
          totalInterest,
          totalPayable,
          monthlyInstallment,
          tenureMonths,
          interestPercent,
          downPaymentPercent,
          planName: planParams.plan_name || `${tenureMonths}-month Card EMI`
        });
      } else {
        setActiveCardEMICalculatedDetails(null);
      }

    } else {
      setCartHasCardEMI(false);
      setSelectedCardlessEMIPlanDetails(null);
      setActiveCardlessEMIDownpayment(null);
      setActiveCardlessEMIMonthly(null);
      setActiveCardlessEMIBasePrice(null);
      setActiveCardlessEMIFinancedAmount(null);
      setActiveCardEMIPlanDetails(null);
      setActiveCardEMICalculatedDetails(null);
    }
  }, [cart]);

  // Update order summary effect (keep existing, may need minor tweaks for EMI display later)
  useEffect(() => {
    // ... (existing order summary calculation logic) ...
    // This logic will likely need to incorporate `activeCardlessEMIDownpayment`
    // if the "Total" in the summary should reflect only the downpayment for cardless EMI.

    const newItems = [];

    if (cart) {
        newItems.push({
            label: `Subtotal (${cart.items?.length || 0} items):`,
            value: `৳${parseFloat(String(cart.subtotal || '0')).toFixed(2)}`,
            color: "text-gray-900"
        });
        
        const cartDiscount = parseFloat(String(cart.discount || '0'));
        // ... (rest of discount and promo logic remains same) ...
        let promoDiscount = 0;
        let promoCodeDetails = null;
        if ((cart as any).promo_code) {
            promoCodeDetails = (cart as any).promo_code;
            promoDiscount = parseFloat(String(promoCodeDetails.discount_amount || 0));
        } else if ((cart as any).discount_amount) {
            promoDiscount = parseFloat(String((cart as any).discount_amount || 0));
        }


        if (cartDiscount > 0) {
            newItems.push({
            label: "Saving:",
            value: `-৳${cartDiscount.toFixed(2)}`,
            color: "text-dangermain"
            });
        }
        
        if (promoDiscount > 0) {
            newItems.push({
            label: promoCodeDetails?.code ? `Promo (${promoCodeDetails.code}):` : "Promo discount:",
            value: `-৳${promoDiscount.toFixed(2)}`,
            color: "text-green-600"
            });
        }
        
        // Calculate EMI interest if applicable
        let emiInterest = 0;
        if (activeCardEMICalculatedDetails) {
            emiInterest = activeCardEMICalculatedDetails.totalInterest;
            newItems.push({
                label: `EMI Interest (${activeCardEMICalculatedDetails.interestPercent}%):`,
                value: `৳${emiInterest.toFixed(2)}`,
                color: "text-gray-900"
            });
        } else if (selectedCardlessEMIPlanDetails && activeCardlessEMIMonthly !== null && activeCardlessEMIFinancedAmount !== null) {
            // Calculate interest for cardless EMI using simple interest formula
            const interestRate = selectedCardlessEMIPlanDetails.interest_rate / 100;
            const tenureYears = selectedCardlessEMIPlanDetails.duration_months / 12;
            emiInterest = activeCardlessEMIFinancedAmount * interestRate * tenureYears;
            newItems.push({
                label: `EMI Interest (${selectedCardlessEMIPlanDetails.interest_rate}% flat rate):`,
                value: `৳${emiInterest.toFixed(2)}`,
                color: "text-gray-900"
            });
        }
    }
      
    const shippingCalcDetails = calculateShippingDetails(selectedShippingMethod, shippingMethods, shippingRates, cart);
    
    let shippingDisplayValue = shippingCalcDetails.display;
    let shippingColorValue = shippingCalcDetails.color;

    if (!selectedShippingMethod && showShippingMethods && city) {
      shippingDisplayValue = "Select a shipping method";
    } else if (!selectedShippingMethod && !city) {
       shippingDisplayValue = "Enter city first";
    }
    
    newItems.push({
      label: "Shipping:",
      value: shippingDisplayValue,
      color: shippingColorValue,
    });
    
    const subtotalAmount = cart ? parseFloat(String(cart.subtotal || '0')) : 0;
    const discountAmount = cart ? parseFloat(String(cart.discount || '0')) : 0; // This is general cart discount
    let promoDiscountAmount = 0;
    if (cart && (cart as any).promo_code && (cart as any).promo_code.discount_amount) {
        promoDiscountAmount = parseFloat(String((cart as any).promo_code.discount_amount)) || 0;
    } else if (cart && (cart as any).discount_amount) { // Direct discount on cart
        promoDiscountAmount = parseFloat(String((cart as any).discount_amount)) || 0;
    }

    // Calculate EMI interest if applicable
    let emiInterestAmount = 0;
    if (activeCardEMICalculatedDetails) {
        emiInterestAmount = activeCardEMICalculatedDetails.totalInterest;
    } else if (selectedCardlessEMIPlanDetails && activeCardlessEMIMonthly !== null && activeCardlessEMIFinancedAmount !== null) {
        // Calculate interest for cardless EMI using simple interest formula
        const interestRate = selectedCardlessEMIPlanDetails.interest_rate / 100;
        const tenureYears = selectedCardlessEMIPlanDetails.duration_months / 12;
        emiInterestAmount = activeCardlessEMIFinancedAmount * interestRate * tenureYears;
    }

    let totalToPay = subtotalAmount + shippingCalcDetails.cost - discountAmount - promoDiscountAmount + emiInterestAmount;

    // If Cardless EMI is active, the "Total" in summary might be just the downpayment + shipping
    // Or it could be the full amount, and payment method selection handles the downpayment.
    // For now, let orderTotal from context drive the "Estimated Total" display,
    // and payment selection will clarify what's being paid via SSLCommerz.

    newItems.push({ // This is the main list for the order summary card
      label: "Total:", // This "Total" is fine, it reflects sum of goods + shipping - discounts
      value: `৳${totalToPay.toFixed(2)}`,
      color: "text-gray-900",
    });
    
    console.log('Order Summary Items:', newItems);
    setOrderSummaryItems(newItems);

  }, [cart, selectedShippingMethod, shippingMethods, shippingRates, showShippingMethods, city, activeCardEMICalculatedDetails, selectedCardlessEMIPlanDetails, activeCardlessEMIMonthly, activeCardlessEMIFinancedAmount]);

  // Data for order summary
  // Redirect to cart if cart is empty
  useEffect(() => {
    if (!cartLoading && (!cart || !cart.items || cart.items.length === 0)) {
      toast.error('Your cart is empty');
      navigate('/cart');
    }
  }, [cart, cartLoading, navigate]);

  // Determine if any cart item has EMI selected
  const emiInCart = cart?.items?.some((item: any) => item.emi_selected);

  const validBdCities = [
    { value: "dhaka", label: "Dhaka" },
    { value: "chittagong", label: "Chittagong" },
    { value: "sylhet", label: "Sylhet" },
    { value: "rajshahi", label: "Rajshahi" },
    { value: "khulna", label: "Khulna" },
    { value: "barisal", label: "Barisal" },
    { value: "rangpur", label: "Rangpur" }
  ];

  // Cities options for select - updated to Bangladeshi cities
  const cityOptions: CityOption[] = validBdCities;

  // Country options for select - updated to include Bangladesh
  const countryOptions: CountryOption[] = [
    { value: "bd", label: "Bangladesh" },
    { value: "us", label: "United States" },
    { value: "ca", label: "Canada" },
    { value: "uk", label: "United Kingdom" },
    { value: "au", label: "Australia" },
    { value: "de", label: "Germany" }
  ];

  // Format currency
  const formatCurrency = (value: number | string) => `৳${parseFloat(String(value)).toFixed(2)}`;

  // Calculate shipping cost
  const getShippingCost = () => {
    return selectedShippingMethod === "express" ? 10 : 0;
  };

  // Data for checkout steps
  const checkoutSteps = [
    { number: 1, title: "Delivery Information", active: currentStep >= 1 },
    { number: 2, title: "Shipping Address", active: currentStep >= 2 },
    { number: 3, title: "Payment", active: currentStep >= 3 },
  ];

  const handleCalculateCost = async () => {
    if (!city) {
      toast.error('Please enter a city first');
      return;
    }
    
    setIsCheckingCity(true);
    setCityError(null);
    setSelectedShippingMethod('');
    
    const normalizedCity = city.toLowerCase().trim();
    // Use labels from validBdCities for validation message, or values for checking includes
    const isValidCity = validBdCities.some(c => c.value === normalizedCity || c.label.toLowerCase() === normalizedCity);
    
    if (!isValidCity) {
      setIsCheckingCity(false);
      const enteredCityDisplay = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
      setCityError(`Shipping is not available in ${enteredCityDisplay}. Please contact support.`);
      toast.error(`Shipping is not available in ${enteredCityDisplay}`);
      setShowShippingMethods(false);
      return;
    }
    
    try {
      // fetchShippingMethods expects the city *value* (e.g., 'dhaka')
      // Let's ensure we pass the value if the user typed a label
      const cityDetail = validBdCities.find(c => c.label.toLowerCase() === normalizedCity);
      const cityValueForApi = cityDetail ? cityDetail.value : normalizedCity;

      await fetchShippingMethods(cityValueForApi); 
      setShowShippingMethods(true);
      setCityError(null);
    } catch (error) {
      console.error('Error checking shipping availability:', error);
      setCityError('Failed to check shipping availability. Please try again.');
      toast.error('Failed to check shipping availability');
      setShowShippingMethods(false);
    } finally {
      setIsCheckingCity(false);
    }
  };

  const handleSelectShippingMethod = (methodName: string) => {
    console.log('Selected shipping method (raw):', methodName);
    setSelectedShippingMethod(methodName);

    const details = calculateShippingDetails(methodName, shippingMethods, shippingRates, cart);
    console.log('Calculated shipping details for toast/localStorage:', details);
    
    if (details.isFree) {
      if (details.qualified && details.numericThreshold !== undefined) {
        toast.success(`Free shipping applied! (Order over ৳${details.numericThreshold.toFixed(2)})`);
      } else {
        toast.success('Free shipping applied!');
      }
    } else {
      toast.success(`Shipping cost: ৳${details.cost.toFixed(2)} added`);
    }
    
    try {
      localStorage.setItem('shipping_details', JSON.stringify({
        method: methodName,
        cost: details.cost,
        isFree: details.isFree,
        reason: details.qualified ? 'qualified' : (details.isFree ? 'free' : 'paid')
      }));
    } catch (e) {
      console.error('Error saving shipping details to localStorage:', e);
    }
  };

  const handleContinueToShippingAddress = () => {
    if (!selectedShippingMethod) {
      toast.error('Please select a shipping method');
      return;
    }
    
    const selectedMethodDetails = shippingMethods.find(method => method.name === selectedShippingMethod);
    if (!selectedMethodDetails) {
      toast.error('Invalid shipping method selected. Please try again.');
      return;
    }

    const finalShippingDetails = calculateShippingDetails(selectedShippingMethod, shippingMethods, shippingRates, cart);

    try {
      localStorage.setItem('selected_shipping_method', selectedShippingMethod);
      localStorage.setItem('shipping_details', JSON.stringify({
        method: selectedShippingMethod,
        cost: finalShippingDetails.cost,
        isFree: finalShippingDetails.isFree,
        reason: finalShippingDetails.qualified ? 'qualified' : (finalShippingDetails.isFree ? 'free' : 'paid')
      }));
      console.log('Saved final shipping details on continue:', finalShippingDetails);
    } catch (e) {
      console.error('Error saving shipping details to localStorage on continue:', e);
    }
    
    // Pre-fill shippingAddress.city from the validated step 1 city if not already set by form
    // The `city` state holds the input from step 1.
    // Find the corresponding value from cityOptions.
    const cityForAddress = validBdCities.find(c => c.label.toLowerCase() === city.toLowerCase() || c.value === city.toLowerCase());
    if (cityForAddress && shippingAddress.city !== cityForAddress.value) {
        updateShippingAddress('city', cityForAddress.value);
    }
    // Default country to Bangladesh if not set
    if (!shippingAddress.country) {
        updateShippingAddress('country', 'bd');
    }

    setDeliveryInfoCompleted(true);
    setCurrentStep(2);
    toast.success(`Shipping method '${selectedShippingMethod}' selected`);
  };

  const handleContinueToPayment = () => {
    const requiredFields = ['first_name', 'last_name', 'email', 'address', 'city', 'country', 'postcode']; // Removed 'phone'
    const missingFields = requiredFields.filter(field => {
      const value = shippingAddress[field as keyof typeof shippingAddress];
      return !value || String(value).trim() === "";
    });
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required shipping address fields: ${missingFields.map(f => f.replace('_', ' ')).join(', ')}`);
      return;
    }

    if (!billingAddress.same_as_shipping) {
      const missingBillingFields = requiredFields.filter(field => {
        const value = billingAddress[field as keyof typeof billingAddress];
        return !value || String(value).trim() === "";
      });
      if (missingBillingFields.length > 0) {
        toast.error(`Please fill in all required billing address fields: ${missingBillingFields.map(f => f.replace('_', ' ')).join(', ')}`);
        return;
      }
    }

    setShippingAddressCompleted(true);
    setCurrentStep(3);
  };

  const handleEditDeliveryInfo = () => {
    setCurrentStep(1);
    setDeliveryInfoCompleted(false);
    // Do not reset city input here, user might want to edit it or shipping method
  };

  const handleEditShippingAddress = () => {
    setCurrentStep(2);
    setShippingAddressCompleted(false);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCity(value); // Update local state for the input field in step 1
    
    // When city input for shipping calculation changes, reset selections
    // but don't directly update shippingAddress.city here.
    // shippingAddress.city will be set via dropdown or on continue to step 2.
    setShowShippingMethods(false);
    setSelectedShippingMethod('');
    setCityError(null);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    updateShippingAddress('country', value);
  };

  const handleBillingCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    updateBillingAddress('city', value);
  };

  const handleBillingCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    updateBillingAddress('country', value);
  };

  const handleSameAsBillingChange = () => {
    setSameAsBilling(!billingAddress.same_as_shipping);
  };

  // Function to handle payment method selection
  const handleSelectPaymentMethod = (methodId: string) => {
    // Prevent selecting COD if any EMI option is in the cart
    if (methodId === "COD" && emiInCart) {
      toast.error("EMI payment is not compatible with Cash on Delivery. Please select an online payment method.");
      return;
    }

    // If an EMI option is in the cart and user selects a non-EMI payment method,
    // redirect them to the appropriate EMI payment option
    if (emiInCart && 
        !["SSLCOMMERZ_CARD_EMI", "SSLCOMMERZ_CARDLESS_EMI"].includes(methodId)) {
      // Determine which EMI type to use
      const emiMethod = cartHasCardEMI ? "SSLCOMMERZ_CARD_EMI" : "SSLCOMMERZ_CARDLESS_EMI";
      updatePaymentDetails('payment_method', emiMethod);
      toast.error(`EMI payment requires using ${emiMethod === "SSLCOMMERZ_CARD_EMI" ? "Card EMI" : "Cardless EMI"} payment option.`);
      return;
    }
    
    // If switching from Card EMI to Cardless EMI, clear the bank selection
    if (methodId === "SSLCOMMERZ_CARDLESS_EMI" && paymentDetails.payment_method === "SSLCOMMERZ_CARD_EMI") {
      // No need to select bank for Cardless EMI
      console.log('Clearing bank selection when switching to Cardless EMI');
      setSelectedBank('');
    }
    
    // Update the payment method
    updatePaymentDetails('payment_method', methodId);
  };

  const handleNidFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNidFrontPhoto(e.target.files[0]);
    }
  };

  const handleNidBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNidBackPhoto(e.target.files[0]);
    }
  };

  const handleProceedToPaymentGateway = async (chosenPaymentMethodKey: string) => {
    setIsProcessingPayment(true);
    updatePaymentDetails('payment_method', chosenPaymentMethodKey);

    if (chosenPaymentMethodKey === "SSLCOMMERZ_CARDLESS_EMI") {
        // Validate all required fields for cardless EMI
        if (!nidFrontPhoto || !nidBackPhoto) {
            toast.error("NID front and back photos are required for Cardless EMI.");
            setIsProcessingPayment(false);
            return;
        }
        if (!jobTitle.trim()) {
            toast.error("Job title is required for Cardless EMI.");
            setIsProcessingPayment(false);
            return;
        }
        if (!salary || parseFloat(salary) <= 0) {
            toast.error("Monthly salary is required for Cardless EMI.");
            setIsProcessingPayment(false);
            return;
        }
        
        // Check EMI plan details exist
        if (!selectedCardlessEMIPlanDetails || activeCardlessEMIDownpayment === null) {
            toast.error("EMI plan details couldn't be calculated. Please try a different payment method.");
            setIsProcessingPayment(false);
            return;
        }
    }
    
    // For Card EMI, check if a bank is selected
    if (chosenPaymentMethodKey === "SSLCOMMERZ_CARD_EMI" && !selectedBank) {
      toast.error("Please select your bank for EMI processing");
      setIsProcessingPayment(false);
      return;
    }

    try {
      // For cardless EMI, prepare the EMI application data
      let emiApplicationData = null;
      if (chosenPaymentMethodKey === "SSLCOMMERZ_CARDLESS_EMI" && selectedCardlessEMIPlanDetails) {
        emiApplicationData = {
          emi_plan_id: selectedCardlessEMIPlanDetails.id,
          job_title: jobTitle,
          monthly_salary: parseFloat(salary),
          nid_front_image: nidFrontPhoto,
          nid_back_image: nidBackPhoto,
          product_price: activeCardlessEMIBasePrice,
          down_payment_amount: activeCardlessEMIDownpayment,
          monthly_installment: activeCardlessEMIMonthly,
          tenure_months: selectedCardlessEMIPlanDetails.duration_months,
          interest_rate: selectedCardlessEMIPlanDetails.interest_rate
        };
      }

      // placeOrder() should ideally create the order with all details, including line items and total value.
      // The payment_method in the order payload might indicate the intended final payment method.
      const orderResponse = await placeOrder(emiApplicationData); 

      if (orderResponse && orderResponse.id && orderResponse.order_id) { // Assuming orderResponse contains id (DB PK) and order_id (user-facing)
        toast.success(`Order placed (ID: ${orderResponse.order_id}). Redirecting to payment...`);
        
        let amountForSSLCommerz: number | undefined = undefined;
        let paymentPayloadForContext: any = { 
          chosenPaymentMethodKey,
        }; // Base payload

        if (chosenPaymentMethodKey === "SSLCOMMERZ_CARDLESS_EMI" && activeCardlessEMIDownpayment !== null) {
          // For Cardless EMI, user only pays the downpayment initially
          amountForSSLCommerz = activeCardlessEMIDownpayment;
          paymentPayloadForContext.amount = amountForSSLCommerz;
          paymentPayloadForContext.transactionType = 'DOWN_PAYMENT'; // Inform context this is specific
          paymentPayloadForContext.total_with_interest = calculatedOrderTotal; // Pass the total with interest for record keeping
        } else if (chosenPaymentMethodKey === "SSLCOMMERZ_CARD_EMI") {
          // Card EMI full amount transaction
          if (activeCardEMICalculatedDetails) {
            amountForSSLCommerz = activeCardEMICalculatedDetails.baseAmount;
            paymentPayloadForContext.amount = amountForSSLCommerz;
          }
          paymentPayloadForContext.transactionType = 'EMI_FULL_AMOUNT';
          
          // Add selected bank for Card EMI
          if (selectedBank) {
            paymentPayloadForContext.selected_bank = selectedBank;
          }
        } else if (chosenPaymentMethodKey === "SSLCOMMERZ_STANDARD") {
          // For standard SSLCommerz, it's the orderTotal from context (which should be the final payable amount)
          amountForSSLCommerz = calculatedOrderTotal; // Use calculated order total which includes EMI interest
          paymentPayloadForContext.amount = amountForSSLCommerz;
          paymentPayloadForContext.transactionType = 'REGULAR_FULL_AMOUNT';
        }
        // If chosenPaymentMethodKey is 'cashOnDelivery', initiateSSLCommerzPayment won't be called.

        if (chosenPaymentMethodKey.startsWith("SSLCOMMERZ")) {
          // The initiateSSLCommerzPayment function in CheckoutContext will need to be updated 
          // to accept an object like paymentPayloadForContext or individual parameters.
          // For now, we are preparing the data. The actual signature change is in the context.
          const paymentInitResponse = await initiateSSLCommerzPayment(orderResponse.id, paymentPayloadForContext);

          if (paymentInitResponse.redirect_url) {
            window.location.href = paymentInitResponse.redirect_url;
          } else {
            toast.error(paymentInitResponse.error || "Failed to initiate payment session. Please try again.");
            console.error("SSLCommerz init error:", paymentInitResponse.error);
          }
        } else if (chosenPaymentMethodKey === "cashOnDelivery") {
          // Handle Cash on Delivery success (e.g., redirect to an order confirmation page)
          // toast.success(`Order placed successfully with Cash on Delivery (ID: ${orderResponse.order_id})`);
          // navigate(`/order-confirmation/${orderResponse.order_id}`); // Example redirect
          // For now, the existing success toast for order placement is sufficient.
          // The user is not redirected away from checkout for COD by this function.
        }

      } else {
        toast.error(error || "Failed to finalize order before payment. Please check your details.");
      }
    } catch (e: any) {
      toast.error(e.message || "An unexpected error occurred during payment setup.");
      console.error("Error in handleProceedToPaymentGateway:", e);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // EMI Calculation Helper
  const calculateEmiDetails = () => {
    if (!cart || !cart.items || cart.items.length === 0) return null;
    
    // Determine if we are looking for Card EMI or Cardless EMI details based on current selection
    // This function is primarily for the Order Summary's "EMI Breakdown" card.
    // The main payment section will show its own EMI details.
    let targetPlanType: 'card_emi' | 'cardless_emi' | null = null;
    if (paymentDetails.payment_method === "SSLCOMMERZ_CARD_EMI") {
      targetPlanType = 'card_emi';
    } else if (paymentDetails.payment_method === "SSLCOMMERZ_CARDLESS_EMI") {
      targetPlanType = 'cardless_emi';
    }

    if (!targetPlanType) return null; // Not an EMI payment method selected for the summary card

    let selectedCartItemForEMI = null;
    for (const item of cart.items) {
      if (item.emi_selected && item.product && item.product.emi_plans) {
        const plan = item.product.emi_plans.find(p => p.id === item.emi_period && p.plan_type === targetPlanType);
        if (plan) {
          selectedCartItemForEMI = { ...item, resolved_plan: plan };
          break; // Found the relevant item and plan
        }
      }
    }

    if (!selectedCartItemForEMI || !selectedCartItemForEMI.resolved_plan) return null;

    const planParams = selectedCartItemForEMI.resolved_plan;
    const productPrice = parseFloat(String(selectedCartItemForEMI.product.sale_price || selectedCartItemForEMI.product.price || '0'));
    const quantity = selectedCartItemForEMI.quantity;
    
    // For simplicity, EMI breakdown for the summary card is based on the first eligible item.
    // If multiple EMI items, this might need more complex aggregation or selection logic.
    const baseAmount = productPrice * quantity; 

    const downPaymentPercent = planParams.down_payment_percentage || 0;
    const tenureMonths = planParams.duration_months || 1;

    // Different calculation based on EMI type
    if (targetPlanType === 'card_emi') {
      // For Card EMI - Interest is handled by SSLCOMMERZ and the bank, so we don't add it
      // We just show the basic information that will be passed to SSLCOMMERZ
      const downPayment = downPaymentPercent > 0 ? baseAmount * (downPaymentPercent / 100) : 0;
      const financedAmount = baseAmount - downPayment;
      
      // For Card EMI, we show estimated monthly amount without our own interest calculation
      // as SSLCOMMERZ and the bank will handle the actual interest calculation
      const monthlyInstallment = tenureMonths > 0 ? financedAmount / tenureMonths : financedAmount;
      
      return {
        downPayment,
        financedAmount,
        totalInterest: 0, // Set to 0 as we don't calculate this
        totalPayable: baseAmount, // Just the base amount
        monthlyInstallment,
        tenureMonths,
        interestPercent: 0, // Set to 0 as it's handled by SSLCOMMERZ/bank
        downPaymentPercent,
        baseAmount,
        planName: planParams.plan_name || planParams.name || `${tenureMonths}-month EMI`
      };
    } else {
      // For Cardless EMI - We calculate our own interest
      const interestPercent = planParams.interest_rate || 0;
      const downPayment = baseAmount * (downPaymentPercent / 100);
      const financedAmount = baseAmount - downPayment;
      
      // Use flat interest rate for entire period (not annual)
      const totalInterest = financedAmount * (interestPercent / 100);
      const totalPayable = financedAmount + totalInterest;
      const monthlyInstallment = tenureMonths > 0 ? totalPayable / tenureMonths : totalPayable;

      return {
        downPayment,
        financedAmount,
        totalInterest,
        totalPayable: downPayment + totalPayable, // Include down payment in total
        monthlyInstallment,
        tenureMonths,
        interestPercent,
        downPaymentPercent,
        baseAmount,
        planName: planParams.plan_name || planParams.name || `${tenureMonths}-month EMI`
      };
    }
  };

  // Reset shipping methods when city changes
  useEffect(() => {
    if (city === '') {
      setShowShippingMethods(false);
      setSelectedShippingMethod('');
      setCityError(null);
    }
  }, [city]);
  
  // This effect will always run and handles the case where there's no cart
  // Adding it here to ensure hooks are always called in the same order
  useEffect(() => {
    // Empty effect to maintain hook order consistency
  }, []);

  // This will ensure all hooks are called in the same order in all renders
  useEffect(() => {
    // Another empty effect to prevent hooks order issues
  }, []);
  
  useEffect(() => {
    // Yet another empty effect to maintain hook order
  }, []);
  
  useEffect(() => {
    // Final safety net for hooks order consistency
  }, []);

  // Show loading state if cart is loading
  if (cartLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primarymain mb-4"></div>
        <p className="text-gray-600">Loading your checkout information...</p>
      </div>
    );
  }

  // Show error if cart couldn't be loaded
  if (!cart) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-16">
        <div className="max-w-md text-center">
          <h2 className="font-heading-desktop-h4 text-gray-900 mb-4">Unable to load cart</h2>
          <p className="text-gray-600 mb-6">There was a problem loading your cart information.</p>
          <Button 
            onClick={() => navigate('/cart')}
            className="bg-primarymain hover:bg-primarymain/90 text-white-100"
          >
            Return to Cart
          </Button>
        </div>
      </div>
    );
  }

  // Calculate order totals
  useEffect(() => {
    if (cart) {
      // Calculate shipping cost
      const shippingDetails = calculateShippingDetails(
        selectedShippingMethod,
        shippingMethods,
        shippingRates,
        cart
      );

      // Calculate EMI interest if applicable
      let emiInterest = 0;
      let emiInterestDisplay = '';
      let totalWithInterest = parseFloat(String(cart.total_price || '0'));
      
      if (activeCardEMICalculatedDetails) {
        emiInterest = activeCardEMICalculatedDetails.totalInterest;
        emiInterestDisplay = `EMI Interest (${activeCardEMICalculatedDetails.interestPercent}% flat rate): ${formatCurrency(emiInterest)}`;
        // For Card EMI, interest is handled by SSLCOMMERZ/bank, so we don't add it to our total
        // totalWithInterest remains the same
      } else if (selectedCardlessEMIPlanDetails && activeCardlessEMIMonthly !== null && activeCardlessEMIFinancedAmount !== null) {
        // Calculate interest for cardless EMI - flat rate for the entire period
        const interestRate = selectedCardlessEMIPlanDetails.interest_rate / 100;
        emiInterest = activeCardlessEMIFinancedAmount * interestRate;
        emiInterestDisplay = `EMI Interest (${selectedCardlessEMIPlanDetails.interest_rate}% flat rate): ${formatCurrency(emiInterest)}`;
        // For Cardless EMI, add the interest to the total
        totalWithInterest += emiInterest;
      }

      // Update order summary
      const updatedSummaryItems = [
        {
          label: "Subtotal:",
          value: formatCurrency(cart.total_price || '0'),
          color: "text-gray-900"
        },
        {
          label: "Shipping:",
          value: shippingDetails.display,
          color: shippingDetails.color
        }
      ];

      // Add EMI interest if applicable
      if (emiInterest > 0) {
        updatedSummaryItems.push({
          label: "EMI Interest:",
          value: formatCurrency(emiInterest),
          color: "text-gray-900"
        });
      }

      // Calculate final total with EMI interest and shipping
      const finalTotal = totalWithInterest + shippingDetails.cost;
      setCalculatedOrderTotal(finalTotal);
      
      updatedSummaryItems.push({
        label: "Total:",
        value: formatCurrency(finalTotal),
        color: "text-gray-900"
      });

      setOrderSummaryItems(updatedSummaryItems);
    }
  }, [cart, selectedShippingMethod, shippingMethods, shippingRates, shippingCost, activeCardEMICalculatedDetails, selectedCardlessEMIPlanDetails, activeCardlessEMIMonthly, activeCardlessEMIFinancedAmount]);

  // Effect to automatically set appropriate payment method when EMI status changes
  useEffect(() => {
    // If cart has Card EMI, set payment method to SSLCOMMERZ_CARD_EMI
    if (cartHasCardEMI && paymentDetails.payment_method !== "SSLCOMMERZ_CARD_EMI") {
      updatePaymentDetails('payment_method', "SSLCOMMERZ_CARD_EMI");
    } 
    // If cart has Cardless EMI but no Card EMI, set payment method to SSLCOMMERZ_CARDLESS_EMI
    else if (selectedCardlessEMIPlanDetails && !cartHasCardEMI && 
             paymentDetails.payment_method !== "SSLCOMMERZ_CARDLESS_EMI") {
      updatePaymentDetails('payment_method', "SSLCOMMERZ_CARDLESS_EMI");
    }
    // If cart has EMI but payment method is COD, update to appropriate payment method
    else if ((cartHasCardEMI || selectedCardlessEMIPlanDetails) && 
             paymentDetails.payment_method === "COD") {
      const emiMethod = cartHasCardEMI ? "SSLCOMMERZ_CARD_EMI" : "SSLCOMMERZ_CARDLESS_EMI";
      updatePaymentDetails('payment_method', emiMethod);
    }
      }, [cartHasCardEMI, selectedCardlessEMIPlanDetails, paymentDetails.payment_method, updatePaymentDetails]);

  // Fetch available banks when component mounts
  useEffect(() => {
    const fetchAvailableBanks = async () => {
      setBanksLoading(true);
      try {
        const response = await emiService.getAvailableBanks();
        if (response.status === 'success' && response.banks) {
          setAvailableBanks(response.banks);
        }
      } catch (error) {
        console.error('Error fetching available banks:', error);
      } finally {
        setBanksLoading(false);
      }
    };

    fetchAvailableBanks();
  }, []);

  return (
    <div className="w-full">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="link"
            className="p-0 h-auto font-navigation-nav-link-small text-gray-700"
            onClick={() => navigate('/')}
          >
            Home
          </Button>
          <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400" />
          <Button
            variant="link"
            className="p-0 h-auto font-navigation-nav-link-small text-gray-700"
            onClick={() => navigate('/cart')}
          >
            Cart
          </Button>
          <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-navigation-nav-link-small text-gray-400">
            Checkout
          </span>
        </div>
      </div>

      {/* Main Content and Order Summary */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1">
          {/* Delivery Information */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              {deliveryInfoCompleted ? (
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                  <CheckIcon className="h-4 w-4 text-gray-700" />
                </div>
              ) : (
                <div className="flex items-center justify-center w-8 h-8 bg-primarymain text-white rounded-full">
                  <span className="text-xs font-semibold">1</span>
                </div>
              )}
              <h2 className="text-lg font-semibold text-gray-900 flex-1">Delivery Information</h2>
              {deliveryInfoCompleted && (
                <Button
                  variant="link"
                  className="text-gray-700 text-sm underline p-0 h-auto"
                  onClick={handleEditDeliveryInfo}
                >
                  Edit
                </Button>
              )}
            </div>

            {currentStep === 1 ? (
              <div className="mb-4">
                <p className="text-gray-600 text-sm mb-4">
                  Enter your City to see the delivery and collection options available in your area.
                </p>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <Input
                      id="city"
                      type="text"
                      value={city}
                      onChange={handleCityChange}
                      className={`mt-1 ${cityError ? 'border-red-500' : ''}`}
                      placeholder="Enter your city"
                    />
                    {cityError && (
                      <p className="mt-1 text-sm text-red-500">{cityError}</p>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleCalculateCost}
                      className="mt-2"
                      disabled={!city || isCheckingCity}
                    >
                      {isCheckingCity ? (
                        <>
                          <span className="animate-spin mr-2">⟳</span>
                          Checking...
                        </>
                      ) : (
                        'Calculate cost and availability'
                      )}
                    </Button>
                  </div>
                </div>

                {/* Shipping Methods */}
                {showShippingMethods && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-4">Select Shipping Method</h3>
                    <div className="space-y-4">
                      {isLoading ? (
                        <div className="flex items-center justify-center p-6">
                          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primarymain"></div>
                          <span className="ml-3 text-gray-600">Loading shipping methods...</span>
                        </div>
                      ) : shippingMethods && shippingMethods.length > 0 ? (
                        <>
                          {shippingMethods.map((method) => {
                            // Calculate display for each method using the helper
                            const methodDisplayDetails = calculateShippingDetails(method.name, shippingMethods, shippingRates, cart);
                            return (
                          <div
                            key={method.id}
                            className={`p-4 border rounded-lg cursor-pointer ${
                              selectedShippingMethod === method.name
                                ? 'border-primarymain bg-primarylight'
                                : 'border-gray-200'
                            }`}
                            onClick={() => handleSelectShippingMethod(method.name)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium">{method.name}</h4>
                                <p className="text-sm text-gray-600">{method.description}</p>
                                <p className="text-sm text-gray-600">
                                      Delivery Time: {method.delivery_time || `${method.min_delivery_time || 1}-${method.max_delivery_time || 5} days`}
                                </p>
                              </div>
                              <div className="text-right">
                                    <p className={`font-medium ${methodDisplayDetails.color}`}>
                                      {methodDisplayDetails.display}
                                    </p>
                                    {methodDisplayDetails.numericThreshold !== undefined && (
                                  <p className="text-sm text-gray-600">
                                        Free shipping on orders over ৳{methodDisplayDetails.numericThreshold.toFixed(2)}
                                      </p>
                                    )}
                                     {!methodDisplayDetails.numericThreshold && methodDisplayDetails.cost > 0 && (
                                      <p className="text-sm text-gray-600">
                                        Standard rate applies
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                            );
                          })}
                          
                          {/* Continue Button - Only show if a shipping method is selected */}
                          {selectedShippingMethod && (
                            <Button 
                              className="flex items-center justify-center gap-2 px-6 py-3 w-full bg-primarymain text-white-100 rounded-lg mt-6"
                              onClick={handleContinueToShippingAddress}
                            >
                              Continue to Shipping Address
                              <ChevronRightIcon className="w-[18px] h-[18px]" />
                            </Button>
                          )}
                        </>
                      ) : (
                        <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-lg">
                          <p className="text-gray-700">No shipping methods available for this location. Please contact customer support to request shipping to your area.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4 pl-14">
                <div className="flex flex-col gap-2">
                  <div className="font-medium text-gray-900 text-sm">
                    City
                  </div>
                  <div className="text-gray-600 text-sm">
                    {deliveryInfoCompleted && shippingAddress.city 
                      ? (cityOptions.find(c => c.value === shippingAddress.city)?.label || shippingAddress.city) 
                      : (city || "Not set")}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="font-medium text-gray-900 text-sm">
                    Shipping Method
                  </div>
                  <div className="text-gray-600 text-sm">
                    {(() => {
                      const details = calculateShippingDetails(selectedShippingMethod, shippingMethods, shippingRates, cart);
                      if (!selectedShippingMethod) return "Not selected";
                      return `${selectedShippingMethod} (${details.display})`;
                    })()}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="font-medium text-gray-900 text-sm">
                    Estimated delivery date
                  </div>
                  <div className="text-gray-600 text-sm">
                    {(() => {
                      if (selectedShippingMethod) {
                        const method = shippingMethods.find(m => m.name === selectedShippingMethod);
                        if (method) {
                          if (method.delivery_time) {
                            return method.delivery_time;
                          }
                          if (method.min_delivery_time && method.max_delivery_time) {
                            const minDays = method.min_delivery_time;
                            const maxDays = method.max_delivery_time;
                            if (minDays === maxDays) return `${minDays} day${minDays > 1 ? 's' : ''}`;
                            return `${minDays}-${maxDays} days`;
                          }
                          return "Details unavailable";
                        }
                      }
                      return deliveryInfoCompleted ? "Details unavailable" : "Select shipping method";
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Shipping Address */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              {shippingAddressCompleted ? (
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                  <CheckIcon className="h-4 w-4 text-gray-700" />
                </div>
              ) : (
                <div className={`flex items-center justify-center w-8 h-8 ${currentStep >= 2 ? "bg-primarymain text-white" : "bg-gray-200 text-gray-700"} rounded-full`}>
                  <span className="text-xs font-semibold">2</span>
                </div>
              )}
              <h2 className={`text-lg font-semibold ${currentStep >= 2 ? "text-gray-900" : "text-gray-500"}`}>Shipping Address</h2>
              {shippingAddressCompleted && (
                <Button
                  variant="link"
                  className="text-gray-700 text-sm underline p-0 h-auto ml-auto"
                  onClick={handleEditShippingAddress}
                >
                  Edit
                </Button>
              )}
            </div>

            {currentStep === 2 ? (
              <div className="flex flex-col gap-6 pl-14">
                <div className="flex flex-col gap-4 w-full">
                  <div className="flex flex-col gap-6 w-full">
                    {/* Name Fields */}
                    <div className="flex gap-6 w-full">
                      <div className="flex flex-col gap-2 flex-1">
                        <label className="text-sm font-medium text-gray-900">
                          First name <span className="text-red-500">*</span>
                        </label>
                        <Input 
                          className="px-4 py-[9px] bg-white rounded-lg border border-solid border-gray-300" 
                          value={shippingAddress.first_name}
                          onChange={(e) => updateShippingAddress('first_name', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-2 flex-1">
                        <label className="text-sm font-medium text-gray-900">
                          Last name <span className="text-red-500">*</span>
                        </label>
                        <Input 
                          className="px-4 py-[9px] bg-white rounded-lg border border-solid border-gray-300" 
                          value={shippingAddress.last_name}
                          onChange={(e) => updateShippingAddress('last_name', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Contact Fields */}
                    <div className="flex gap-6 w-full">
                      <div className="flex flex-col gap-2 flex-1">
                        <label className="text-sm font-medium text-gray-900">
                          Email address <span className="text-red-500">*</span>
                        </label>
                        <Input 
                          className="px-4 py-[9px] bg-white rounded-lg border border-solid border-gray-300" 
                          value={shippingAddress.email}
                          onChange={(e) => updateShippingAddress('email', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-2 flex-1">
                        <label className="text-sm font-medium text-gray-900">
                          Mobile number
                        </label>
                        <Input 
                          className="px-4 py-[9px] bg-white rounded-lg border border-solid border-gray-300" 
                          value={shippingAddress.phone}
                          onChange={(e) => updateShippingAddress('phone', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Country Field */}
                    <div className="flex flex-col gap-2 w-full">
                      <label className="text-sm font-medium text-gray-900">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <div className="w-full">
                        <Select
                          options={countryOptions}
                          value={shippingAddress.country}
                          onChange={(e) => updateShippingAddress('country', e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Location Fields */}
                    <div className="flex gap-6 w-full">
                      <div className="flex flex-col gap-2 flex-1">
                        <label className="text-sm font-medium text-gray-900">
                          City <span className="text-red-500">*</span>
                        </label>
                        <div className="w-full">
                          <Select
                            options={cityOptions}
                            value={shippingAddress.city}
                            onChange={(e) => updateShippingAddress('city', e.target.value)}
                            className="w-full"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-1">
                        <label className="text-sm font-medium text-gray-900">
                          Postcode <span className="text-red-500">*</span>
                        </label>
                        <Input
                          className="px-4 py-3 bg-white rounded-lg border border-solid border-gray-300"
                          value={shippingAddress.postcode}
                          onChange={(e) => updateShippingAddress('postcode', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Address Field */}
                    <div className="flex flex-col gap-2 w-full">
                      <label className="text-sm font-medium text-gray-900">
                        House / apartment number and street address{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <Input 
                        className="px-4 py-[9px] bg-white rounded-lg border border-solid border-gray-300" 
                        value={shippingAddress.address}
                        onChange={(e) => updateShippingAddress('address', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Add Address Lines Button */}
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1.5 px-0 py-2.5 text-gray-700 text-sm"
                  >
                    Add address lines
                    <PlusIcon className="w-4 h-4" />
                  </Button>
                </div>

                {/* Billing Address Section */}
                <div className="flex flex-col gap-4 w-full">
                  <div className="flex items-center gap-2 w-full">
                    <h3 className="font-semibold text-gray-900">
                      Billing address
                    </h3>
                    <InfoIcon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex items-center gap-2 w-full">
                    <div 
                      className="w-5 h-5 relative flex items-center justify-center cursor-pointer"
                      onClick={handleSameAsBillingChange}
                    >
                      <div className={`w-4 h-4 border ${billingAddress.same_as_shipping ? 'bg-primarymain border-primarymain' : 'bg-white border-gray-300'} rounded-sm`}></div>
                      {billingAddress.same_as_shipping && <CheckIcon className="w-3 h-3 text-white absolute" />}
                    </div>
                    <div className="flex-1 text-gray-600 text-sm">
                      Same as delivery address
                    </div>
                  </div>
                </div>

                {/* Billing Address Form (Only shown if not same as delivery) */}
                {!billingAddress.same_as_shipping && (
                  <div className="flex flex-col gap-4 w-full mt-4">
                    <h3 className="font-semibold text-gray-900">
                      Billing Address Details
                    </h3>
                    
                    <div className="flex flex-col gap-6 w-full">
                      {/* Name Fields */}
                      <div className="flex gap-6 w-full">
                        <div className="flex flex-col gap-2 flex-1">
                          <label className="text-sm font-medium text-gray-900">
                            First name <span className="text-red-500">*</span>
                          </label>
                          <Input 
                            className="px-4 py-[9px] bg-white rounded-lg border border-solid border-gray-300" 
                            value={billingAddress.first_name}
                            onChange={(e) => updateBillingAddress('first_name', e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                          <label className="text-sm font-medium text-gray-900">
                            Last name <span className="text-red-500">*</span>
                          </label>
                          <Input 
                            className="px-4 py-[9px] bg-white rounded-lg border border-solid border-gray-300" 
                            value={billingAddress.last_name}
                            onChange={(e) => updateBillingAddress('last_name', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Contact Fields */}
                      <div className="flex gap-6 w-full">
                        <div className="flex flex-col gap-2 flex-1">
                          <label className="text-sm font-medium text-gray-900">
                            Email address <span className="text-red-500">*</span>
                          </label>
                          <Input 
                            className="px-4 py-[9px] bg-white rounded-lg border border-solid border-gray-300" 
                            value={billingAddress.email}
                            onChange={(e) => updateBillingAddress('email', e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                          <label className="text-sm font-medium text-gray-900">
                            Mobile number
                          </label>
                          <Input 
                            className="px-4 py-[9px] bg-white rounded-lg border border-solid border-gray-300" 
                            value={billingAddress.phone}
                            onChange={(e) => updateBillingAddress('phone', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Country Field */}
                      <div className="flex flex-col gap-2 w-full">
                        <label className="text-sm font-medium text-gray-900">
                          Country <span className="text-red-500">*</span>
                        </label>
                        <div className="w-full">
                          <Select
                            options={countryOptions}
                            value={billingAddress.country}
                            onChange={(e) => updateBillingAddress('country', e.target.value)}
                            className="w-full"
                          />
                        </div>
                      </div>

                      {/* Location Fields */}
                      <div className="flex gap-6 w-full">
                        <div className="flex flex-col gap-2 flex-1">
                          <label className="text-sm font-medium text-gray-900">
                            City <span className="text-red-500">*</span>
                          </label>
                          <div className="w-full">
                            <Select
                              options={cityOptions}
                              value={billingAddress.city}
                              onChange={(e) => updateBillingAddress('city', e.target.value)}
                              className="w-full"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                          <label className="text-sm font-medium text-gray-900">
                            Postcode <span className="text-red-500">*</span>
                          </label>
                          <Input
                            className="px-4 py-3 bg-white rounded-lg border border-solid border-gray-300"
                            value={billingAddress.postcode}
                            onChange={(e) => updateBillingAddress('postcode', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Address Field */}
                      <div className="flex flex-col gap-2 w-full">
                        <label className="text-sm font-medium text-gray-900">
                          House / apartment number and street address{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <Input 
                          className="px-4 py-[9px] bg-white rounded-lg border border-solid border-gray-300" 
                          value={billingAddress.address}
                          onChange={(e) => updateBillingAddress('address', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Continue Button */}
                <Button 
                  className="flex items-center justify-center gap-2 px-6 py-3 w-full bg-primarymain text-white-100 rounded-lg"
                  onClick={handleContinueToPayment}
                >
                  Continue
                  <ChevronRightIcon className="w-[18px] h-[18px]" />
                </Button>
              </div>
            ) : (
              shippingAddressCompleted && (
                <div className="flex flex-col gap-4 pl-14">
                  <div className="flex flex-col gap-2">
                    <div className="font-medium text-gray-900 text-sm">
                      Name
                    </div>
                    <div className="text-gray-600 text-sm">
                      {shippingAddress.first_name} {shippingAddress.last_name}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="font-medium text-gray-900 text-sm">
                      Email
                    </div>
                    <div className="text-gray-600 text-sm">
                      {shippingAddress.email}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="font-medium text-gray-900 text-sm">
                      Phone
                    </div>
                    <div className="text-gray-600 text-sm">
                      {shippingAddress.phone || "Not provided"}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="font-medium text-gray-900 text-sm">
                      Address
                    </div>
                    <div className="text-gray-600 text-sm">
                      {shippingAddress.address}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="font-medium text-gray-900 text-sm">
                      City
                    </div>
                    <div className="text-gray-600 text-sm">
                      {cityOptions.find(c => c.value === shippingAddress.city)?.label || shippingAddress.city}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="font-medium text-gray-900 text-sm">
                      Billing Address
                    </div>
                    <div className="text-gray-600 text-sm">
                      {billingAddress.same_as_shipping 
                        ? "Same as shipping address" 
                        : billingAddress.first_name + " " + billingAddress.last_name + ", " + billingAddress.address + ", " + (cityOptions.find(c => c.value === billingAddress.city)?.label || billingAddress.city)}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Payment */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className={`flex items-center justify-center w-8 h-8 ${currentStep === 3 ? "bg-primarymain text-white" : "bg-gray-200 text-gray-700"} rounded-full`}>
                <span className="text-xs font-semibold">3</span>
              </div>
              <h2 className={`text-lg font-semibold ${currentStep === 3 ? "text-gray-900" : "text-gray-500"}`}>Payment</h2>
              {shippingAddressCompleted && currentStep !== 3 && (
                <Button
                  variant="link"
                  className="text-gray-700 text-sm underline p-0 h-auto ml-auto"
                  onClick={handleEditShippingAddress}
                >
                  Edit
                </Button>
              )}
            </div>
            
            {currentStep === 3 && (
              <div className="pl-14">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold mb-4">Choose Payment Method</h3>
                    <div className="space-y-3">
                      {/* Scenario 1: Card EMI Selected */}
                      {cartHasCardEMI && (
                      <div
                        className={`flex flex-col p-4 border rounded-lg cursor-pointer ${
                              paymentDetails.payment_method === "SSLCOMMERZ_CARD_EMI"
                            ? "border-primarymain bg-blue-50"
                            : "border-gray-200"
                        }`}
                          onClick={() => handleSelectPaymentMethod("SSLCOMMERZ_CARD_EMI")}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                paymentDetails.payment_method === "SSLCOMMERZ_CARD_EMI"
                              ? "border-primarymain bg-primarymain"
                              : "border-gray-300"
                          }`}>
                                {paymentDetails.payment_method === "SSLCOMMERZ_CARD_EMI" && (
                              <CheckIcon className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div className="ml-3 flex items-center gap-2">
                            <div className="rounded-full bg-gray-100 p-2">
                                  <CreditCardIcon className="h-5 w-5 text-primarymain" />
                            </div>
                            <span className="text-base font-medium text-gray-900">SSLCOMMERZ EMI Payment System</span>
                          </div>
                        </div>
                        
                        {/* Additional Card EMI content when selected */}
                        {paymentDetails.payment_method === "SSLCOMMERZ_CARD_EMI" && (
                          <div className="mt-4 ml-8 space-y-4">
                            {/* Bank selection dropdown */}
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Select Your Bank <span className="text-red-500">*</span>
                              </label>
                              <select
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primarymain focus:border-primarymain"
                                value={selectedBank}
                                onChange={(e) => setSelectedBank(e.target.value)}
                                required
                                disabled={banksLoading}
                              >
                                <option value="">
                                  {banksLoading ? "Loading banks..." : "-- Select Bank --"}
                                </option>
                                {availableBanks.map((bank) => (
                                  <option key={bank.code} value={bank.code}>
                                    {bank.name}
                                    {bank.interest_rate ? ` (${bank.interest_rate}% interest)` : ''}
                                  </option>
                                ))}
                              </select>
                              {!selectedBank && paymentDetails.payment_method === 'SSLCOMMERZ_CARD_EMI' && (
                                <p className="text-red-500 text-xs mt-1">
                                  Please select your bank for EMI processing
                                </p>
                              )}
                            </div>
                            
                            {/* EMI information */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <h4 className="font-medium text-sm mb-2">EMI Details</h4>
                              {activeCardEMICalculatedDetails && (
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Total Amount:</span>
                                    <span className="font-medium">{formatCurrency(activeCardEMICalculatedDetails.baseAmount)}</span>
                                  </div>
                                  
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Tenure:</span>
                                    <span className="font-medium">{activeCardEMICalculatedDetails.tenureMonths} months</span>
                                  </div>
                                  
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Estimated Monthly Payment:</span>
                                    <span className="font-medium">{formatCurrency(activeCardEMICalculatedDetails.monthlyInstallment)}</span>
                                  </div>
                                  
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Interest Rate:</span>
                                    <span className="font-medium">
                                      {selectedBank && availableBanks.find(b => b.code === selectedBank)?.interest_rate 
                                        ? `${availableBanks.find(b => b.code === selectedBank)?.interest_rate}%`
                                        : 'Determined by bank'
                                      }
                                    </span>
                                  </div>
                                </div>
                              )}
                              <p className="text-xs mt-3 flex items-center gap-1 text-blue-700">
                                <InfoIcon className="h-4 w-4 flex-shrink-0 text-blue-500" />
                                The actual EMI amount and interest rate will be determined by your bank. You will see the final terms before payment confirmation.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      )}
                      
                      {/* Scenario 2: Cardless EMI Selected */}
                      {selectedCardlessEMIPlanDetails && (
                      <div
                        className={`flex flex-col p-4 border rounded-lg cursor-pointer ${
                              paymentDetails.payment_method === "SSLCOMMERZ_CARDLESS_EMI"
                            ? "border-primarymain bg-blue-50"
                            : "border-gray-200"
                        }`}
                          onClick={() => handleSelectPaymentMethod("SSLCOMMERZ_CARDLESS_EMI")} 
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                paymentDetails.payment_method === "SSLCOMMERZ_CARDLESS_EMI"
                              ? "border-primarymain bg-primarymain"
                              : "border-gray-300"
                          }`}>
                                {paymentDetails.payment_method === "SSLCOMMERZ_CARDLESS_EMI" && (
                              <CheckIcon className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div className="ml-3 flex items-center gap-2">
                            <div className="rounded-full bg-gray-100 p-2">
                                  <CreditCardIcon className="h-5 w-5 text-primarymain" />
                            </div>
                            <span className="text-base font-medium text-gray-900">SSLCOMMERZ EMI Payment System (Cardless)</span>
                          </div>
                        </div>
                        
                        {/* Additional Cardless EMI content when selected */}
                        {paymentDetails.payment_method === "SSLCOMMERZ_CARDLESS_EMI" && (
                          <div className="mt-4 ml-8 space-y-4">
                            {/* EMI information */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <h4 className="font-medium text-sm mb-2">EMI Details</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Total Product Amount:</span>
                                  <span className="font-medium">{formatCurrency(activeCardlessEMIBasePrice || 0)}</span>
                                </div>
                                
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Down Payment (Now):</span>
                                  <span className="font-medium">{formatCurrency(activeCardlessEMIDownpayment || 0)}</span>
                                </div>
                                
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Monthly Installment:</span>
                                  <span className="font-medium">{formatCurrency(activeCardlessEMIMonthly || 0)}</span>
                                </div>
                                
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Tenure:</span>
                                  <span className="font-medium">{selectedCardlessEMIPlanDetails.duration_months} months</span>
                                </div>
                                
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Interest Rate:</span>
                                  <span className="font-medium">{selectedCardlessEMIPlanDetails.interest_rate}%</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* NID upload fields */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-medium">Upload National ID (Required)</h4>
                              
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  NID Front <span className="text-red-500">*</span>
                                </label>
                                <input 
                                  type="file"
                                  accept="image/*"
                                  onChange={handleNidFrontUpload}
                                  className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-lg file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-primary-50 file:text-primarymain
                                    hover:file:bg-primary-100"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  NID Back <span className="text-red-500">*</span>
                                </label>
                                <input 
                                  type="file"
                                  accept="image/*"
                                  onChange={handleNidBackUpload}
                                  className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-lg file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-primary-50 file:text-primarymain
                                    hover:file:bg-primary-100"
                                />
                              </div>
                            </div>
                            
                            {/* Employment information */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-medium">Employment Information (Required)</h4>
                              
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  Job Title <span className="text-red-500">*</span>
                                </label>
                                <input 
                                  type="text"
                                  value={jobTitle}
                                  onChange={(e) => setJobTitle(e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primarymain focus:border-primarymain"
                                  placeholder="e.g. Software Engineer"
                                  required
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  Monthly Income (৳) <span className="text-red-500">*</span>
                                </label>
                                <input 
                                  type="number"
                                  value={salary}
                                  onChange={(e) => setSalary(e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primarymain focus:border-primarymain"
                                  placeholder="e.g. 50000"
                                  min="1"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      )}
                      
                      {/* Always show SSLCOMMERZ Standard Payment option */}
                      {!cartHasCardEMI && !selectedCardlessEMIPlanDetails && (
                      <div
                        className={`flex items-center p-4 border rounded-lg cursor-pointer ${
                                paymentDetails.payment_method === "SSLCOMMERZ_STANDARD"
                            ? "border-primarymain bg-blue-50"
                            : "border-gray-200"
                        }`}
                            onClick={() => handleSelectPaymentMethod("SSLCOMMERZ_STANDARD")}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                paymentDetails.payment_method === "SSLCOMMERZ_STANDARD"
                            ? "border-primarymain bg-primarymain"
                            : "border-gray-300"
                        }`}>
                                {paymentDetails.payment_method === "SSLCOMMERZ_STANDARD" && (
                            <CheckIcon className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="ml-3 flex items-center gap-2">
                          <div className="rounded-full bg-gray-100 p-2">
                                  <CreditCardIcon className="h-5 w-5 text-primarymain" />
                          </div>
                              <span className="text-base font-medium text-gray-900">Pay Online (Card, MFS, Net Banking via SSLCOMMERZ)</span>
                        </div>
                      </div>
                      )}
                      
                      {/* Show COD option ONLY when NO EMI is selected */}
                      {!emiInCart && (
                      <div
                        className={`flex items-center p-4 border rounded-lg cursor-pointer ${
                                paymentDetails.payment_method === "COD"
                            ? "border-primarymain bg-blue-50"
                            : "border-gray-200"
                        }`}
                            onClick={() => handleSelectPaymentMethod("COD")}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                paymentDetails.payment_method === "COD"
                            ? "border-primarymain bg-primarymain"
                            : "border-gray-300"
                        }`}>
                                {paymentDetails.payment_method === "COD" && (
                            <CheckIcon className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="ml-3 flex items-center gap-2">
                          <div className="rounded-full bg-gray-100 p-2">
                                  <BanknoteIcon className="h-5 w-5" />
                          </div>
                              <span className="text-base font-medium text-gray-900">Cash on Delivery</span>
                        </div>
                      </div>
                      )}
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Conditional Forms and Information */}
                  
                  {/* Cash on Delivery Instructions - Show if this method is selected AND it's a valid scenario (No EMI) */}
                  {paymentDetails.payment_method === "COD" && !cartHasCardEMI && !selectedCardlessEMIPlanDetails && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 text-sm">
                        You will pay for your order when it is delivered to your shipping address. Please ensure someone is available to receive the delivery and make the payment.
                      </p>
                    </div>
                  )}

                  {/* Cardless EMI Form - Show if this method (SSLCOMMERZ_CARDLESS_EMI) is selected */}
                  {paymentDetails.payment_method === "SSLCOMMERZ_CARDLESS_EMI" && selectedCardlessEMIPlanDetails && (
                    <div className="space-y-4">
                      <h3 className="text-base font-semibold">Cardless EMI - Required Information</h3>
                       {activeCardlessEMIDownpayment !== null && activeCardlessEMIMonthly !== null && activeCardlessEMIBasePrice !== null && activeCardlessEMIFinancedAmount !== null && selectedCardlessEMIPlanDetails && (
                         <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 space-y-2 mb-4">
                            <h4 className="text-base font-semibold text-blue-800">EMI Details ({selectedCardlessEMIPlanDetails.plan_name || `${selectedCardlessEMIPlanDetails.duration_months}-month Plan`})</h4>
                            <div className="flex justify-between"><span>Product Price:</span> <span>{formatCurrency(activeCardlessEMIBasePrice)}</span></div>
                            <div className="flex justify-between"><span>Interest Rate:</span> <span>{Number(selectedCardlessEMIPlanDetails.interest_rate).toFixed(2)}% (flat rate)</span></div>
                            <div className="flex justify-between"><span>Total Interest:</span> <span>{formatCurrency(activeCardlessEMIFinancedAmount * (selectedCardlessEMIPlanDetails.interest_rate / 100))}</span></div>
                            <div className="flex justify-between font-semibold border-t pt-2"><span>Total Amount (with Interest):</span> <span>{formatCurrency(activeCardlessEMIBasePrice + (activeCardlessEMIFinancedAmount * (selectedCardlessEMIPlanDetails.interest_rate / 100)))}</span></div>
                            {(selectedCardlessEMIPlanDetails.down_payment_percentage || 0) > 0 && 
                              <div className="flex justify-between text-green-700"><span>Down Payment (Pay Now) ({(selectedCardlessEMIPlanDetails.down_payment_percentage || 0)}%):</span> <span className="font-semibold">{formatCurrency(activeCardlessEMIDownpayment)}</span></div>
                            }
                            <div className="flex justify-between"><span>Financed Amount:</span> <span>{formatCurrency(activeCardlessEMIFinancedAmount)}</span></div>
                            <div className="flex justify-between font-semibold"><span>Monthly Installment:</span> <span>{formatCurrency(activeCardlessEMIMonthly)} for {selectedCardlessEMIPlanDetails.duration_months} months</span></div>
                            <p className="text-xs pt-2 text-gray-700 flex items-center gap-1">
                                <InfoIcon className="h-4 w-4 flex-shrink-0" />
                                You will pay only the down payment now. Remaining installments managed by our EMI provider after approval.
                            </p>
                    </div>
                  )}
                      <p className="text-gray-600 text-sm mb-4">
                        Please provide your employment details and upload your NID for verification. This information will be securely processed.
                      </p>
                      <div className="space-y-4">
                        {/* Job Title Input */}
                        <div className="flex flex-col gap-2">
                          <label htmlFor="jobTitle" className="text-sm font-medium text-gray-900">
                            Job Title <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="jobTitle"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="e.g., Software Engineer, Manager"
                            className="px-4 py-[9px] bg-white rounded-lg border border-solid border-gray-300"
                            required
                          />
                        </div>
                        {/* Monthly Salary Input */}
                        <div className="flex flex-col gap-2">
                          <label htmlFor="salary" className="text-sm font-medium text-gray-900">
                            Monthly Salary (Approx.) <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="salary"
                            type="number"
                            value={salary}
                            onChange={(e) => setSalary(e.target.value)}
                            placeholder="e.g., 50000"
                            className="px-4 py-[9px] bg-white rounded-lg border border-solid border-gray-300"
                            required
                          />
                        </div>
                        {/* NID Front Photo Upload */}
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-gray-900">
                            NID Front Photo <span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              onChange={handleNidFrontUpload}
                              className="hidden"
                              id="nid-front-sslcz"
                              accept="image/png, image/jpeg, image/jpg"
                            />
                            <label 
                              htmlFor="nid-front-sslcz"
                              className="px-4 py-2 bg-gray-100 rounded-lg border border-gray-300 flex items-center gap-2 cursor-pointer hover:bg-gray-200 text-sm w-full justify-center"
                            >
                              <UploadIcon className="h-4 w-4" />
                              {nidFrontPhoto ? nidFrontPhoto.name : "Upload NID Front"}
                            </label>
                          </div>
                           {nidFrontPhoto && (
                            <img src={URL.createObjectURL(nidFrontPhoto)} alt="NID Front Preview" className="mt-2 rounded-md max-h-32 object-contain border p-1"/>
                           )}
                        </div>
                        {/* NID Back Photo Upload */}
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-gray-900">
                            NID Back Photo <span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              onChange={handleNidBackUpload}
                              className="hidden"
                              id="nid-back-sslcz"
                              accept="image/png, image/jpeg, image/jpg"
                            />
                            <label 
                              htmlFor="nid-back-sslcz"
                              className="px-4 py-2 bg-gray-100 rounded-lg border border-gray-300 flex items-center gap-2 cursor-pointer hover:bg-gray-200 text-sm w-full justify-center"
                            >
                              <UploadIcon className="h-4 w-4" />
                              {nidBackPhoto ? nidBackPhoto.name : "Upload NID Back"}
                            </label>
                          </div>
                          {nidBackPhoto && (
                            <img src={URL.createObjectURL(nidBackPhoto)} alt="NID Back Preview" className="mt-2 rounded-md max-h-32 object-contain border p-1"/>
                           )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Card EMI Details - Show if this method is selected */}
                  {paymentDetails.payment_method === "SSLCOMMERZ_CARD_EMI" && activeCardEMICalculatedDetails && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 space-y-2">
                      <h3 className="text-base font-semibold text-blue-800">Card EMI Details ({activeCardEMICalculatedDetails.planName})</h3>
                      <div className="flex justify-between items-center">
                        <span>Product Price:</span>
                        <span>{formatCurrency(activeCardEMICalculatedDetails.baseAmount)}</span>
                      </div>
                      {activeCardEMICalculatedDetails.downPaymentPercent > 0 && (
                        <div className="flex justify-between items-center">
                          <span>Down Payment ({activeCardEMICalculatedDetails.downPaymentPercent}%):</span>
                          <span>{formatCurrency(activeCardEMICalculatedDetails.downPayment)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span>Financed Amount:</span>
                        <span>{formatCurrency(activeCardEMICalculatedDetails.financedAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Tenure:</span>
                        <span>{activeCardEMICalculatedDetails.tenureMonths} months</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Estimated Monthly Installment:</span>
                        <span>{formatCurrency(activeCardEMICalculatedDetails.monthlyInstallment)}</span>
                      </div>
                      <p className="text-xs pt-2 text-gray-700 flex items-center gap-1">
                        <InfoIcon className="h-4 w-4 flex-shrink-0" />
                        Interest rates will be determined by SSLCOMMERZ and your bank. You will be redirected to SSLCOMMERZ to choose your bank and complete the EMI payment securely.
                      </p>
                    </div>
                  )}

                  {/* Placeholder for SSLCOMMERZ Standard (no specific form, redirect happens) */}
                  {paymentDetails.payment_method === "SSLCOMMERZ_STANDARD" && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-700 text-sm flex items-center gap-2">
                        <InfoIcon className="h-5 w-5 text-primarymain" />
                        You will be redirected to SSLCOMMERZ to complete your payment securely using Card, Mobile Banking, or Net Banking.
                      </p>
                    </div>
                  )}

                  {/* Complete Payment Button */}
                  <Button 
                    className="flex items-center justify-center gap-2 px-6 py-3 w-full bg-primarymain text-white-100 rounded-lg mt-6"
                    onClick={() => {
                      if (paymentDetails.payment_method) {
                        // For cardless EMI, validate required fields
                        if (paymentDetails.payment_method === "SSLCOMMERZ_CARDLESS_EMI") {
                          if (!jobTitle.trim()) {
                            toast.error("Please enter your job title");
                            return;
                          }
                          if (!salary.trim()) {
                            toast.error("Please enter your monthly salary");
                            return;
                          }
                          if (!nidFrontPhoto) {
                            toast.error("Please upload front side of your NID");
                            return;
                          }
                          if (!nidBackPhoto) {
                            toast.error("Please upload back side of your NID");
                            return;
                          }
                          
                          // Check if we have valid EMI calculation details
                          if (!selectedCardlessEMIPlanDetails || activeCardlessEMIDownpayment === null) {
                            toast.error("Invalid EMI plan or downpayment calculation");
                            return;
                          }
                        }
                        
                        handleProceedToPaymentGateway(paymentDetails.payment_method);
                      } else {
                        toast.error("Please select a payment method first.");
                      }
                    }}
                    disabled={!paymentDetails.payment_method || isProcessingPayment}
                  >
                    {isProcessingPayment ? "Processing..." : 
                     paymentDetails.payment_method === "SSLCOMMERZ_CARDLESS_EMI" ? 
                     `Pay Down Payment ${activeCardlessEMIDownpayment ? formatCurrency(activeCardlessEMIDownpayment) : ''}` : 
                     "Complete Payment"}
                  </Button>
                  
                  <p className="text-center text-gray-500 text-sm">
                    Your payment information is secure and encrypted
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="flex flex-col w-full md:w-[416px] gap-4">
          <Card className="bg-gray-50 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between p-8 pb-6">
              <h3 className="font-heading-desktop-h5 text-gray-900">
                Order summary
              </h3>
              <Button
                variant="link"
                className="text-gray-700 text-sm underline p-0 h-auto"
                onClick={() => navigate('/cart')}
              >
                Edit
              </Button>
            </CardHeader>
            <CardContent className="p-0 px-8">
              <div className="flex items-center gap-3 mb-6">
                {cart && cart.items && cart.items.slice(0, 3).map((item, index) => (
                  <div key={`cart-item-${index}`} className="w-16 h-16 relative">
                    <img
                      className="absolute w-14 h-14 top-1 left-1 object-cover rounded-md"
                      alt={item.product.name || 'Product image'}
                      src={item.product ? getProductImageUrl(item.product) : '/placeholder-product.png'}
                    />
                  </div>
                ))}
                {cart && cart.items && cart.items.length > 3 && (
                  <ChevronRightIcon className="w-4 h-4 ml-auto" />
                )}
              </div>

              <Separator className="mb-4" />

              <div className="flex flex-col gap-4 mb-4">
                {orderSummaryItems.map((item, index) => (
                  <div key={index} className="flex gap-4 items-center w-full">
                    <div className="flex-1 text-gray-600 text-sm leading-[22px]">
                      {item.label}
                    </div>
                    <div
                      className={`flex-1 font-navigation-nav-link-small text-right ${item.color}`}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="mb-4" />
            </CardContent>
            <CardFooter className="flex flex-col items-center p-8 pt-0">
              <div className="flex items-center gap-4 w-full">
                <div className="flex-1 text-gray-600 text-sm leading-[22px]">
                  {paymentDetails.payment_method === "SSLCOMMERZ_CARDLESS_EMI" ? 
                    "Down payment:" : "Estimated total:"}
                </div>
                <div className="w-[156px] font-heading-desktop-h5 text-gray-900 text-right">
                  {paymentDetails.payment_method === "SSLCOMMERZ_CARDLESS_EMI" && activeCardlessEMIDownpayment !== null ? 
                    formatCurrency(activeCardlessEMIDownpayment) : 
                    formatCurrency(calculatedOrderTotal)}
                </div>
              </div>
              
              {/* Always show the interest calculation for Cardless EMI */}
              {paymentDetails.payment_method === "SSLCOMMERZ_CARDLESS_EMI" && selectedCardlessEMIPlanDetails && activeCardlessEMIBasePrice !== null && activeCardlessEMIFinancedAmount !== null && (
                <>
                  <div className="flex items-center gap-4 w-full mt-2 pt-2 border-t border-gray-200">
                    <div className="flex-1 text-gray-600 text-xs leading-[22px]">
                      Product price:
                    </div>
                    <div className="w-[156px] font-navigation-nav-link-small text-gray-600 text-right">
                      {formatCurrency(activeCardlessEMIBasePrice)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full mt-1">
                    <div className="flex-1 text-gray-600 text-xs leading-[22px]">
                      Interest ({selectedCardlessEMIPlanDetails.interest_rate}% flat rate):
                    </div>
                    <div className="w-[156px] font-navigation-nav-link-small text-gray-600 text-right">
                      {formatCurrency(activeCardlessEMIFinancedAmount * (selectedCardlessEMIPlanDetails.interest_rate / 100))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full mt-1 font-medium">
                    <div className="flex-1 text-gray-700 text-xs leading-[22px]">
                      Total with interest:
                    </div>
                    <div className="w-[156px] font-navigation-nav-link-small text-gray-700 text-right">
                      {formatCurrency(activeCardlessEMIBasePrice + (activeCardlessEMIFinancedAmount * (selectedCardlessEMIPlanDetails.interest_rate / 100)))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full mt-2 pt-2 border-t border-gray-200 bg-yellow-50 p-2 rounded">
                    <InfoIcon className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                    <div className="flex-1 text-yellow-800 text-xs leading-[18px]">
                      Your EMI application will be reviewed by our team after downpayment
                    </div>
                  </div>
                </>
              )}
            </CardFooter>
          </Card>

          {/* EMI Breakdown Card (Replaces Bonus Points if EMI is active) */}
          {(activeCardEMICalculatedDetails || (selectedCardlessEMIPlanDetails && activeCardlessEMIDownpayment !== null)) ? (
            <Card className="border text-card-foreground shadow bg-gray-50 rounded-2xl p-6">
              <CardContent className="p-0">
                <div className="flex justify-center gap-3 items-center w-full mb-2">
                  <div className="text-primarymain text-xl">📊</div>
                  <div className="flex-1 text-gray-900 text-sm leading-[14px]">
                    <span className="font-semibold text-[#181d25]">
                      EMI Details
                    </span>
                  </div>
                </div>
                
                {activeCardEMICalculatedDetails && (
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-semibold">{activeCardEMICalculatedDetails.tenureMonths} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Interest Rate:</span>
                      <span className="font-semibold">{Number(activeCardEMICalculatedDetails.interestPercent).toFixed(2)}%</span>
                    </div>
                    {activeCardEMICalculatedDetails.downPaymentPercent > 0 && (
                      <div className="flex justify-between">
                        <span>Down Payment:</span>
                        <span className="font-semibold">{activeCardEMICalculatedDetails.downPaymentPercent.toFixed(2)}% ({formatCurrency(activeCardEMICalculatedDetails.downPayment)})</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Amount per installment:</span>
                      <span className="font-semibold">{formatCurrency(activeCardEMICalculatedDetails.monthlyInstallment)}</span>
                    </div>
                  </div>
                )}
                
                {selectedCardlessEMIPlanDetails && activeCardlessEMIDownpayment !== null && activeCardlessEMIMonthly !== null && !activeCardEMICalculatedDetails && (
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-semibold">{selectedCardlessEMIPlanDetails.duration_months} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Interest Rate:</span>
                      <span className="font-semibold">{Number(selectedCardlessEMIPlanDetails.interest_rate).toFixed(2)}% (flat rate)</span>
                    </div>
                    {(selectedCardlessEMIPlanDetails.down_payment_percentage || 0) > 0 && (
                      <div className="flex justify-between">
                        <span>Down Payment:</span>
                        <span className="font-semibold">{Number(selectedCardlessEMIPlanDetails.down_payment_percentage).toFixed(2)}% ({formatCurrency(activeCardlessEMIDownpayment)})</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Amount per installment:</span>
                      <span className="font-semibold">{formatCurrency(activeCardlessEMIMonthly)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Bonus Points Card */
            <Card className="border text-card-foreground shadow bg-gray-50 rounded-2xl p-6">
              <CardContent className="p-0">
                <div className="flex justify-center gap-3 items-center w-full mb-2">
                  <div className="text-amber-500 text-xl">🎁</div>
                  <div className="flex-1 text-gray-900 text-sm leading-[14px]">
                    <span className="text-[#181d25]">
                      Congratulations! You have earned{" "}
                    </span>
                    <span className="font-semibold text-[#181d25]">
                      {Math.floor(calculatedOrderTotal * 0.05)} bonuses
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}; 