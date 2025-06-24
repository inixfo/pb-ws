import {
  BellIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  MenuIcon,
  SearchIcon,
  ShoppingCartIcon,
  UserIcon,
  XIcon,
  LayoutGridIcon
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "../../../components/ui/navigation-menu";
import { Link, useNavigate, useLocation } from "react-router-dom";

// Define an interface for the header promo banner
interface HeaderPromo {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  bg_color: string;
  is_active: boolean;
  priority: number;
}

// Define an interface for the hero slides
interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  bg_color: string;
  button_text: string;
  button_link: string;
  is_active: boolean;
  priority: number;
}

export const HeaderByAnima = ({ showHeroSection = true }: { showHeroSection?: boolean } = {}): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Navigation links data
  const navLinks = [
    { label: "Best Sellers", path: "/best-sellers" },
    { label: "Today's Deals", path: "/todays-deals" },
    { label: "New Arrivals", path: "/new-arrivals" },
    { label: "Help Center", path: "/help-center" },
    { label: "Track Order", path: "/track-order" },
  ];

  // Hero slider data - This will be replaced with data from API
  const defaultHeroSlides = [
    {
      id: 1,
      title: "Headphones ProMax",
      subtitle: "Feel the real quality sound",
      image: "/image.png",
      bg_color: "bg-blue-100",
      button_text: "Shop now",
      button_link: "#",
      is_active: true,
      priority: 1
    },
    {
      id: 2,
      title: "iPhone 14 Pro",
      subtitle: "The ultimate smartphone experience",
      image: "/image-1.png",
      bg_color: "bg-gray-100",
      button_text: "Learn more",
      button_link: "#",
      is_active: true,
      priority: 2
    },
    {
      id: 3,
      title: "MacBook Pro M2",
      subtitle: "Power to change everything",
      image: "/image-2.png",
      bg_color: "bg-indigo-100",
      button_text: "Buy now",
      button_link: "#",
      is_active: true,
      priority: 3
    }
  ];

  const [showCategories, setShowCategories] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const categoriesButtonRef = useRef<HTMLDivElement>(null);
  const categoriesDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Default categories to use when API call fails
  const defaultCategories = [
    {
      id: 1,
      name: "Smartphones & Tablets",
      slug: "smartphones-tablets",
      icon: "/smartphone.svg"
    },
    {
      id: 2,
      name: "Computers & Laptops",
      slug: "computers-laptops",
      icon: "/computer.svg"
    },
    {
      id: 3,
      name: "Audio & Headphones",
      slug: "audio-headphones",
      icon: "/headphones.svg"
    },
    {
      id: 4,
      name: "Cameras & Photography",
      slug: "cameras-photography",
      icon: "/camera.svg"
    },
    {
      id: 5,
      name: "Smart Home & IoT",
      slug: "smart-home",
      icon: "/smart-home.svg"
    },
    {
      id: 6,
      name: "Gaming & Consoles",
      slug: "gaming-consoles",
      icon: "/gaming.svg"
    }
  ];

  // Add state for the header promo
  const [headerPromo, setHeaderPromo] = useState<HeaderPromo | null>(null);
  const [headerPromoLoading, setHeaderPromoLoading] = useState(false);

  // Replace the static hero slides with dynamic state
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [heroSlidesLoading, setHeroSlidesLoading] = useState(false);
  
  // Cart state
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Auto slide for hero section
  useEffect(() => {
    if (showHeroSection && heroSlides.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [showHeroSection, heroSlides.length]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        categoriesDropdownRef.current &&
        !categoriesDropdownRef.current.contains(event.target as Node) &&
        categoriesButtonRef.current &&
        !categoriesButtonRef.current.contains(event.target as Node) &&
        mobileMenuRef.current && 
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setShowCategories(false);
        setHoveredCategory(null);
      }
    }
    if (showCategories) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCategories]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };
  
  // Fetch cart data
  const fetchCart = async () => {
    try {
      // Mock cart data for now
      setCartItemCount(3);
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  // Initial data loading
  useEffect(() => {
    // Set default categories
    setCategories(defaultCategories);
    setLoadingCategories(false);
    
    // Set default hero slides
    setHeroSlides(defaultHeroSlides);
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    
    // Fetch cart data
    fetchCart();
  }, [isAuthenticated, fetchCart]);
  
  // Close mobile menu when location changes
  useEffect(() => {
    // Store the current location to compare with future changes
    const currentPath = location.pathname;
    
    // Only close the menu if the location actually changes
    return () => {
      if (location.pathname !== currentPath && mobileMenuOpen) {
        console.log('[HeaderByAnima] Location changed from', currentPath, 'to', location.pathname, 'closing mobile menu.');
        setMobileMenuOpen(false);
        setShowCategories(false);
      }
    };
  }, [location.pathname, mobileMenuOpen]);

  return (
    <header className="flex flex-col items-center w-full">
      {/* Top navigation bar */}
      <div className="w-full flex flex-col items-center bg-gray-800">
        <div className="w-full max-w-[1296px] h-auto sm:h-[88px] relative flex flex-wrap sm:flex-nowrap items-center justify-between px-4 sm:px-6 py-3 sm:py-0">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full p-3 sm:hidden text-white z-[100]"
            onClick={() => {
              console.log(`[DEBUG] Hamburger menu clicked. Current state: ${mobileMenuOpen ? 'open' : 'closed'}, toggling to ${!mobileMenuOpen ? 'open' : 'closed'}`);
              setMobileMenuOpen(!mobileMenuOpen);
              // When closing the menu, also close categories
              if (mobileMenuOpen) {
                setShowCategories(false);
              }
            }}
          >
            {mobileMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </Button>

          {/* Logo */}
          <img className="h-8 sm:h-10 w-auto sm:w-[141px]" alt="Logo" src="/logo-1.svg" />

          {/* Mobile search toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full p-3 sm:hidden ml-auto text-white"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <SearchIcon className="w-6 h-6" />
          </Button>

          {/* Mobile cart button */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full p-3 sm:hidden relative text-white ml-1"
            onClick={(e) => {
              e.preventDefault();
              console.log(`[DEBUG] Mobile cart button clicked, navigating to: /cart`);
              window.location.href = '/cart';
            }}
          >
            <ShoppingCartIcon className="w-6 h-6" />
            <Badge className="absolute w-5 h-5 top-0 right-0 bg-successmain rounded-xl flex items-center justify-center text-xs">
              {cartItemCount}
            </Badge>
          </Button>

          {/* Search bar - desktop */}
          <div className="hidden sm:flex items-center relative ml-6">
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-[100px] border border-solid border-white w-[490px]">
              <SearchIcon className="w-[18px] h-[18px] text-gray-500" />
              <Input
                className="flex-1 border-none bg-transparent text-gray-500 font-body-regular placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                placeholder="Search the products"
              />
            </div>
          </div>

          {/* Search bar - mobile (shown when search is toggled) */}
          <div className={`${searchOpen ? 'flex' : 'hidden'} w-full sm:hidden items-center my-3`}>
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-[100px] border border-solid border-white w-full">
              <SearchIcon className="w-[18px] h-[18px] text-gray-500" />
              <Input
                className="flex-1 border-none bg-transparent text-gray-500 font-body-regular placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                placeholder="Search the products"
              />
            </div>
          </div>

          {/* Promotion - desktop only */}
          <div className="hidden md:flex items-center gap-2 ml-6">
            <div className="inline-flex justify-center p-[15px] bg-[#333d4cb2] rounded-[100px] items-center">
              <img
                className="w-[18px] h-[18px]"
                alt="Icon"
                src="/icon-24.svg"
              />
            </div>
            <div className="flex flex-col w-[120px] items-start gap-0.5">
              <span className="text-gray-300 font-body-extrasmall">
                Only this month
              </span>
              <span className="font-medium text-white-100 text-base">
                Super Sale 20%
              </span>
            </div>
          </div>

          {/* Action icons - desktop only */}
          <div className="hidden sm:flex items-center gap-1 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full p-[15px]"
              onClick={(e) => {
                e.preventDefault();
                console.log(`[DEBUG] Wishlist button clicked, navigating to: /wishlist`);
                window.location.href = '/wishlist';
              }}
            >
              <HeartIcon className="w-[18px] h-[18px] text-white-80" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full p-[15px]"
            >
              <BellIcon className="w-[18px] h-[18px] text-white-80" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full p-[15px] relative"
              onClick={(e) => {
                e.preventDefault();
                console.log(`[DEBUG] Desktop cart button clicked, navigating to: /cart`);
                window.location.href = '/cart';
              }}
            >
              <ShoppingCartIcon className="w-[18px] h-[18px] text-white-80" />
              <Badge className="absolute w-6 h-6 top-0 right-0 bg-successmain rounded-xl border-[3px] border-solid border-[#222934] flex items-center justify-center">
                <span className="text-white-100 text-xs font-body-extra-small">
                  {cartItemCount}
                </span>
              </Badge>
            </Button>
            <Button
              variant="default"
              size="icon"
              className="rounded-full p-[15px] bg-gray-700"
            >
              <UserIcon className="w-[18px] h-[18px] text-white-80" />
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        <div ref={mobileMenuRef} className={`${mobileMenuOpen ? 'flex' : 'hidden'} sm:hidden w-full flex-col bg-gray-700 p-4 z-[90] absolute top-[60px] left-0 right-0`}>
          <div className="flex flex-col gap-2">
            {navLinks.map((link, index) => (
              <a
                key={index}
                href={link.path}
                className="px-3 py-2 text-white-80 hover:bg-gray-600 rounded-lg cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  console.log(`[DEBUG] Mobile navLink '${link.label}' clicked, navigating to: ${link.path}`);
                  // Close the mobile menu
                  setMobileMenuOpen(false);
                  // Use direct browser navigation for more reliable routing
                  window.location.href = link.path;
                }}
              >
                {link.label}
              </a>
            ))}
            <div className="h-px w-full bg-gray-600 my-2"></div>
            <Button
              variant="ghost"
              className="justify-start px-3 py-2 text-white-80 hover:bg-gray-600 rounded-lg"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`[DEBUG] Mobile categories button clicked. Current state: ${showCategories ? 'open' : 'closed'}`);
                setShowCategories(!showCategories);
              }}
            >
              <span className="flex items-center gap-2">
                <LayoutGridIcon className="w-4 h-4" />
                Categories
              </span>
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${showCategories ? 'rotate-180' : ''}`} />
            </Button>
            {(showCategories && mobileMenuOpen) && (
              <div className="ml-4 flex flex-col gap-1 mt-1">
                {loadingCategories ? (
                  <div className="px-3 py-2 text-white-80">Loading categories...</div>
                ) : categoryError ? (
                  <div className="px-3 py-2 text-white-80">Error: {categoryError}</div>
                ) : (
                  <>
                    {categories.slice(0, 6).map((category) => (
                      <a
                        key={category.id}
                        href={`/catalog/${category.slug}`}
                        className="px-3 py-2 text-white-80 hover:bg-gray-600 rounded-lg flex items-center gap-2 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          console.log(`[DEBUG] Mobile category clicked: ${category.name}, navigating to: /catalog/${category.slug}`);
                          // Close the mobile menu
                          setMobileMenuOpen(false);
                          // Use direct browser navigation for more reliable routing
                          window.location.href = `/catalog/${category.slug}`;
                        }}
                      >
                        <img 
                          className="w-4 h-4" 
                          alt={category.name} 
                          src={category.image || (category as any).icon || `/computer.svg`} 
                        />
                        {category.name}
                      </a>
                    ))}
                    {categories.length > 0 && (
                      <a
                        href="/categories"
                        className="px-3 py-2 text-white-80 hover:bg-gray-600 rounded-lg cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          console.log(`[DEBUG] View all categories clicked, navigating to: /categories`);
                          // Close the mobile menu
                          setMobileMenuOpen(false);
                          // Use direct browser navigation for more reliable routing
                          window.location.href = '/categories';
                        }}
                      >
                        View all categories...
                      </a>
                    )}
                  </>
                )}
              </div>
            )}
            <div className="h-px w-full bg-gray-600 my-2"></div>
            <a
              href="/account"
              className="px-3 py-2 text-white-80 hover:bg-gray-600 rounded-lg flex items-center gap-2 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                console.log(`[DEBUG] Mobile 'My Account' clicked, navigating to: /account`);
                // Close the mobile menu
                setMobileMenuOpen(false);
                // Use direct browser navigation for more reliable routing
                window.location.href = '/account';
              }}
            >
              <UserIcon className="w-4 h-4" />
              My Account
            </a>
            <a
              href="/wishlist"
              className="px-3 py-2 text-white-80 hover:bg-gray-600 rounded-lg flex items-center gap-2 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                console.log(`[DEBUG] Mobile 'Wishlist' clicked, navigating to: /wishlist`);
                // Close the mobile menu
                setMobileMenuOpen(false);
                // Use direct browser navigation for more reliable routing
                window.location.href = '/wishlist';
              }}
            >
              <HeartIcon className="w-4 h-4" />
              Wishlist
            </a>
          </div>
        </div>

        {/* Bottom navigation - desktop only */}
        <div className="w-full max-w-[1296px] h-12 hidden sm:flex items-center justify-between px-6">
          {/* Categories dropdown - always functional now */}
          <div ref={categoriesButtonRef} className="relative">
            <div
              className="inline-flex flex-col items-start px-6 py-3 bg-gray-700 rounded-[8px_8px_0px_0px] cursor-pointer select-none"
              onClick={() => {
                console.log(`[DEBUG] Desktop categories button clicked. Current state: ${showCategories ? 'open' : 'closed'}`);
                setShowCategories((v) => !v);
              }}
            >
              <div className="inline-flex items-center gap-4">
                <div className="inline-flex items-center gap-2">
                  <LayoutGridIcon className="w-[18px] h-[18px] text-gray-200" />
                  <span className="text-gray-200 font-navigation-nav-link-regular">Categories</span>
                </div>
                <ChevronDownIcon className="w-4 h-4 text-gray-200" />
              </div>
            </div>
            {showCategories && (
              <div
                ref={categoriesDropdownRef}
                className="absolute left-0 mt-2 bg-white-100 rounded-b-xl shadow-lg border border-gray-100 z-20 min-w-[260px]"
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <div className="flex flex-col p-3 gap-1.5">
                  {categories.map((category) => (
                    <a
                      key={category.id}
                      href={`/catalog/${category.slug}`}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer w-full"
                      onClick={(e) => {
                        e.preventDefault();
                        console.log(`[DEBUG] Desktop category clicked: ${category.name}, navigating to: /catalog/${category.slug}`);
                        // Close the categories dropdown
                        setShowCategories(false);
                        // Use direct browser navigation for more reliable routing
                        window.location.href = `/catalog/${category.slug}`;
                      }}
                      onMouseEnter={() => setHoveredCategory(category.name)}
                    >
                      <img 
                        className="w-5 h-5" 
                        alt={category.name} 
                        src={category.image || (category as any).icon || `/computer.svg`} 
                      />
                      <span className="text-gray-700">{category.name}</span>
                      <ChevronRightIcon className="w-4 h-4 text-gray-400 ml-auto" />
                    </a>
                  ))}
                </div>
              </div>
            )}
            {showCategories && hoveredCategory && (
              <div
                className="absolute left-[260px] top-0 bg-white-100 rounded-xl shadow-lg border border-gray-100 flex z-30 min-w-[700px] h-full"
                onMouseEnter={() => setHoveredCategory(hoveredCategory)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <div className="flex flex-row p-8 gap-12 flex-1">
                  <div className="flex flex-col gap-6 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">Popular {hoveredCategory} Items</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      {/* Mock subcategory items */}
                      {["iPhone 14", "Samsung Galaxy S23", "Google Pixel 7", "OnePlus 11", "Xiaomi 13", "Nothing Phone"].map((item, index) => (
                        <a
                          key={index}
                          href={`/catalog/${item.toLowerCase().replace(/\s+/g, '-')}`} 
                          className="text-gray-700 hover:text-primarymain text-sm py-1 block"
                          onClick={(e) => {
                            e.preventDefault();
                            console.log(`[DEBUG] Mega menu item clicked: ${item}, navigating to: /catalog/${item.toLowerCase().replace(/\s+/g, '-')}`);
                            // Close the categories dropdown
                            setShowCategories(false);
                            // Use direct browser navigation for more reliable routing
                            window.location.href = `/catalog/${item.toLowerCase().replace(/\s+/g, '-')}`;
                          }}
                        >
                          {item}
                        </a>
                      ))}
                    </div>
                    <a
                      href={`/catalog/${hoveredCategory.toLowerCase().replace(/\s+/g, '-')}`}
                      className="text-primarymain hover:underline text-sm font-medium mt-2"
                      onClick={(e) => {
                        e.preventDefault();
                        console.log(`[DEBUG] View all ${hoveredCategory} clicked, navigating to: /catalog/${hoveredCategory.toLowerCase().replace(/\s+/g, '-')}`);
                        // Close the categories dropdown
                        setShowCategories(false);
                        // Use direct browser navigation for more reliable routing
                        window.location.href = `/catalog/${hoveredCategory.toLowerCase().replace(/\s+/g, '-')}`;
                      }}
                    >
                      View all {hoveredCategory}
                    </a>
                  </div>
                  <div className="flex flex-col gap-6 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">Shop by Brand</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      {/* Mock brand items */}
                      {["Apple", "Samsung", "Google", "OnePlus", "Xiaomi", "Nothing"].map((item, index) => (
                        <a
                          key={index}
                          href={`/catalog?brand=${item.toLowerCase()}`}
                          className="text-gray-700 hover:text-primarymain text-sm py-1 block"
                          onClick={(e) => {
                            e.preventDefault();
                            console.log(`[DEBUG] Brand clicked: ${item}, navigating to: /catalog?brand=${item.toLowerCase()}`);
                            // Close the categories dropdown
                            setShowCategories(false);
                            // Use direct browser navigation for more reliable routing
                            window.location.href = `/catalog?brand=${item.toLowerCase()}`;
                          }}
                        >
                          {item}
                        </a>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 w-[200px]">
                    <div className="rounded-lg overflow-hidden">
                      <img
                        className="w-full h-auto"
                        alt="Promo"
                        src="/promo-image.jpg"
                      />
                    </div>
                    <div className="text-center">
                      <h4 className="text-sm font-medium text-gray-900">New Arrivals</h4>
                      <p className="text-xs text-gray-500">Check out the latest products</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation links */}
          <NavigationMenu className="hidden sm:flex">
            <NavigationMenuList>
              {navLinks.map((link, index) => (
                <NavigationMenuItem key={index}>
                  <a
                    href={link.path}
                    className="px-5 py-3 text-white-80 font-navigation-nav-link-regular"
                    onClick={(e) => {
                      e.preventDefault();
                      console.log(`[DEBUG] Navigation link clicked: ${link.label}, navigating to: ${link.path}`);
                      // Use direct browser navigation for more reliable routing
                      window.location.href = link.path;
                    }}
                  >
                    {link.label}
                  </a>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>

      {/* Hero section */}
      {showHeroSection && heroSlides.length > 0 && (
        <div className="w-full bg-white-100">
          <div className="w-full max-w-[1296px] mx-auto px-4 sm:px-6 py-8">
            <div className="relative">
              {heroSlides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`${
                    index === currentSlide ? "block" : "hidden"
                  } flex flex-col md:flex-row items-center gap-8`}
                >
                  <div className="flex-1 flex flex-col gap-6">
                    <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
                      {slide.title}
                    </h1>
                    <p className="text-xl text-gray-700">{slide.subtitle}</p>
                    <Button className="w-fit">{slide.button_text}</Button>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <img
                      className="max-w-full h-auto"
                      alt={slide.title}
                      src={slide.image}
                    />
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="icon"
                className="absolute top-1/2 -translate-y-1/2 left-4 rounded-full bg-white-100"
                onClick={prevSlide}
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute top-1/2 -translate-y-1/2 right-4 rounded-full bg-white-100"
                onClick={nextSlide}
              >
                <ChevronRightIcon className="w-6 h-6" />
              </Button>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2.5 h-2.5 rounded-full ${
                      index === currentSlide
                        ? "bg-primarymain"
                        : "bg-gray-300"
                    }`}
                    onClick={() => setCurrentSlide(index)}
                  ></button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}; 