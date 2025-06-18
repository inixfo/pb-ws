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
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "../../../../components/ui/navigation-menu";
import { Link, useNavigate } from "react-router-dom";
import { categoryService, promotionsService } from '../../../../services/api';
import { useCart } from "../../../../context/CartContext";
import { SearchBar } from '../../../../components/SearchBar/SearchBar';

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
      button_link: "#"
    },
    {
      id: 2,
      title: "iPhone 14 Pro",
      subtitle: "The ultimate smartphone experience",
      image: "/image-1.png",
      bg_color: "bg-gray-100",
      button_text: "Learn more",
      button_link: "#"
    },
    {
      id: 3,
      title: "MacBook Pro M2",
      subtitle: "Power to change everything",
      image: "/image-2.png",
      bg_color: "bg-indigo-100",
      button_text: "Buy now",
      button_link: "#"
    }
  ];

  const [showCategories, setShowCategories] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const categoriesButtonRef = useRef<HTMLDivElement>(null);
  const categoriesDropdownRef = useRef<HTMLDivElement>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

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
    },
    {
      id: 7,
      name: "TV & Home Theater",
      slug: "tv-home-theater",
      icon: "/tv.svg"
    },
    {
      id: 8,
      name: "Wearables & Smartwatches",
      slug: "wearables-smartwatches",
      icon: "/smartwatch.svg"
    }
  ];

  // Add state for the header promo
  const [headerPromo, setHeaderPromo] = useState<HeaderPromo | null>(null);
  const [headerPromoLoading, setHeaderPromoLoading] = useState(false);

  // Replace the static hero slides with dynamic state
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [heroSlidesLoading, setHeroSlidesLoading] = useState(false);

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
        !categoriesButtonRef.current.contains(event.target as Node)
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

  // Navigate to previous slide
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  // Navigate to next slide
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  // Handle categories button click based on whether we're on home page
  const handleCategoriesClick = () => {
    setShowCategories((prev) => !prev);
  };

  // Example mega menu data for 'Smartphones & Tablets'
  const megaMenuData: Record<string, { title: string; columns: { title: string; items: string[] }[]; banner?: { img: string; title: string; subtitle: string; cta: string } }> = {
    "Smartphones & Tablets": {
      title: "Smartphones & Tablets",
      columns: [
        {
          title: "Smartphones",
          items: ["Apple iPhone", "Samsung", "Xiaomi", "Nokia", "Meizu"],
        },
        {
          title: "Accessories",
          items: [
            "Accessory Kits",
            "Batteries & Battery Packs",
            "Cables",
            "Car Accessories",
            "Charges & Power Adapters",
            "FM Transmitters",
          ],
        },
        {
          title: "Tablets",
          items: ["Apple iPad", "Android Tablets", "Tablets with Keyboard"],
        },
      ],
      banner: {
        img: "/image-2.png",
        title: "iPad Pro M1",
        subtitle: "Deal of the week",
        cta: "Shop now",
      },
    },
    "Computers & Laptops": {
      title: "Computers & Laptops",
      columns: [
        {
          title: "Laptops",
          items: ["MacBooks", "Windows Laptops", "Chromebooks", "Gaming Laptops"],
        },
        {
          title: "Desktop Computers",
          items: [
            "All-in-One PCs",
            "Gaming Desktops",
            "Mac Desktops",
            "PC Components"
          ],
        },
        {
          title: "Accessories",
          items: ["Monitors", "Keyboards", "Mice", "Docking Stations", "External Storage"],
        },
      ],
      banner: {
        img: "/image-1.png",
        title: "MacBook Pro",
        subtitle: "New Release",
        cta: "Shop now",
      },
    },
    "Audio & Headphones": {
      title: "Audio & Headphones",
      columns: [
        {
          title: "Headphones",
          items: ["Over-ear", "On-ear", "In-ear", "Wireless", "Noise Cancelling"],
        },
        {
          title: "Speakers",
          items: [
            "Bluetooth Speakers",
            "Smart Speakers",
            "Soundbars",
            "Home Theater"
          ],
        }
      ],
      banner: {
        img: "/image.png",
        title: "Headphones ProMax",
        subtitle: "Feel the real quality sound",
        cta: "Shop now",
      },
    }
    // Add more categories as needed
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const data = await categoryService.getAll();
        if (data && data.results && data.results.length > 0) {
          setCategories(data.results);
          setCategoriesError(null);
        } else {
          setCategories(defaultCategories);
          setCategoriesError('No categories found.');
        }
      } catch (err) {
        setCategoriesError('Failed to load categories.');
        setCategories(defaultCategories);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch header promo
  useEffect(() => {
    const fetchHeaderPromo = async () => {
      try {
        setHeaderPromoLoading(true);
        const data = await promotionsService.getHeaderPromo();
        setHeaderPromo(data);
      } catch (error) {
        console.error('Failed to load header promo:', error);
        setHeaderPromo(null);
      } finally {
        setHeaderPromoLoading(false);
      }
    };
    
    fetchHeaderPromo();
  }, []);

  // Fetch hero slides
  useEffect(() => {
    const fetchHeroSlides = async () => {
      if (showHeroSection) {
        try {
          setHeroSlidesLoading(true);
          const data = await promotionsService.getHeroSlides();
          console.log('Fetched hero slides:', data);
          if (Array.isArray(data) && data.length > 0) {
            setHeroSlides(data);
          } else {
            console.warn('No hero slides returned from API, using fallback data');
            setHeroSlides(defaultHeroSlides as HeroSlide[]);
          }
        } catch (error) {
          console.error('Failed to load hero slides:', error);
          setHeroSlides(defaultHeroSlides as HeroSlide[]);
        } finally {
          setHeroSlidesLoading(false);
        }
      }
    };
    
    fetchHeroSlides();
  }, [showHeroSection]);

  // Use the cart context to get cart information
  const { cart, isAuthenticated, fetchCart } = useCart();
  const cartItemCount = cart?.items.length || 0;
  
  // Fetch cart when the component mounts
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  return (
    <header className="flex flex-col items-center w-full">
      {/* Top navigation bar */}
      <div className="w-full flex flex-col items-center bg-gray-800">
        <div className="w-full max-w-[1296px] h-auto sm:h-[88px] relative flex flex-wrap sm:flex-nowrap items-center justify-between px-4 sm:px-6 py-3 sm:py-0">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full p-3 sm:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </Button>

          {/* Logo */}
          <Link to="/">
            <img className="h-8 sm:h-10 w-auto sm:w-[141px]" alt="Phone Bay Logo" src="/logo.png" />
          </Link>

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
            onClick={() => navigate('/cart')}
          >
            <ShoppingCartIcon className="w-6 h-6" />
            {cartItemCount > 0 && (
              <Badge className="absolute w-5 h-5 top-0 right-0 bg-successmain rounded-xl flex items-center justify-center text-xs">
                {cartItemCount}
              </Badge>
            )}
          </Button>

          {/* SearchBar - desktop */}
          <div className="hidden sm:flex items-center relative ml-6 w-[490px]">
            <SearchBar />
          </div>

          {/* SearchBar - mobile (shown when search is toggled) */}
          <div className={`${searchOpen ? 'flex' : 'hidden'} w-full sm:hidden items-center my-3`}>
            <SearchBar isMobile={true} />
          </div>

          {/* Promotion - desktop only - Dynamic from backend */}
          {headerPromo && (
            <div className="hidden md:flex items-center gap-2 ml-6">
              <div className="inline-flex justify-center p-[15px] rounded-[100px] items-center" 
                   style={{ backgroundColor: headerPromo.bg_color }}>
                {headerPromo.icon ? (
                  <img className="w-[18px] h-[18px]" alt="Promo Icon" src={headerPromo.icon} />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px]">
                    <path d="M5 3v18c0 .6.4 1 1 1h12c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1H6c-.6 0-1 .4-1 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 18v0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div className="flex flex-col w-[120px] items-start gap-0.5">
                <span className="text-gray-300 font-body-extrasmall">
                  {headerPromo.subtitle}
                </span>
                <span className="font-medium text-white-100 text-base">
                  {headerPromo.title}
                </span>
              </div>
            </div>
          )}

          {/* Action icons - desktop only */}
          <div className="hidden sm:flex items-center gap-1 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full p-[15px] relative"
              onClick={() => navigate('/cart')}
            >
              <ShoppingCartIcon className="w-[18px] h-[18px] text-white-80" />
              {cartItemCount > 0 && (
                <Badge className="absolute w-6 h-6 top-0 right-0 bg-successmain rounded-xl border-[3px] border-solid border-[#222934] flex items-center justify-center">
                  <span className="text-white-100 text-xs font-body-extra-small">
                    {cartItemCount}
                  </span>
                </Badge>
              )}
            </Button>
            <Button
              variant="default"
              size="icon"
              className="rounded-full p-[15px] bg-gray-700"
              onClick={() => navigate('/account')}
            >
              <UserIcon className="w-[18px] h-[18px] text-white-80" />
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} sm:hidden w-full flex-col bg-gray-700 p-4 z-50`}>
          <div className="flex flex-col gap-2">
            {navLinks.map((link, index) => (
              <Link
                key={index}
                to={link.path}
                className="px-3 py-2 text-white-80 hover:bg-gray-600 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="h-px w-full bg-gray-600 my-2"></div>
            {/* Mobile Categories button - now functional on all pages */}
            <button
              className="flex items-center justify-between px-3 py-2 text-white-80 hover:bg-gray-600 rounded-lg w-full"
              onClick={() => setShowCategories(!showCategories)}
            >
              <span className="flex items-center gap-2">
                <LayoutGridIcon className="w-4 h-4" />
                Categories
              </span>
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${showCategories ? 'rotate-180' : ''}`} />
            </button>
            {showCategories && mobileMenuOpen ? (
              <div className="ml-4 flex flex-col gap-1 mt-1">
                {categoriesLoading ? (
                  <div className="px-3 py-2 text-white-80">Loading categories...</div>
                ) : categoriesError ? (
                  <div className="px-3 py-2 text-white-80">Error: {categoriesError}</div>
                ) : (
                  <>
                    {categories.map((category) => (
                      <a
                        key={category.id}
                        href="#"
                        className="px-3 py-2 text-white-80 hover:bg-gray-600 rounded-lg flex items-center gap-2"
                        onClick={(e) => {
                          e.preventDefault();
                          setMobileMenuOpen(false);
                          navigate(`/catalog/${category.slug}`);
                        }}
                      >
                        <img 
                          className="w-4 h-4" 
                          alt={category.name} 
                          src={category.image || category.icon || `/computer.svg`} 
                        />
                        {category.name}
                      </a>
                    ))}
                    <a
                      href="#"
                      className="px-3 py-2 text-white-80 hover:bg-gray-600 rounded-lg font-medium"
                      onClick={(e) => {
                        e.preventDefault();
                        setMobileMenuOpen(false);
                        navigate('/catalog');
                      }}
                    >
                      See All Products
                    </a>
                  </>
                )}
              </div>
            ) : null}
            <div className="h-px w-full bg-gray-600 my-2"></div>
            <a
              href="/account"
              className="px-3 py-2 text-white-80 hover:bg-gray-600 rounded-lg flex items-center gap-2"
            >
              <UserIcon className="w-4 h-4" />
              My Account
            </a>
          </div>
        </div>

        {/* Bottom navigation - desktop only */}
        <div className="w-full max-w-[1296px] h-12 hidden sm:flex items-center justify-between px-6">
          {/* Categories dropdown - always functional now */}
          <div ref={categoriesButtonRef} className="relative">
            <div
              className="inline-flex flex-col items-start px-6 py-3 bg-gray-700 rounded-[8px_8px_0px_0px] cursor-pointer select-none"
              onClick={handleCategoriesClick}
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
                  {categories.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer w-full"
                      onClick={() => navigate(`/catalog/${item.slug}`)}
                      onMouseEnter={() => setHoveredCategory(item.name)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    >
                      <img className="w-5 h-5" alt={item.name} src={item.image || item.icon || '/default-category.svg'} />
                      <span className="font-medium text-gray-700 text-sm w-[198px]">{item.name}</span>
                      <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                    </div>
                  ))}
                  <a
                    href="#"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer w-full mt-1 border-t border-gray-100 pt-3"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/catalog');
                    }}
                  >
                    <span className="font-medium text-primarymain text-sm w-full">See All Products</span>
                    <ChevronRightIcon className="w-4 h-4 text-primarymain" />
                  </a>
                </div>
                {/* Mega menu (if hovered) */}
                {hoveredCategory && megaMenuData[hoveredCategory] && (
                  <div
                    className="absolute left-[260px] top-0 bg-white-100 rounded-xl shadow-lg border border-gray-100 flex z-30 min-w-[700px] h-full"
                    onMouseEnter={() => setHoveredCategory(hoveredCategory)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <div className="flex flex-row p-8 gap-12 flex-1">
                      {megaMenuData[hoveredCategory].columns.map((col, idx) => (
                        <div key={idx} className="flex flex-col gap-2 min-w-[160px]">
                          <div className="font-semibold text-gray-900 mb-2">{col.title}</div>
                          {col.items.map((item, i) => (
                            <button
                              key={i}
                              className="text-left text-gray-700 hover:text-primarymain text-sm py-1 block"
                              onClick={() => navigate(`/catalog/${item.toLowerCase().replace(/\s+/g, '-')}`)}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      ))}
                      {/* Banner */}
                      {megaMenuData[hoveredCategory].banner && (
                        <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-6 min-w-[220px] h-full">
                          <img src={megaMenuData[hoveredCategory].banner.img} alt="Banner" className="w-40 h-32 object-contain mb-4" />
                          <div className="text-xs text-gray-500 mb-1">{megaMenuData[hoveredCategory].banner.subtitle}</div>
                          <div className="font-bold text-lg text-gray-900 mb-2">{megaMenuData[hoveredCategory].banner.title}</div>
                          <Button className="bg-primarymain text-white-100 rounded-md px-4 py-2 text-sm">
                            {megaMenuData[hoveredCategory].banner.cta}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation links */}
          <NavigationMenu className="ml-0 hidden md:block">
            <NavigationMenuList className="flex gap-1">
              {navLinks.map((link, index) => (
                <NavigationMenuItem key={index}>
                  <Link 
                    to={link.path} 
                    className="px-5 py-3 text-white-80 font-navigation-nav-link-regular hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>

      {/* Hero section with categories sidebar and slider */}
      {showHeroSection && (
        <div className="w-full max-w-[1296px] relative flex">
          {/* Categories sidebar - desktop only */}
          <div className="hidden md:inline-flex items-start p-3 bg-white-100 rounded-[0px_0px_16px_16px] border border-solid border-[#eef1f6] shadow-shadow-light-mode-medium z-10 relative">
            <div className="flex flex-col items-start gap-1.5">
              {categories.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg w-full cursor-pointer hover:bg-gray-100"
                  onClick={() => navigate(`/catalog/${item.slug}`)}
                  onMouseEnter={() => setHoveredCategory(item.name)}
                >
                  <img className="w-5 h-5" alt={item.name} src={item.image || item.icon || '/default-category.svg'} />
                  <span className="font-medium text-gray-700 text-sm w-[198px]">
                    {item.name}
                  </span>
                  <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                </div>
              ))}
              
              {/* See All Categories link in hero section */}
              <a
                href="#"
                className="flex items-center gap-3 px-3 py-2 rounded-lg w-full cursor-pointer hover:bg-gray-100 mt-1 border-t border-gray-100 pt-3"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/catalog');
                }}
              >
                <span className="font-medium text-primarymain text-sm w-full">See All Products</span>
                <ChevronRightIcon className="w-4 h-4 text-primarymain" />
              </a>
              
              {/* Mega menu for sidebar categories */}
              {hoveredCategory && megaMenuData[hoveredCategory] && (
                <div
                  className="absolute left-[260px] top-0 bg-white-100 rounded-xl shadow-lg border border-gray-100 flex z-30 min-w-[700px] h-auto"
                  onMouseEnter={() => setHoveredCategory(hoveredCategory)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <div className="flex flex-row p-8 gap-12 flex-1">
                    {megaMenuData[hoveredCategory].columns.map((col, idx) => (
                      <div key={idx} className="flex flex-col gap-2 min-w-[160px]">
                        <div className="font-semibold text-gray-900 mb-2">{col.title}</div>
                        {col.items.map((item, i) => (
                          <button
                            key={i}
                            className="text-left text-gray-700 hover:text-primarymain text-sm py-1 block"
                            onClick={() => navigate(`/catalog/${item.toLowerCase().replace(/\s+/g, '-')}`)}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    ))}
                    {/* Banner */}
                    {megaMenuData[hoveredCategory].banner && (
                      <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-6 min-w-[220px] h-full">
                        <img src={megaMenuData[hoveredCategory].banner.img} alt="Banner" className="w-40 h-32 object-contain mb-4" />
                        <div className="text-xs text-gray-500 mb-1">{megaMenuData[hoveredCategory].banner.subtitle}</div>
                        <div className="font-bold text-lg text-gray-900 mb-2">{megaMenuData[hoveredCategory].banner.title}</div>
                        <Button className="bg-primarymain text-white-100 rounded-md px-4 py-2 text-sm">
                          {megaMenuData[hoveredCategory].banner.cta}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hero Slider */}
          <div className="flex-1 relative overflow-hidden rounded-lg ml-4 md:ml-6 mr-4 md:mr-0 my-4 md:my-6 h-[400px]">
            {heroSlidesLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="w-12 h-12 border-4 border-primarymain border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : heroSlides.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <p className="text-gray-500">No slides available</p>
              </div>
            ) : (
              <>
                <div 
                  className="flex transition-transform duration-500 ease-in-out h-full"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {heroSlides.map((slide) => (
                    <div 
                      key={slide.id} 
                      className={`flex-shrink-0 w-full h-full ${slide.bg_color} flex flex-col md:flex-row items-center justify-center md:justify-between px-4 md:px-16 py-6 md:py-8 relative`}
                    >
                      <div className="z-10 w-full md:max-w-[50%] text-center md:text-left mb-4 md:mb-0">
                        <p className="text-gray-600 mb-2">{slide.subtitle}</p>
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6">{slide.title}</h2>
                        <Button 
                          className="bg-primarymain hover:bg-primarymain/90 text-white px-6 md:px-8 py-2 md:py-3 rounded-full"
                          asChild
                        >
                          <a href={slide.button_link}>{slide.button_text}</a>
                        </Button>
                      </div>
                      <div className="z-10 flex-shrink-0">
                        <img 
                          src={slide.image} 
                          alt={slide.title}
                          className="h-[200px] md:h-[350px] object-contain"
                          onError={(e) => {
                            console.error(`Failed to load image: ${slide.image}`);
                            e.currentTarget.src = "/image-placeholder.png";
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Navigation arrows */}
                <button 
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md z-20"
                  onClick={prevSlide}
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <button 
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md z-20"
                  onClick={nextSlide}
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
                
                {/* Dots indicator */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
                  {heroSlides.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full ${currentSlide === index ? 'bg-primarymain' : 'bg-gray-300'}`}
                      onClick={() => setCurrentSlide(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
