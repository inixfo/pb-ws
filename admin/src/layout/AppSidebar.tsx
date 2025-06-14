import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

// Import icons
import {
  BoxCubeIcon,
  ChevronDownIcon,
  GridIcon,
  UserCircleIcon,
  TableIcon,
  ShoppingBagIcon,
  UsersIcon,
  SettingsIcon,
  CreditCardIcon,
  StarIcon,
  BellIcon,
  ChartBarIcon,
  PackageIcon,
  TagIcon,
  LogOutIcon
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import SidebarWidget from "./SidebarWidget";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
  roles?: string[]; // Array of roles that can see this item
};

// Define the submenu type
type SubmenuState = {
  type: "main" | "others";
  index: number;
} | null;

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [openSubmenu, setOpenSubmenu] = useState<SubmenuState>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Define admin navigation items
  const adminNavItems: NavItem[] = [
    {
      icon: <GridIcon />,
      name: "Dashboard",
      path: "/",
      roles: ['admin'],
    },
    {
      icon: <UsersIcon />,
      name: "User Management",
      path: "/admin/users",
      roles: ['admin'],
    },
    {
      icon: <BoxCubeIcon />,
      name: "Products",
      subItems: [
        { name: "All Products", path: "/admin/products" },
        { name: "Categories", path: "/admin/categories" },
        { name: "Brands", path: "/admin/brands" },
        { name: "Custom Fields", path: "/admin/custom-fields" },
        { name: "Promotions", path: "/admin/promotions" },
      ],
      roles: ['admin'],
    },
    {
      icon: <ShoppingBagIcon />,
      name: "Orders",
      path: "/admin/orders",
      roles: ['admin'],
    },
    {
      icon: <CreditCardIcon />,
      name: "EMI Management",
      subItems: [
        { name: "EMI Plans", path: "/admin/emi-plans" },
        { name: "EMI Applications", path: "/admin/emi-applications" },
      ],
      roles: ['admin'],
    },
    {
      icon: <PackageIcon />,
      name: "Vendors",
      subItems: [
        { name: "All Vendors", path: "/admin/vendors" },
        { name: "Vendor Payouts", path: "/admin/vendor-payouts" },
      ],
      roles: ['admin'],
    },
    {
      icon: <StarIcon />,
      name: "Reviews",
      path: "/admin/reviews",
      roles: ['admin'],
    },
  ];

  // Define vendor navigation items
  const vendorNavItems: NavItem[] = [
    {
      icon: <GridIcon />,
      name: "Dashboard",
      path: "/vendor/dashboard",
      roles: ['vendor'],
    },
    {
      icon: <BoxCubeIcon />,
      name: "My Products",
      path: "/vendor/products",
      roles: ['vendor'],
    },
    {
      icon: <ShoppingBagIcon />,
      name: "Orders",
      path: "/vendor/orders",
      roles: ['vendor'],
    },
    {
      icon: <ChartBarIcon />,
      name: "Analytics",
      path: "/vendor/analytics",
      roles: ['vendor'],
    },
    {
      icon: <CreditCardIcon />,
      name: "Earnings & Payments",
      subItems: [
        { name: "Earnings", path: "/vendor/earnings" },
        { name: "Payment Settings", path: "/vendor/payment-settings" },
      ],
      roles: ['vendor'],
    },
    {
      icon: <UserCircleIcon />,
      name: "My Profile",
      path: "/vendor/profile",
      roles: ['vendor'],
    },
  ];

  // Shared navigation items
  const sharedNavItems: NavItem[] = [
    {
      icon: <UserCircleIcon />,
      name: "My Profile",
      path: "/profile",
      roles: ['admin'],  // Now only for admin
    },
  ];

  // Memoize navItems to prevent unnecessary rerenders
  const memoizedNavItems = useCallback(() => {
    return [
      ...(user?.role === 'admin' ? adminNavItems : []),
      ...(user?.role === 'vendor' ? vendorNavItems : []),
      ...sharedNavItems,
    ];
  }, [user?.role]);

  // Combined navigation items based on user role
  const navItems = memoizedNavItems();

  // Action items at the bottom of the sidebar
  const actionItems: NavItem[] = [
    {
      icon: <LogOutIcon />,
      name: "Logout",
      path: "#",
      roles: ['admin', 'vendor'],
    },
  ];

  // Handle logout
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    // Close any open submenus first
    setOpenSubmenu(null);
    // Then perform logout
    logout();
  };

  const isActive = useCallback(
    (path: string) => {
      // Special handling for root/home
      if (path === '/' && location.pathname === '/') {
        return true;
      }
      
      // Handle exact matches first
      if (path !== '/' && location.pathname === path) {
        return true;
      }
      
      // Special handling for Products section
      if (path === '/admin/products') {
        return location.pathname === '/admin/products' || 
               location.pathname.includes('/admin/products/new') ||
               location.pathname.includes('/admin/products/edit') &&
               !location.pathname.includes('/admin/categories') && 
               !location.pathname.includes('/admin/brands');
      }
      
      // Special handling for Categories
      if (path === '/admin/categories') {
        return location.pathname.includes('/admin/categories');
      }
      
      // Special handling for Brands
      if (path === '/admin/brands') {
        return location.pathname.includes('/admin/brands');
      }
      
      // Special handling for Custom Fields
      if (path === '/admin/custom-fields') {
        return location.pathname.includes('/admin/custom-fields');
      }
      
      // Special handling for EMI Plans
      if (path === '/admin/emi-plans') {
        return location.pathname.includes('/admin/emi-plans') && 
               !location.pathname.includes('/admin/emi-applications');
      }
      
      // Special handling for EMI Applications
      if (path === '/admin/emi-applications') {
        return location.pathname.includes('/admin/emi-applications');
      }
      
      // All other cases - exact path matching
      return location.pathname === path;
    },
    [location.pathname]
  );

  // Skip the path-based submenu detection for now
  const pathBasedSubmenuDetection = useCallback(() => {
    // We'll implement this later once we fix the TypeScript errors
    // This is a stub that does nothing for now
    console.log("Path-based submenu detection disabled temporarily");
  }, []);

  useEffect(() => {
    // Simplified approach that just logs the path change
    console.log(`Path changed to: ${location.pathname}`);
    // We'll implement a simpler version later
  }, [location.pathname]);

  // Manual submenu toggling still works
  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      // If clicking the same submenu that's already open, close it
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        console.log(`Closing submenu: ${menuType}-${index}`);
        return null;
      }
      
      // Otherwise, open the clicked submenu
      console.log(`Opening submenu: ${menuType}-${index}`);
      return { type: menuType, index };
    });
  };

  // Global safe navigation function that handles dropdown state
  const safeNavigate = (to: string) => {
    if (to === "#") return; // Skip navigation for placeholders
    
    console.log(`Safe navigating to: ${to} from ${location.pathname}`);
    console.log(`Current submenu state:`, openSubmenu);
    
    // First, close all dropdowns
    setOpenSubmenu(null);
    
    // Add a short delay to ensure React state updates
    setTimeout(() => {
      console.log(`Navigation executing to: ${to}`);
      // Direct navigation for reliability
      window.location.href = to;
    }, 100);
  };

  // Regular navigation component
  const NavLink = ({ to, className, children }: { to: string, className: string, children: React.ReactNode }) => {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      safeNavigate(to);
    };

    return (
      <Link to={to} className={className} onClick={handleClick}>
        {children}
      </Link>
    );
  };
  
  // Special component for submenu items
  const SubmenuNavLink = ({ to, className, children }: { to: string, className: string, children: React.ReactNode }) => {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      safeNavigate(to);
    };

    return (
      <Link to={to} className={className} onClick={handleClick}>
        {children}
      </Link>
    );
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => {
        // Skip rendering if user role doesn't match
        if (nav.roles && user && !nav.roles.includes(user.role)) {
          return null;
        }

        // Special case for logout
        if (nav.name === "Logout") {
          return (
            <li key={nav.name}>
              <a
                href="#"
                onClick={handleLogout}
                className={`menu-item group menu-item-inactive cursor-pointer ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                }`}
              >
                <span className="menu-item-icon-size menu-item-icon-inactive">
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </a>
            </li>
          );
        }

        return (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-active"
                    : "menu-item-inactive"
                } cursor-pointer ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                      openSubmenu?.type === menuType &&
                      openSubmenu?.index === index
                        ? "rotate-180 text-brand-500"
                        : ""
                    }`}
                  />
                )}
              </button>
            ) : (
              <NavLink
                to={nav.path || "#"}
                className={`menu-item group ${
                  isActive(nav.path || "")
                    ? "menu-item-active"
                    : "menu-item-inactive"
                } ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path || "")
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </NavLink>
            )}

            {nav.subItems && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`${menuType}-${index}`] = el;
                  
                  // If this submenu is open, set its height immediately
                  if (openSubmenu?.type === menuType && openSubmenu?.index === index && el) {
                    const height = el.scrollHeight || 0;
                    if (subMenuHeight[`${menuType}-${index}`] !== height) {
                      setSubMenuHeight(prev => ({...prev, [`${menuType}-${index}`]: height}));
                    }
                  }
                }}
                className={`mt-3 overflow-hidden ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "transition-all duration-300 ease-in-out"
                    : "h-0 transition-all duration-200 ease-in-out"
                }`}
                style={{
                  height:
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? subMenuHeight[`${menuType}-${index}`] || "auto"
                      : 0,
                }}
              >
                <ul className="flex flex-col gap-y-2 pl-8">
                  {nav.subItems.map((subItem, subIndex) => (
                    <li key={subIndex}>
                      <SubmenuNavLink
                        to={subItem.path}
                        className={`menu-item-child group ${
                          isActive(subItem.path) ? "menu-item-child-active" : ""
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-700"></span>
                        <span className="menu-item-child-text">
                          {subItem.name}
                        </span>
                        {subItem.new && (
                          <span className="menu-item-new">New</span>
                        )}
                      </SubmenuNavLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  // Helper function to set open submenu based on path
  const updateSubmenuBasedOnPath = useCallback(() => {
    let submenuMatched = false;
    let newSubmenu: SubmenuState = null;
    
    // Use memoized nav items to avoid dependency on navItems
    const currentNavItems = memoizedNavItems();
    
    // Debug current path
    console.log(`Current path: ${location.pathname}`);
    
    currentNavItems.forEach((nav, index) => {
      // Direct path match
      if (nav.path && isActive(nav.path)) {
        console.log(`Active direct match: ${nav.name} - ${nav.path}`);
        submenuMatched = true;
      }
      
      // Match submenu parent if we're in a child path
      // Product paths need special handling
      const isProductPath = location.pathname === '/admin/products' || 
                          location.pathname.includes('/admin/products/new') ||
                          location.pathname.includes('/admin/products/edit') ||
                          location.pathname.includes('/admin/categories') || 
                          location.pathname.includes('/admin/brands');
                          
      const isEmiPath = location.pathname.includes('/admin/emi-plans') || 
                      location.pathname.includes('/admin/emi-applications');
      
      // Debug paths                  
      if (nav.name === "Products") {
        console.log(`Products check: path=${location.pathname}, isProductPath=${isProductPath}`);
      }
      
      // Set submenu state for Products if we're in a product-related page
      if (nav.name === "Products" && isProductPath) {
        console.log(`Should open Products submenu at index ${index}`);
        newSubmenu = { type: "main", index };
        submenuMatched = true;
      }
      
      // Set submenu state for EMI if we're in an EMI-related page
      if (nav.name === "EMI Management" && isEmiPath) {
        console.log(`Should open EMI submenu at index ${index}`);
        newSubmenu = { type: "main", index };
        submenuMatched = true;
      }
      
      // Check direct submenu matches
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            console.log(`Active submenu item: ${subItem.name} - ${subItem.path}`);
            newSubmenu = { type: "main", index };
            submenuMatched = true;
          }
        });
      }
    });

    // Only update state once after all checks
    if (!submenuMatched) {
      console.log("No active submenu found, closing all");
      // Only update if state is different
      if (openSubmenu !== null) {
        setOpenSubmenu(null);
      }
    } else if (newSubmenu) {
      // Compare with current state to avoid unnecessary updates
      const isSameSubmenu = 
        openSubmenu !== null && 
        newSubmenu !== null &&
        (openSubmenu as any).type === (newSubmenu as any).type && 
        (openSubmenu as any).index === (newSubmenu as any).index;
      
      // Only update if different
      if (!isSameSubmenu) {
        console.log(`Setting new submenu:`, newSubmenu);
        setOpenSubmenu(newSubmenu);
      }
    }
  }, [location.pathname, isActive, memoizedNavItems, openSubmenu]);

  // Call the function on path changes
  useEffect(() => {
    updateSubmenuBasedOnPath();
  }, [updateSubmenuBasedOnPath]);

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed top-0 left-0 z-50 h-full transition-all duration-300 ease-in-out lg:translate-x-0 ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      } ${isExpanded || isHovered ? "w-[290px]" : "w-[90px]"}`}
    >
      <div className="flex flex-col justify-between h-full py-5 overflow-y-auto bg-white-100 border-r border-gray-200 lg:py-6 dark:bg-gray-900 dark:border-gray-800">
        <div>
          <div
            className={`flex items-center px-4 mb-10 lg:mb-12 ${
              !isExpanded && !isHovered
                ? "lg:justify-center"
                : "justify-between"
            }`}
          >
            <NavLink to="/" className="flex">
              {isExpanded || isHovered || isMobileOpen ? (
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Phone Bay {user?.role === 'admin' ? 'Admin' : 'Vendor'}
                </h1>
              ) : (
                <img src="/logo-icon.svg" alt="Logo" className="w-8 h-8" />
              )}
            </NavLink>
          </div>

          <div className="pb-2">
            <div className="px-4 mb-6">
              <p className="mb-3 text-xs font-medium tracking-widest text-gray-400 uppercase">
                {(isExpanded || isHovered || isMobileOpen) && "Main Menu"}
              </p>
              {renderMenuItems(navItems, "main")}
            </div>

            <div className="px-4 mt-auto">
              <p className="mb-3 text-xs font-medium tracking-widest text-gray-400 uppercase">
                {(isExpanded || isHovered || isMobileOpen) && "Actions"}
              </p>
              {renderMenuItems(actionItems, "others")}
            </div>
          </div>
        </div>

        {/* User profile section at the bottom */}
        <div className="px-4 mt-auto">
          {(isExpanded || isHovered || isMobileOpen) ? (
            <div className="flex items-center p-3 mt-2 rounded-xl bg-gray-50 dark:bg-gray-800">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-200">
                  <div className="flex items-center justify-center w-full h-full text-lg font-medium text-gray-700">
                    {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                  </div>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-200">
                <div className="flex items-center justify-center w-full h-full text-lg font-medium text-gray-700">
                  {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
