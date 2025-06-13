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
  XIcon
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
import { useCategories } from "../../../hooks/useCategories";
import { Category } from "../../../types/products";
import { useNavigate } from "react-router-dom";

// Hardcoded backend categories - guaranteed to work
const backendCategories: Category[] = [
  {"id":5,"name":"AC","slug":"ac","description":"Air conditioners","image":"/computer.svg","is_active":true},
  {"id":1,"name":"Bikes","slug":"bikes","description":"","image":"/smartphone-2.svg","is_active":true},
  {"id":2,"name":"Laptops","slug":"laptops","description":"","image":"/monitor-2.svg","is_active":true},
  {"id":4,"name":"Mobiles","slug":"mobiles","description":"","image":"/speaker-2.svg","is_active":true},
  {"id":3,"name":"Monitors","slug":"monitors","description":"","image":"/camera-2.svg","is_active":true},
  {"id":6,"name":"TV","slug":"tv","description":"","image":"/printer-2.svg","is_active":true}
];

export const HeaderByAnima = ({ showHeroSection = true }: { showHeroSection?: boolean } = {}): JSX.Element => {
  const navigate = useNavigate();
  
  // Try to get categories from our custom hook, but fallback to hardcoded if it fails
  const { categories: hookCategories, loading: hookLoading, error: hookError } = useCategories();
  
  // Force use the categories from the hook if available, otherwise use the hardcoded backend categories
  const [categories, setCategories] = useState<Category[]>(backendCategories);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  
  // Update categories when the hook resolves
  useEffect(() => {
    if (!hookLoading) {
      if (hookError) {
        console.warn('Hook error, using hardcoded categories:', hookError);
        setCategoryError(hookError);
      } else if (hookCategories && hookCategories.length > 0) {
        console.log('Using categories from hook:', hookCategories.length);
        setCategories(hookCategories);
        setCategoryError(null);
      } else {
        console.log('Hook returned no categories, using hardcoded backup');
      }
      setLoadingCategories(false);
    } else {
      setLoadingCategories(true);
    }
  }, [hookLoading, hookError, hookCategories]);
  
  console.log('HeaderByAnima rendered with categories:', categories.length);

  // Navigation links data
  const navLinks = [
    "Best Sellers",
    "Today's Deals",
    "New Arrivals",
    "Gift Cards",
    "Help Center",
  ];

  // Hero slider data
  const heroSlides = [
    {
      id: 1,
      title: "Headphones ProMax",
      subtitle: "Feel the real quality sound",
      image: "/image.png",
      bgColor: "bg-blue-100",
      buttonText: "Shop now",
      buttonLink: "#"
    },
    {
      id: 2,
      title: "iPhone 14 Pro",
      subtitle: "The ultimate smartphone experience",
      image: "/image-1.png",
      bgColor: "bg-gray-100",
      buttonText: "Learn more",
      buttonLink: "#"
    },
    {
      id: 3,
      title: "MacBook Pro M2",
      subtitle: "Power to change everything",
      image: "/image-2.png",
      bgColor: "bg-indigo-100",
      buttonText: "Buy now",
      buttonLink: "#"
    }
  ];

  const [showCategories, setShowCategories] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const categoriesButtonRef = useRef<HTMLDivElement>(null);
  const categoriesDropdownRef = useRef<HTMLDivElement>(null);

  // Auto slide for hero section
  useEffect(() => {
    if (showHeroSection) {
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

  // Example mega menu data for categories
  const megaMenuData: Record<string, { title: string; columns: { title: string; items: string[] }[]; banner?: { img: string; title: string; subtitle: string; cta: string } }> = {
    "AC": {
      title: "Air Conditioners",
      columns: [
        {
          title: "By Type",
          items: ["Split AC", "Window AC", "Portable AC", "Inverter AC", "Central AC"],
        },
        {
          title: "By Brand",
          items: ["Daikin", "Carrier", "LG", "Samsung", "Voltas", "Hitachi"],
        },
        {
          title: "By Capacity",
          items: ["1 Ton", "1.5 Ton", "2 Ton", "3 Ton"],
        },
      ],
      banner: {
        img: "/image-2.png",
        title: "Summer Sale",
        subtitle: "Up to 30% off",
        cta: "Shop now",
      },
    },
    "Bikes": {
      title: "Bikes",
      columns: [
        {
          title: "By Type",
          items: ["Mountain Bikes", "Road Bikes", "Hybrid Bikes", "Electric Bikes", "BMX"],
        },
        {
          title: "By Brand",
          items: ["Hero", "Trek", "Giant", "Specialized", "Cannondale"],
        },
        {
          title: "Accessories",
          items: ["Helmets", "Lights", "Locks", "Pumps", "Repair Tools"],
        },
      ],
      banner: {
        img: "/image.png",
        title: "New Arrivals",
        subtitle: "Latest Models",
        cta: "View Collection",
      },
    },
    "Mobile Phones": {
      title: "Mobile Phones",
      columns: [
        {
          title: "By Brand",
          items: ["Apple", "Samsung", "Xiaomi", "OnePlus", "Google", "Oppo"],
        },
        {
          title: "By Price Range",
          items: ["Budget Phones", "Mid-range", "Premium", "Flagship"],
        },
        {
          title: "Accessories",
          items: ["Cases", "Screen Protectors", "Chargers", "Power Banks", "Earphones"],
        },
      ],
      banner: {
        img: "/image-1.png",
        title: "iPhone 14 Pro",
        subtitle: "Now Available",
        cta: "Shop now",
      },
    },
    "Refrigerator": {
      title: "Refrigerators",
      columns: [
        {
          title: "By Type",
          items: ["Single Door", "Double Door", "Side by Side", "French Door", "Mini Refrigerators"],
        },
        {
          title: "By Brand",
          items: ["LG", "Samsung", "Whirlpool", "Haier", "Godrej", "Bosch"],
        },
        {
          title: "Features",
          items: ["Frost Free", "Inverter Technology", "Smart Refrigerators", "Energy Efficient"],
        },
      ],
      banner: {
        img: "/image-2.png",
        title: "Smart Cooling",
        subtitle: "Energy Efficient",
        cta: "Explore Now",
      },
    },
    "TV": {
      title: "Televisions",
      columns: [
        {
          title: "By Type",
          items: ["LED", "OLED", "QLED", "Smart TV", "Android TV", "4K Ultra HD"],
        },
        {
          title: "By Size",
          items: ["32 inch", "43 inch", "50 inch", "55 inch", "65 inch", "75 inch & above"],
        },
        {
          title: "By Brand",
          items: ["Samsung", "LG", "Sony", "Mi", "OnePlus", "TCL"],
        },
      ],
      banner: {
        img: "/image.png",
        title: "OLED Experience",
        subtitle: "Premium Viewing",
        cta: "Shop now",
      },
    },
    "Washing Machine": {
      title: "Washing Machines",
      columns: [
        {
          title: "By Type",
          items: ["Front Load", "Top Load", "Semi-Automatic", "Fully Automatic", "Washer Dryers"],
        },
        {
          title: "By Brand",
          items: ["LG", "Samsung", "Bosch", "IFB", "Whirlpool", "Panasonic"],
        },
        {
          title: "By Capacity",
          items: ["6 Kg", "7 Kg", "8 Kg", "9 Kg & above"],
        },
      ],
      banner: {
        img: "/image-1.png",
        title: "Smart Washing",
        subtitle: "Water Efficient",
        cta: "View All",
      },
    },
    // Add more categories as needed
  };

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
            onClick={() => navigate('/cart')}
          >
            <ShoppingCartIcon className="w-6 h-6" />
            <Badge className="absolute w-5 h-5 top-0 right-0 bg-successmain rounded-xl flex items-center justify-center text-xs">
              3
            </Badge>
          </Button>

          {/* SearchIcon bar - desktop */}
          <div className="hidden sm:flex items-center relative ml-6">
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-[100px] border border-solid border-white w-[490px]">
              <SearchIcon className="w-[18px] h-[18px] text-gray-500" />
              <Input
                className="flex-1 border-none bg-transparent text-gray-500 font-body-regular placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                placeholder="Search the products"
              />
            </div>
          </div>

          {/* SearchIcon bar - mobile (shown when search is toggled) */}
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
              onClick={() => navigate('/wishlist')}
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
              onClick={() => navigate('/cart')}
            >
              <ShoppingCartIcon className="w-[18px] h-[18px] text-white-80" />
              <Badge className="absolute w-6 h-6 top-0 right-0 bg-successmain rounded-xl border-[3px] border-solid border-[#222934] flex items-center justify-center">
                <span className="text-white-100 text-xs font-body-extra-small">
                  3
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
        <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} sm:hidden w-full flex-col bg-gray-700 p-4`}>
          <div className="flex flex-col gap-2">
            {navLinks.map((link, index) => (
              <a
                key={index}
                href="#"
                className="px-3 py-2 text-white-80 hover:bg-gray-600 rounded-lg"
              >
                {link}
              </a>
            ))}
            <div className="h-px w-full bg-gray-600 my-2"></div>
            <Button
              variant="ghost"
              className="justify-start px-3 py-2 text-white-80 hover:bg-gray-600 rounded-lg"
              onClick={() => setShowCategories(!showCategories)}
            >
              <span className="flex items-center gap-2">
                Categories
                <ChevronDownIcon className="w-4 h-4" />
              </span>
            </Button>
            {(showCategories || showHeroSection) && (
              <div className="ml-4 flex flex-col gap-1 mt-1">
                {loadingCategories ? (
                  <div className="px-3 py-2 text-white-80">Loading categories...</div>
                ) : categoryError ? (
                  <div className="px-3 py-2 text-white-80">Error: {categoryError}</div>
                ) : (
                  <>
                    {console.log('Rendering mobile categories:', categories.length)}
                    {categories.slice(0, 6).map((category) => (
                      <a
                        key={category.id}
                        href={`/category/${category.slug}`}
                        className="px-3 py-2 text-white-80 hover:bg-gray-600 rounded-lg flex items-center gap-2"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/category/${category.slug}`);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <img 
                          className="w-4 h-4" 
                          alt={category.name} 
                          src={category.image || `/default-category.svg`} 
                        />
                        {category.name}
                      </a>
                    ))}
                    {categories.length > 0 && (
                      <a
                        href="/categories"
                        className="px-3 py-2 text-white-80 hover:bg-gray-600 rounded-lg"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate('#');
                          setMobileMenuOpen(false);
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
              href="#"
              className="px-3 py-2 text-white-80 hover:bg-gray-600 rounded-lg flex items-center gap-2"
            >
              <UserIcon className="w-4 h-4" />
              My Account
            </a>
            <a
              href="/wishlist"
              className="px-3 py-2 text-white-80 hover:bg-gray-600 rounded-lg flex items-center gap-2"
            >
              <HeartIcon className="w-4 h-4" />
              Wishlist
            </a>
          </div>
        </div>

        {/* Bottom navigation - desktop only */}
        <div className="w-full max-w-[1296px] h-12 hidden sm:flex items-center justify-between px-6">
          {/* Categories dropdown - only show when not on home page */}
          {!showHeroSection && (
            <div ref={categoriesButtonRef} className="relative">
              <div
                className="inline-flex flex-col items-start px-6 py-3 bg-gray-700 rounded-[8px_8px_0px_0px] cursor-pointer select-none"
                onClick={() => setShowCategories((v) => !v)}
              >
                <div className="inline-flex items-center gap-4">
                  <div className="inline-flex items-center gap-2">
                    <img className="w-[18px] h-[18px]" alt="Icon" src="/icon-26.svg" />
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
                    {loadingCategories ? (
                      <div className="px-3 py-2 text-gray-500">Loading categories...</div>
                    ) : categoryError ? (
                      <div className="px-3 py-2 text-gray-500">Error: {categoryError}</div>
                    ) : (
                      <>
                        {console.log('Rendering dropdown categories:', categories.length)}
                        {categories.map((category) => {
                          // Find the megaMenu data for this category (by name)
                          const categoryMegaMenu = megaMenuData[category.name];
                          
                          return (
                            <div
                              key={category.id}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer w-full"
                              onMouseEnter={() => setHoveredCategory(category.name)}
                              onClick={() => navigate(`/category/${category.slug}`)}
                            >
                              <img 
                                className="w-5 h-5" 
                                alt={category.name} 
                                src={category.image || `/default-category.svg`} 
                              />
                              <span className="font-medium text-gray-700 text-sm w-[198px]">
                                {category.name}
                              </span>
                              <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                            </div>
                          );
                        })}
                      </>
                    )}
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
                              <a 
                                key={i} 
                                href={`/category/${item.toLowerCase().replace(/\s+/g, '-')}`} 
                                className="text-gray-700 hover:text-primarymain text-sm py-1 block"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(`/category/${item.toLowerCase().replace(/\s+/g, '-')}`);
                                }}
                              >
                                {item}
                              </a>
                            ))}
                          </div>
                        ))}
                        {/* Banner */}
                        {megaMenuData[hoveredCategory].banner && (
                          <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-6 min-w-[220px] h-full">
                            <img src={megaMenuData[hoveredCategory].banner.img} alt="Banner" className="w-40 h-32 object-contain mb-4" />
                            <div className="text-xs text-gray-500 mb-1">{megaMenuData[hoveredCategory].banner.subtitle}</div>
                            <div className="font-bold text-lg text-gray-900 mb-2">{megaMenuData[hoveredCategory].banner.title}</div>
                            <Button 
                              className="bg-primarymain text-white-100 rounded-md px-4 py-2 text-sm"
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(`/category/${hoveredCategory.toLowerCase().replace(/\s+/g, '-')}`);
                              }}
                            >
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
          )}

          {/* Navigation links */}
          <NavigationMenu className={`${!showHeroSection ? 'ml-0' : 'ml-0 flex-1'} hidden md:block`}>
            <NavigationMenuList className="flex gap-1">
              {navLinks.map((link, index) => (
                <NavigationMenuItem key={index}>
                  <NavigationMenuLink className="px-5 py-3 text-white-80 font-navigation-nav-link-regular">
                    {link}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Language and currency selectors */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-white-80 font-navigation-nav-link-small">
                Eng
              </span>
              <ChevronDownIcon className="w-3.5 h-3.5 text-white-80" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white-80 font-navigation-nav-link-small">
                USD ($)
              </span>
              <ChevronDownIcon className="w-3.5 h-3.5 text-white-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Hero section with categories sidebar and slider */}
      {showHeroSection && (
        <div className="w-full max-w-[1296px] relative flex">
          {/* Removed: Categories sidebar - desktop only */}
          {/* Hero Slider */}
          <div className="flex-1 relative overflow-hidden rounded-lg ml-0 md:ml-6 mr-4 md:mr-0 my-4 md:my-6 h-[400px]">
            <div 
              className="flex transition-transform duration-500 ease-in-out h-full"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {heroSlides.map((slide) => (
                <div 
                  key={slide.id} 
                  className={`flex-shrink-0 w-full h-full ${slide.bgColor} flex flex-col md:flex-row items-center justify-between px-8 md:px-16 py-8 relative`}
                >
                  <div className="z-10 md:max-w-[50%] text-center md:text-left mb-8 md:mb-0">
                    <p className="text-gray-600 mb-2">{slide.subtitle}</p>
                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">{slide.title}</h2>
                    <Button 
                      className="bg-primarymain hover:bg-primarymain/90 text-white px-8 py-3 rounded-full"
                      asChild
                    >
                      <a href={slide.buttonLink}>{slide.buttonText}</a>
                    </Button>
                  </div>
                  <div className="z-10 flex-shrink-0">
                    <img 
                      src={slide.image} 
                      alt={slide.title}
                      className="h-[250px] md:h-[350px] object-contain"
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
          </div>
        </div>
      )}
    </header>
  );
}; 