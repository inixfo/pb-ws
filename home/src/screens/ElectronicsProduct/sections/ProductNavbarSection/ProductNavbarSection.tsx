import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  MapPinIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  Share2Icon,
  ShoppingCartIcon,
  Loader2Icon,
  AlertCircleIcon,
  XIcon,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../../components/ui/accordion";
import { Badge } from "../../../../components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "../../../../components/ui/breadcrumb";
import { Button } from "../../../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";
import { Input } from "../../../../components/ui/input";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "../../../../components/ui/navigation-menu";
import { Separator } from "../../../../components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../../components/ui/tabs";
import { ProductDetailsSection } from "../ProductDetailsSection/ProductDetailsSection";
import { ProductReviewsSection } from "../ProductReviewsSection";
import { useProduct } from "../../../../contexts/ProductContext";
import { useLocation, useNavigate } from "react-router-dom";
import { StarRating } from "../../../../components/ui/StarRating";
import { Switch } from "../../../../components/ui/switch";
import { toast } from "react-hot-toast";
import { cartService, authService, emiService } from "../../../../services/api";
import CartManager from "../../../../services/CartManager";

// Helper function to map color names to hex codes (can be expanded)
const getColorHex = (colorName: string): string => {
  const colorMap: { [key: string]: string } = {
    red: "#FF0000",
    blue: "#0000FF",
    green: "#008000",
    black: "#000000",
    white: "#FFFFFF",
    silver: "#C0C0C0",
    gold: "#FFD700",
    purple: "#800080",
    pink: "#FFC0CB",
  };
  return colorMap[colorName.toLowerCase()] || "#5a7aa1"; // Default hex
};

export const ProductNavbarSection = (): JSX.Element => {
  const { product, loading, error, fetchProduct } = useProduct();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedStorage, setSelectedStorage] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [useEmi, setUseEmi] = useState(false);
  const [selectedEmiType, setSelectedEmiType] = useState<'card_emi' | 'cardless_emi'>('card_emi');
  const [selectedEmiPlan, setSelectedEmiPlan] = useState<number | null>(null);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [availableBanks, setAvailableBanks] = useState<any[]>([]);
  const [emiDetails, setEmiDetails] = useState<any>(null);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [cartItemCount, setCartItemCount] = useState<number>(0);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(2.5);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const zoomedImageRef = useRef<HTMLImageElement>(null);
  const zoomContainerRef = useRef<HTMLDivElement>(null);

  // Initialize cart item count from localStorage on component mount
  useEffect(() => {
    const cart = localStorage.getItem('cart');
    if (cart) {
      try {
        const cartItems = JSON.parse(cart);
        const itemCount = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
        setCartItemCount(itemCount);
      } catch (e) {
        console.error('Error parsing cart data:', e);
      }
    }
  }, []);
  
  // Re-fetch product if needed when the component mounts or URL changes
  useEffect(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts.length >= 2 && pathParts[0] === 'products') {
      const productIdOrSlug = pathParts[1];
      console.log(`ProductNavbarSection: Checking if we need to fetch product: ${productIdOrSlug}`);
      
      // If we don't have a product or it doesn't match the URL, fetch it
      if (!product || (product.id.toString() !== productIdOrSlug && product.slug !== productIdOrSlug)) {
        console.log(`ProductNavbarSection: Fetching product: ${productIdOrSlug}`);
        fetchProduct(productIdOrSlug);
      }
    }
  }, [location.pathname]);
  
  // Reset image index when product changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [product?.id]);

  // Navigation links data
  const navLinks = [
    { text: "Best Sellers", href: "#" },
    { text: "Today's Deals", href: "#" },
    { text: "New Arrivals", href: "#" },
    { text: "Gift Cards", href: "#" },
    { text: "Help Center", href: "#" },
  ];

  // Extract storage options from specifications if available
  const storageOptions = React.useMemo(() => {
    if (!product || !product.specifications) return [];

    const specObject = product.specifications as { [key: string]: string }; // Type assertion
    const storageValue = specObject.Storage || specObject.storage_capacity;

    if (storageValue) {
      // Assuming storageValue is a single string like "16 GB" or comma-separated "16 GB, 32 GB"
      const storageValues = storageValue.split(',').map(s => s.trim());
      if (!selectedStorage && storageValues.length > 0) {
        setSelectedStorage(storageValues[0]);
      }
      return storageValues.map((value: string) => ({ 
        value, 
        selected: selectedStorage ? selectedStorage === value : false 
      }));
    }
    return [];
  }, [product, selectedStorage]);

  // Extract color options from specifications if available
  const colorOptions = React.useMemo(() => {
    if (!product || !product.specifications) return [];

    const specObject = product.specifications as { [key: string]: string }; // Type assertion
    const colorValue = specObject.Color || specObject.colors;

    if (colorValue) {
      // Assuming colorValue is a comma-separated string like "Red,Blue,Green"
      const colorsArray = colorValue.split(',').map(s => s.trim());

      if (colorsArray.length > 0) {
        if (!selectedColor) {
           setSelectedColor(colorsArray[0]); // Select the first color name
        }
        return colorsArray.map((colorName: string) => ({
          color: getColorHex(colorName), // Helper function to get a hex, or default
          name: colorName,
          selected: selectedColor === colorName
        }));
      }
    }
    return [];
  }, [product, selectedColor]);

  // Build product images array from backend data
  const productImages = React.useMemo(() => {
    if (!product) return [
      { src: "/image.png", alt: "Product Image" },
      { src: "/image-1.png", alt: "Product Image" },
    ];
    // Use backend images field (array of objects with .image)
    if (Array.isArray(product.images) && product.images.length > 0) {
      // If images are objects (from backend), use .image, else use as string
      return product.images.map((img: any, idx: number) =>
        typeof img === 'string'
          ? { src: img, alt: `${product.name} - Image ${idx + 1}` }
          : { 
              src: img.image, 
              alt: (img as any).alt_text ? (img as any).alt_text : `${product.name} - Image ${idx + 1}` 
            }
      );
    }
    // Fallback to primary_image
    if (product.primary_image) {
      if (typeof product.primary_image === 'string') {
        return [{ src: product.primary_image, alt: product.name }];
      } else if (typeof product.primary_image === 'object' && 'image' in product.primary_image) {
        const primaryImage = product.primary_image as any;
        return [{ 
          src: primaryImage.image, 
          alt: primaryImage.alt_text || product.name 
        }];
      }
    }
    // Fallback to image
    if (product.image) {
      return [{ src: product.image, alt: product.name }];
    }
    // Fallback
    return [
      { src: "/image.png", alt: product.name || "Product Image" },
      { src: "/image-1.png", alt: product.name || "Product Image" },
    ];
  }, [product]);

  // Calculate discount percentage
  const discountPercentage = product?.sale_price && product?.price
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : 0;

  // Handle quantity change
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity > 0) {
      setQuantity(newQuantity);
    }
  };

  // Set default variation if product has variations
  useEffect(() => {
    if (product?.variations) {
      console.log('[ProductNavbarSection] Product variations:', product.variations);
      
      if (product.variations.length > 0 && !selectedVariation) {
        // Find the default variation or use the first one
        const defaultVariation = product.variations.find(v => v.is_default) || product.variations[0];
        setSelectedVariation(defaultVariation);
        console.log('[ProductNavbarSection] Set default variation:', defaultVariation);
      }
    }
  }, [product]);

  // Add debugging for the product data
  useEffect(() => {
    if (product) {
      console.log('[ProductNavbarSection] Product loaded:', product);
      console.log('[ProductNavbarSection] Has variations:', product.has_variations);
      console.log('[ProductNavbarSection] Variations:', product.variations);
    }
  }, [product]);

  const handleAddToCart = async () => {
    if (!product) {
      console.log('No product data');
      return;
    }
    
    // Check if product is available
    if (!product.is_available) {
      console.log('Product not available');
      toast.error("This product is currently unavailable");
      return;
    }
    
    // Check if product has variations and one is selected
    if (product.has_variations && !selectedVariation) {
      console.log('No variation selected for a product with variations');
      toast.error("Please select a product variation");
      return;
    }
    
    // Check if product has EMI and one is selected
    if (useEmi && !selectedEmiPlan) {
      console.log('EMI enabled but no plan selected');
      toast.error("Please select an EMI plan");
      return;
    }
    
    // For Card EMI, make sure a bank is selected
    if (useEmi && selectedEmiType === 'card_emi' && !selectedBank) {
      console.log('Card EMI selected but no bank chosen');
      toast.error("Please select a bank for Card EMI");
      return;
    }

    // Prepare cart item data
    const productIdToUse = product.id; // Always use the main product ID
    
    let emiSelectionData: { planIdValue?: number; durationValue?: number } = {};
    if (useEmi && selectedEmiPlan && product.emi_plans) {
      const plan = product.emi_plans.find(p => p.id === selectedEmiPlan);
      if (plan) {
        emiSelectionData = {
          planIdValue: plan.id,
          durationValue: plan.duration_months,
        };
      } else {
        console.error('Selected EMI plan not found in product.emi_plans');
        toast.error("Error with selected EMI plan. Please try again.");
        return;
      }
    }
    
    console.log('Adding product to cart:', {
      productId: productIdToUse,
      quantity,
      selectedVariation,
      useEmi,
      selectedEmiPlan, // This is the plan ID from state
      emiPlanDuration: emiSelectionData.durationValue, // This is the duration from the found plan
      selectedBank: useEmi && selectedEmiType === 'card_emi' ? selectedBank : null,
      selectedEmiType // The type of EMI selected (card_emi or cardless_emi)
    });

    const productData = {
      id: productIdToUse,
      name: product.name,
      price: selectedVariation?.price || product.price,
      sale_price: selectedVariation?.sale_price || product.sale_price,
      image: product.primary_image || product.image || '',
      specifications: product.specifications || {},
      variations: product.variations || []
    };

    try {
      // Use CartManager to add to cart (handles both authenticated and guest users)
      const result = await CartManager.addItem(
        productIdToUse,
        productData,
        quantity,
        {
          variationId: selectedVariation?.id,
          emiSelected: useEmi,
          emiPlan: useEmi ? emiSelectionData.planIdValue : undefined, 
          emiPeriod: useEmi ? emiSelectionData.durationValue : undefined,
          emiBank: useEmi && selectedEmiType === 'card_emi' && selectedBank ? selectedBank : undefined,
          emiType: useEmi ? selectedEmiType : undefined
        }
      );
      
      // Show success message
      toast.success(`Added ${quantity} ${quantity > 1 ? 'items' : 'item'} to cart`);
      
      // Update cart item count in UI
      const newCart = await CartManager.getCart();
      setCartItemCount(newCart.total_items);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  // Handle color selection
  const handleColorSelect = (colorName: string) => {
    setSelectedColor(colorName);
  };

  // Handle storage selection
  const handleStorageSelect = (storageValue: string) => {
    setSelectedStorage(storageValue);
  };

  // Carousel navigation handlers
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1));
  };
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1));
  };
  const handleThumbnailClick = (idx: number) => {
    setCurrentImageIndex(idx);
  };

  // Add EMI handlers
  // Fetch available banks when component mounts
  useEffect(() => {
    if (useEmi && selectedEmiType === 'card_emi') {
      const fetchBanks = async () => {
        const banks = await emiService.getAvailableBanks();
        setAvailableBanks(banks || []);
        
        // Auto-select first bank if available
        if (banks && banks.length > 0 && !selectedBank) {
          setSelectedBank(banks[0].code);
        }
      };
      
      fetchBanks();
    }
  }, [useEmi, selectedEmiType]);

  // Calculate EMI details when bank or plan changes
  useEffect(() => {
    if (useEmi && selectedEmiPlan && selectedBank && product) {
      const calculateEMIDetails = async () => {
        const price = selectedVariation?.price || product.price;
        const details = await emiService.calculateEMI(selectedEmiPlan, price, selectedBank);
        
        if (details) {
          setEmiDetails(details);
        }
      };
      
      calculateEMIDetails();
    } else {
      setEmiDetails(null);
    }
  }, [selectedEmiPlan, selectedBank, selectedVariation, product, useEmi]);

  const handleEmiToggle = (enabled: boolean) => {
    setUseEmi(enabled);
    if (!enabled) {
      // Reset EMI selections when disabled
      setSelectedEmiType('card_emi');
      setSelectedEmiPlan(null);
      setSelectedBank(null);
      setEmiDetails(null);
    } else if (product?.emi_plans?.length === 1) {
      // Auto-select if only one plan
      setSelectedEmiPlan(product.emi_plans[0].id);
    }
  };

  const handleEmiTypeSelect = (type: 'card_emi' | 'cardless_emi') => {
    setSelectedEmiType(type);
    setSelectedEmiPlan(null); // Reset plan selection when type changes
    setSelectedBank(null);
    setEmiDetails(null);
  };

  const handleEmiPlanSelect = (planId: number) => {
    setSelectedEmiPlan(planId);
  };
  
  const handleBankSelect = (bankCode: string) => {
    setSelectedBank(bankCode);
  };

  // Add a function to handle variation selection
  const handleVariationSelect = (variation: any) => {
    console.log('[ProductNavbarSection] Selected variation:', variation);
    setSelectedVariation(variation);
  };

  const handleZoomMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomContainerRef.current) {
      const rect = zoomContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setZoomPosition({ x, y });
    }
  };

  const handleZoomTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (zoomContainerRef.current) {
      const touch = e.touches[0];
      const rect = zoomContainerRef.current.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      setZoomPosition({ x, y });
    }
  };

  if (loading) {
    return (
      <div className="container max-w-[1296px] px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center py-16">
        <Loader2Icon className="w-12 h-12 text-primarymain animate-spin mb-4" />
        <p className="text-gray-600">Loading product information...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container max-w-[1296px] px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center py-16">
        <AlertCircleIcon className="w-12 h-12 text-dangermain mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error loading product</h2>
        <p className="text-gray-600 mb-4">{error || "Product not found"}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-[1296px] px-4 sm:px-6 lg:px-8 flex flex-col items-start gap-2 sm:gap-3">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-gray-500 pt-1 pb-0 overflow-x-auto w-full">
        <span className="text-gray-700 whitespace-nowrap">Home</span>
        <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <span className="text-gray-700 whitespace-nowrap">Shop</span>
        <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        {product.category && (
          <>
            <span className="text-gray-700 whitespace-nowrap">{product.category.name}</span>
            <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          </>
        )}
        <span className="text-gray-400 whitespace-nowrap">{product.name}</span>
      </div>

      {/* Product Title and Tabs */}
      <div className="flex flex-col w-full items-start gap-3 sm:gap-4">
        <h1 className="font-heading-desktop-h3 text-gray-900 text-[var(--heading-desktop-h3-font-size)] text-2xl sm:text-3xl md:text-4xl">
          {product.name}
        </h1>

        <div className="w-full relative">
          <Separator className="absolute bottom-0 w-full" />

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="bg-transparent p-0 h-10 gap-2 sm:gap-4 md:gap-8 overflow-x-auto w-full">
              <TabsTrigger
                value="general"
                className="px-0 py-2.5 h-full data-[state=active]:border-b-2 data-[state=active]:border-[#181d25] data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-700 rounded-none bg-transparent font-navigation-nav-link-small whitespace-nowrap"
              >
                General info
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="px-0 py-2.5 h-full data-[state=active]:border-b-2 data-[state=active]:border-[#181d25] data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-700 rounded-none bg-transparent font-navigation-nav-link-small whitespace-nowrap"
              >
                Product details
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="px-0 py-2.5 h-full data-[state=active]:border-b-2 data-[state=active]:border-[#181d25] data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-700 rounded-none bg-transparent font-navigation-nav-link-small whitespace-nowrap"
              >
                Reviews ({product.total_reviews || product.reviews_count || 0})
              </TabsTrigger>
            </TabsList>

            {/* Rating */}
            <div className="flex items-center gap-2 absolute top-[11px] right-0">
              <StarRating
                rating={product.average_rating || product.rating || 0}
                showCount
                count={product.total_reviews || product.reviews_count || 0}
                size="sm"
              />
            </div>

            <TabsContent value="general" className="mt-4 w-full mb-0 min-h-0">
              {/* Product Content */}
              <div className="w-full flex flex-col lg:flex-row gap-4 lg:gap-6">
                {/* Product Images */}
                <div className="w-full lg:w-1/2 xl:w-[636px]">
                  {/* Main Product Image */}
                  <div className="relative w-full aspect-square lg:h-[500px] xl:h-[600px] rounded-lg bg-cover bg-center mb-2">
                    {/* Zoom container */}
                    <div 
                      className="w-full h-full rounded-lg overflow-hidden cursor-zoom-in"
                      onClick={() => setShowZoomModal(true)}
                    >
                      <img 
                        src={productImages[currentImageIndex]?.src} 
                        alt={productImages[currentImageIndex]?.alt || "Product image"} 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    
                    {productImages.length > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute top-1/2 -translate-y-1/2 right-4 p-3 rounded-full"
                          onClick={handleNextImage}
                          aria-label="Next image"
                        >
                          <ChevronRightIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute top-1/2 -translate-y-1/2 left-4 p-3 rounded-full"
                          onClick={handlePrevImage}
                          aria-label="Previous image"
                        >
                          <ChevronLeftIcon className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Image Zoom Modal */}
                  {showZoomModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
                      <div className="relative w-full max-w-4xl h-full max-h-[80vh] bg-white rounded-lg overflow-hidden">
                        <div 
                          className="w-full h-full overflow-auto"
                          onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const y = e.clientY - rect.top;
                            setZoomPosition({ x, y });
                          }}
                          onTouchMove={(e) => {
                            const touch = e.touches[0];
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = touch.clientX - rect.left;
                            const y = touch.clientY - rect.top;
                            setZoomPosition({ x, y });
                          }}
                          style={{ cursor: 'zoom-out' }}
                          onClick={() => setShowZoomModal(false)}
                        >
                          <img 
                            src={productImages[currentImageIndex]?.src} 
                            alt={productImages[currentImageIndex]?.alt || "Product image"} 
                            className="w-auto h-auto max-w-none transform-gpu transition-transform"
                            style={{ 
                              transformOrigin: `${zoomPosition.x}px ${zoomPosition.y}px`,
                              transform: `scale(2.5)`,
                            }}
                          />
                        </div>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute top-4 right-4 rounded-full bg-white"
                          onClick={() => setShowZoomModal(false)}
                          aria-label="Close zoom"
                        >
                          <XIcon className="w-4 h-4" />
                        </Button>
                        
                        {productImages.length > 1 && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              className="absolute top-1/2 -translate-y-1/2 right-4 p-3 rounded-full bg-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNextImage();
                              }}
                              aria-label="Next image"
                            >
                              <ChevronRightIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="absolute top-1/2 -translate-y-1/2 left-4 p-3 rounded-full bg-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrevImage();
                              }}
                              aria-label="Previous image"
                            >
                              <ChevronLeftIcon className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Thumbnail Images */}
                  <div className="flex items-start gap-2 mt-2 flex-wrap justify-center sm:justify-start">
                    {productImages.map((image, index) => (
                      <div
                        key={index}
                        className={`w-[60px] h-[60px] sm:w-[75px] sm:h-[75px] rounded-lg border ${index === currentImageIndex ? "border-[#181d25]" : "border-[#e0e5eb]"} bg-cover bg-center relative cursor-pointer`}
                        style={{ backgroundImage: `url(${image.src})` }}
                        onClick={() => handleThumbnailClick(index)}
                        aria-label={`Show image ${index + 1}`}
                      >
                        {/* Optionally, show badge for more images, etc. */}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Product Details */}
                <div className="flex flex-col w-full lg:w-1/2 xl:w-[526px] gap-4 lg:gap-6 mt-4 lg:mt-0">
                  {/* Product Details */}
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-4 sm:gap-5">
                      {/* SKU - Always visible */}
                      {product.id && (
                        <div className="text-right">
                          <span className="font-body-extra-small text-gray-500 text-[var(--body-extra-small-font-size)]">
                            {product.default_sku || `PB-${product.id.toString().padStart(6, '0')}`}
                          </span>
                        </div>
                      )}

                      {/* Price Section */}
                      <div className="flex flex-col gap-2">
                        {/* Price Display */}
                        <div className="flex items-center gap-3">
                          {product.has_variations ? (
                            // Show price range if product has variations
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-semibold text-gray-900">
                                  ৳{selectedVariation ? selectedVariation.price : product.min_price}
                                </span>
                                {product.min_price !== product.max_price && !selectedVariation && (
                                  <span className="text-sm text-gray-500">
                                    - ৳{product.max_price}
                                  </span>
                                )}
                              </div>
                              {selectedVariation?.price !== product.base_price && (
                                <span className="text-sm text-gray-500">Base price: ৳{product.base_price}</span>
                              )}
                            </div>
                          ) : (
                            // Show single price if no variations
                            <span className="text-2xl font-semibold text-gray-900">
                              ৳{product.sale_price || product.price || product.base_price}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          Inclusive of all taxes
                        </div>
                      </div>

                      {/* Variations Section - Always visible if product has variations flag is true */}
                      {product.has_variations && (
                        <div className="flex flex-col gap-2 border rounded-lg p-4 mt-4">
                          <div className="font-body-small-semi-bold text-gray-900 text-[var(--body-small-semi-bold-font-size)] mb-2">
                            Select Variation
                          </div>
                          {product.variations && product.variations.length > 0 ? (
                            <div className="flex gap-2 flex-wrap">
                              {product.variations.map((variation: any) => (
                                <button
                                  key={variation.id}
                                  onClick={() => handleVariationSelect(variation)}
                                  className={`inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3 py-1.5 rounded-md ${
                                    selectedVariation?.id === variation.id
                                      ? "border-primarymain text-primarymain bg-primarymain/10"
                                      : "border-[#e0e5eb] text-gray-700"
                                  } font-navigation-nav-link-extra-small text-xs`}
                                >
                                  {variation.name}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">No variations available</div>
                          )}
                          
                          {selectedVariation && (
                            <div className="mt-2 text-sm">
                              <div className="flex justify-between py-1">
                                <span className="text-gray-600">SKU:</span>
                                <span className="font-medium">{selectedVariation.sku || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between py-1">
                                <span className="text-gray-600">Price:</span>
                                <span className="font-medium">৳{selectedVariation.price}</span>
                              </div>
                              <div className="flex justify-between py-1">
                                <span className="text-gray-600">Stock:</span>
                                <span className={`font-medium ${selectedVariation.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {selectedVariation.stock_quantity > 0 ? `${selectedVariation.stock_quantity} available` : 'Out of stock'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* EMI Section - Always visible if EMI is available */}
                      {product.emi_available && product.emi_plans && product.emi_plans.length > 0 && (
                        <div className="flex flex-col gap-3 border rounded-lg p-4">
                          <h2 className="font-heading-desktop-h6 text-gray-900 text-[var(--heading-desktop-h6-font-size)]">
                            EMI Available
                          </h2>

                          {/* EMI Confirmation Switch */}
                          <div className="flex items-center gap-2">
                            <Switch
                              id="use-emi"
                              checked={useEmi}
                              onCheckedChange={handleEmiToggle}
                            />
                            <label
                              htmlFor="use-emi"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              I want to use EMI for this purchase
                            </label>
                          </div>

                          {useEmi && product.emi_plans && (
                            <div className="space-y-4">
                              {/* EMI Type Selection - Only show if both types are available AND plans exist */}
                              {product.emi_plans.some(plan => plan.emi_type === 'normal' || plan.plan_type === 'card_emi') && 
                               product.emi_plans.some(plan => plan.emi_type === 'cardless' || plan.plan_type === 'cardless_emi') && (
                                <div className="flex flex-col gap-2">
                                  <label className="text-sm font-medium text-gray-700">Select EMI Type</label>
                                  <div className="flex gap-4">
                                    <button
                                      onClick={() => handleEmiTypeSelect('card_emi')}
                                      className={`flex-1 px-4 py-2 rounded-lg border ${
                                        selectedEmiType === 'card_emi'
                                          ? 'border-primarymain bg-blue-50 text-primarymain'
                                          : 'border-gray-200 text-gray-700'
                                      }`}
                                    >
                                      Card EMI
                                    </button>
                                    <button
                                      onClick={() => handleEmiTypeSelect('cardless_emi')}
                                      className={`flex-1 px-4 py-2 rounded-lg border ${
                                        selectedEmiType === 'cardless_emi'
                                          ? 'border-primarymain bg-blue-50 text-primarymain'
                                          : 'border-gray-200 text-gray-700'
                                      }`}
                                    >
                                      Cardless EMI
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* EMI Plan Selection Dropdown */}
                              {product.emi_plans && product.emi_plans.filter(plan => {
                                // Match both old and new field names for compatibility
                                return (plan.plan_type === selectedEmiType) || 
                                       (selectedEmiType === 'card_emi' && plan.emi_type === 'normal') || 
                                       (selectedEmiType === 'cardless_emi' && plan.emi_type === 'cardless');
                              }).length > 0 ? (
                                <>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select EMI Plan</label>
                                    <select 
                                      value={selectedEmiPlan || ''}
                                      onChange={(e) => handleEmiPlanSelect(Number(e.target.value))}
                                      className="w-full p-2 border border-gray-300 rounded-md"
                                    >
                                      <option value="" disabled>Select an EMI Plan</option>
                                      {product.emi_plans
                                        .filter(plan => {
                                          // Match both old and new field names for compatibility
                                          return (plan.plan_type === selectedEmiType) || 
                                                (selectedEmiType === 'card_emi' && plan.emi_type === 'normal') || 
                                                (selectedEmiType === 'cardless_emi' && plan.emi_type === 'cardless');
                                        })
                                        .map(plan => (
                                          <option key={plan.id} value={plan.id}>
                                            {plan.name || plan.plan_name || `${plan.duration_months} Months EMI`}
                                            {plan.interest_rate ? ` (${plan.interest_rate}% interest)` : ' (No interest)'}
                                            {plan.down_payment_percentage ? ` - ${plan.down_payment_percentage}% downpayment` : ''}
                                          </option>
                                        ))}
                                    </select>
                                  </div>
                                  
                                  {/* Bank Selection for Card EMI */}
                                  {selectedEmiType === 'card_emi' && selectedEmiPlan && (
                                    <div className="mt-3">
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Bank</label>
                                      {availableBanks.length > 0 ? (
                                        <select
                                          value={selectedBank || ''}
                                          onChange={(e) => handleBankSelect(e.target.value)}
                                          className="w-full p-2 border border-gray-300 rounded-md"
                                        >
                                          <option value="" disabled>Select a Bank</option>
                                          {availableBanks.map(bank => (
                                            <option key={bank.code} value={bank.code}>
                                              {bank.name} ({bank.interest_rate}% interest)
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        <div className="flex items-center space-x-2">
                                          <Loader2Icon className="w-4 h-4 animate-spin text-gray-500" />
                                          <span className="text-sm text-gray-500">Loading banks...</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <p className="text-sm text-gray-500 mt-2">
                                  No {selectedEmiType === 'card_emi' ? 'Card' : 'Cardless'} EMI plans available for this product.
                                </p>
                              )}

                              {/* Show EMI details if a plan is selected */}
                              {selectedEmiPlan && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                                  <h3 className="font-medium text-sm mb-2">
                                    EMI Details
                                    {emiDetails?.is_live_data && (
                                      <span className="ml-2 text-xs text-green-600">(Live data from SSLCOMMERZ)</span>
                                    )}
                                  </h3>

                                  {selectedEmiType === 'card_emi' && !selectedBank ? (
                                    <p className="text-sm text-gray-500">Please select a bank to see EMI details</p>
                                  ) : emiDetails ? (
                                    // Show EMI details from API if available
                                    <div className="text-sm space-y-1">
                                      <div className="flex justify-between">
                                        <span>Duration:</span>
                                        <span className="font-medium">{emiDetails.duration_months} months</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Interest Rate:</span>
                                        <span className="font-medium">{emiDetails.interest_rate}%</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Monthly Installment:</span>
                                        <span className="font-medium">৳{Math.round(emiDetails.monthly_installment)}</span>
                                      </div>
                                      {emiDetails.down_payment_percentage > 0 && (
                                        <div className="flex justify-between">
                                          <span>Down Payment:</span>
                                          <span className="font-medium">{emiDetails.down_payment_percentage}% (৳{Math.round(emiDetails.down_payment)})</span>
                                        </div>
                                      )}
                                      {emiDetails.bank_processing_fee > 0 && (
                                        <div className="flex justify-between">
                                          <span>Bank Processing Fee:</span>
                                          <span className="font-medium">৳{Math.round(emiDetails.bank_processing_fee)}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between font-medium border-t pt-1 mt-1">
                                        <span>Total Payable:</span>
                                        <span>৳{Math.round(emiDetails.total_payable)}</span>
                                      </div>
                                    </div>
                                  ) : (
                                    // Show calculated EMI details from the plan if API data not available
                                    product.emi_plans
                                      .filter(plan => plan.id === selectedEmiPlan)
                                      .map(plan => (
                                        <div key={plan.id} className="text-sm space-y-1">
                                          <div className="flex justify-between">
                                            <span>Duration:</span>
                                            <span className="font-medium">{plan.duration_months} months</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Interest Rate:</span>
                                            <span className="font-medium">{plan.interest_rate}%</span>
                                          </div>
                                          {(plan.down_payment_percentage ?? 0) > 0 && (
                                            <div className="flex justify-between">
                                              <span>Down Payment:</span>
                                              <span className="font-medium">{(plan.down_payment_percentage ?? 0)}% (৳{
                                                (() => {
                                                  const productPrice = Number(selectedVariation?.price || product.price || 0);
                                                  const downPaymentPercentage = Number(plan.down_payment_percentage || 0);
                                                  const interestRate = Number(plan.interest_rate || 0) / 100;
                                                  
                                                  // For cardless EMI: calculate down payment on total (price + interest)
                                                  if (plan.plan_type === 'cardless_emi') {
                                                    const interest = productPrice * interestRate;
                                                    const totalWithInterest = productPrice + interest;
                                                    return Math.round(totalWithInterest * downPaymentPercentage / 100);
                                                  } else {
                                                    // For card EMI: calculate down payment directly on product price
                                                    return Math.round(productPrice * downPaymentPercentage / 100);
                                                  }
                                                })()
                                              })</span>
                                            </div>
                                          )}
                                          {plan.plan_type === 'cardless_emi' && (
                                            <div className="flex justify-between">
                                              <span>Monthly Installment:</span>
                                              <span className="font-medium">৳{
                                                (() => {
                                                  const productPrice = Number(selectedVariation?.price || product.price || 0);
                                                  const downPaymentPercentage = Number(plan.down_payment_percentage || 0) / 100;
                                                  const interestRate = Number(plan.interest_rate || 0) / 100;
                                                  const tenureMonths = Number(plan.duration_months || 12);
                                                  
                                                  // Calculate using correct cardless EMI formula
                                                  const interest = productPrice * interestRate;
                                                  const totalWithInterest = productPrice + interest;
                                                  const downPayment = totalWithInterest * downPaymentPercentage;
                                                  const financedAmount = totalWithInterest - downPayment;
                                                  const monthlyInstallment = financedAmount / tenureMonths;
                                                  
                                                  return Math.round(monthlyInstallment);
                                                })()
                                              }</span>
                                            </div>
                                          )}
                                        </div>
                                      ))
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Storage Options - Only visible if available */}
                      {storageOptions.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <div className="font-body-small-semi-bold text-gray-900 text-[var(--body-small-semi-bold-font-size)]">
                          Model
                        </div>
                        <div className="flex gap-2 relative flex-wrap">
                            {storageOptions.map((option) => (
                              <button
                                key={option.value}
                              onClick={() => handleStorageSelect(option.value)}
                                className={`inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3 py-1.5 rounded-md ${
                                  option.selected
                                    ? "border-[#181d25] text-gray-900"
                                    : "border-[#e0e5eb] text-gray-700"
                                } font-navigation-nav-link-extra-small text-xs`}
                            >
                              {option.value}
                              </button>
                          ))}
                        </div>
                      </div>
                      )}

                      {/* Color Options - Only visible if available */}
                      {colorOptions.length > 0 && (
                      <div className="flex flex-col gap-2">
                          <div className="font-body-small-semi-bold text-gray-900 text-[var(--body-small-semi-bold-font-size)]">
                            Color
                        </div>
                          <div className="flex gap-2 relative flex-wrap">
                            {colorOptions.map((option) => (
                              <button
                                key={option.name}
                              onClick={() => handleColorSelect(option.name)}
                                className={`inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3 py-1.5 rounded-md ${
                                  option.selected
                                    ? "border-[#181d25] text-gray-900"
                                    : "border-[#e0e5eb] text-gray-700"
                                } font-navigation-nav-link-extra-small text-xs`}
                            >
                              <div
                                  className="h-4 w-4 rounded-full"
                                style={{ backgroundColor: option.color }}
                              />
                                {option.name}
                              </button>
                          ))}
                        </div>
                      </div>
                      )}

                      {/* Quantity */}
                      <div className="flex flex-col gap-2">
                        <div className="font-body-small-semi-bold text-gray-900 text-[var(--body-small-semi-bold-font-size)]">
                          Quantity
                        </div>
                        <div className="flex gap-2 relative flex-wrap">
                          <button
                            onClick={() => handleQuantityChange(quantity - 1)}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3 py-1.5 rounded-md border-[#e0e5eb] text-gray-700 font-navigation-nav-link-extra-small text-xs"
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-background shadow-sm h-9 px-3 py-1.5 rounded-md border-[#e0e5eb] text-gray-700 font-navigation-nav-link-extra-small text-xs">
                              {quantity}
                          </div>
                          <button
                            onClick={() => handleQuantityChange(quantity + 1)}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3 py-1.5 rounded-md border-[#e0e5eb] text-gray-700 font-navigation-nav-link-extra-small text-xs"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Add to cart button clicked');
                            handleAddToCart();
                          }}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-9 px-4 py-2 flex-1 bg-[#181d25] text-white hover:bg-[#181d25]/90"
                        >
                          Add to Cart
                        </button>
                        {cartItemCount > 0 && (
                          <button
                            type="button"
                            onClick={() => navigate('/cart')} 
                            className="bg-primarymain text-white hover:bg-primarymain/90 relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-9 px-4 py-2"
                          >
                            <ShoppingCartIcon className="h-4 w-4 mr-2" />
                            View Cart
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {cartItemCount}
                            </span>
                          </button>
                        )}
                        <button 
                          type="button"
                          className="border-[#e0e5eb] inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-9 px-4 py-2"
                        >
                          <HeartIcon className="h-4 w-4" />
                        </button>
                        <button 
                          type="button"
                          className="border-[#e0e5eb] inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-9 px-4 py-2"
                        >
                          <Share2Icon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="details" className="mt-4 w-full mb-0 pt-0 pb-0 min-h-0">
              <ProductDetailsSection />
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-4 w-full mb-0 min-h-0">
              <ProductReviewsSection />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}; 