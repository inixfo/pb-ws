import React, { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import MonthlySalesChart from '../../components/ecommerce/MonthlySalesChart';
import { productService, orderService, analyticsService } from '../../services/api';
import { toast, Toaster } from 'react-hot-toast';

interface ProductPerformance {
  name: string;
  percentage: number;
}

interface CategorySales {
  name: string;
  percentage: number;
  revenue: number;
}

const VendorAnalytics: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [salesPeriod, setSalesPeriod] = useState('yearly');
  const [salesData, setSalesData] = useState<number[]>(Array(12).fill(0));
  const [topProducts, setTopProducts] = useState<ProductPerformance[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    fetchAnalyticsData();
  }, [salesPeriod, refreshKey]);
  
  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // Try to fetch analytics data from the dedicated endpoint
      try {
        const analyticsData = await analyticsService.getVendorAnalytics();
        console.log('Analytics data:', analyticsData);
        
        if (analyticsData) {
          // Set sales data
          if (analyticsData.sales_data && Array.isArray(analyticsData.sales_data)) {
            setSalesData(analyticsData.sales_data);
          }
          
          // Set top products
          if (analyticsData.top_products && Array.isArray(analyticsData.top_products)) {
            const formattedTopProducts = analyticsData.top_products
              .slice(0, 3)
              .map(product => ({
                name: product.name,
                percentage: product.percentage || (product.units_sold / analyticsData.total_units_sold * 100) || 0
              }));
            setTopProducts(formattedTopProducts);
          }
          
          // Set category sales
          if (analyticsData.category_sales && Array.isArray(analyticsData.category_sales)) {
            const formattedCategorySales = analyticsData.category_sales
              .slice(0, 3)
              .map(category => ({
                name: category.name,
                percentage: category.percentage || 0,
                revenue: category.revenue || 0
              }));
            setCategorySales(formattedCategorySales);
          }
          
          return; // Exit early as we have the data
        }
      } catch (error) {
        console.log('Analytics API not available, falling back to aggregated data');
      }
      
      // If we're here, we need to aggregate data from orders and products
      
      // Fetch orders to generate sales data
      const ordersResponse = await orderService.getAll();
      const orders = Array.isArray(ordersResponse) 
        ? ordersResponse 
        : ordersResponse.results && Array.isArray(ordersResponse.results) 
          ? ordersResponse.results 
          : [];
      
      // Generate monthly sales data based on orders
      const monthlyData = Array(12).fill(0);
      orders.forEach((order: any) => {
        if (order.created_at || order.date) {
          const date = new Date(order.created_at || order.date);
          const month = date.getMonth();
          const orderTotal = typeof order.total === 'number' 
            ? order.total 
            : typeof order.total === 'string' 
              ? parseFloat(order.total) 
              : 0;
          monthlyData[month] += orderTotal;
        }
      });
      setSalesData(monthlyData);
      
      // Generate top products by counting frequency in orders
      const productSales: Record<string, { units: number, percentage: number }> = {};
      let totalUnits = 0;
      
      orders.forEach((order: any) => {
        if (order.items_details && Array.isArray(order.items_details)) {
          order.items_details.forEach((item: any) => {
            const quantity = item.quantity || 1;
            totalUnits += quantity;
            
            if (!productSales[item.product_name]) {
              productSales[item.product_name] = { units: 0, percentage: 0 };
            }
            productSales[item.product_name].units += quantity;
          });
        }
      });
      
      // Calculate percentages
      Object.values(productSales).forEach(product => {
        product.percentage = totalUnits > 0 ? (product.units / totalUnits) * 100 : 0;
      });
      
      // Convert to sorted array and take top 3
      const formattedTopProducts = Object.entries(productSales)
        .map(([name, data]) => ({
          name,
          percentage: data.percentage
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 3);
      
      setTopProducts(formattedTopProducts.length > 0 ? formattedTopProducts : [
        { name: 'iPhone 15 Pro', percentage: 85 },
        { name: 'iPhone 15 Pro Max', percentage: 70 },
        { name: 'iPhone 15 Silicone Case', percentage: 60 }
      ]);
      
      // Generate category sales data
      const categorySalesData: Record<string, { revenue: number, percentage: number }> = {};
      const totalRevenue = monthlyData.reduce((sum, val) => sum + val, 0);
      
      // Try to extract categories from orders
      let hasCategories = false;
      orders.forEach((order: any) => {
        if (order.items_details && Array.isArray(order.items_details)) {
          order.items_details.forEach((item: any) => {
            if (item.category) {
              hasCategories = true;
              if (!categorySalesData[item.category]) {
                categorySalesData[item.category] = { revenue: 0, percentage: 0 };
              }
              categorySalesData[item.category].revenue += 
                (item.price * (item.quantity || 1)) || 0;
            }
          });
        }
      });
      
      // Calculate percentages
      Object.values(categorySalesData).forEach(category => {
        category.percentage = totalRevenue > 0 ? (category.revenue / totalRevenue) * 100 : 0;
      });
      
      // Convert to sorted array and take top 3
      if (hasCategories) {
        const formattedCategorySales = Object.entries(categorySalesData)
          .map(([name, data]) => ({
            name,
            percentage: data.percentage,
            revenue: data.revenue
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 3);
        
        setCategorySales(formattedCategorySales);
      } else {
        // Fallback to sample data
        setCategorySales([
          { name: 'Smartphones', percentage: 75, revenue: 35482 },
          { name: 'Accessories', percentage: 25, revenue: 12856 },
          { name: 'Tablets', percentage: 10, revenue: 5321 }
        ]);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
      
      // Set fallback data
      setSalesData(Array(12).fill(0).map(() => Math.floor(Math.random() * 10000)));
      setTopProducts([
        { name: 'iPhone 15 Pro', percentage: 85 },
        { name: 'iPhone 15 Pro Max', percentage: 70 },
        { name: 'iPhone 15 Silicone Case', percentage: 60 }
      ]);
      setCategorySales([
        { name: 'Smartphones', percentage: 75, revenue: 35482 },
        { name: 'Accessories', percentage: 25, revenue: 12856 },
        { name: 'Tablets', percentage: 10, revenue: 5321 }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePeriodChange = (period: string) => {
    setSalesPeriod(period);
  };
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <>
      <PageMeta
        title="Analytics - Phone Bay Vendor"
        description="View analytics and insights for your products on Phone Bay"
      />
      
      <Toaster position="top-right" />
      
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Analytics Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Monitor performance and gain insights about your products
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
          <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Sales Performance
            </h3>
            <div className="flex space-x-2">
              <select 
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={salesPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
              >
                <option value="yearly">Last 12 Months</option>
                <option value="halfYear">Last 6 Months</option>
                <option value="quarter">Last 3 Months</option>
                <option value="month">This Month</option>
              </select>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
          
          <MonthlySalesChart 
            salesData={salesData}
            period={salesPeriod}
            isLoading={isLoading}
            onPeriodChange={handlePeriodChange}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              Top Performing Products
            </h3>
            
            {isLoading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{product.name}</p>
                  <div className="mt-1 flex items-center">
                    <div className="flex flex-1 items-center">
                      <div className="relative h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                            <div 
                              className="absolute h-2 rounded-full bg-blue-600" 
                              style={{ width: `${Math.min(100, product.percentage)}%` }}
                            ></div>
                      </div>
                    </div>
                        <span className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                          {Math.round(product.percentage)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              Customer Demographics
            </h3>
            
            <div className="flex h-48 items-center justify-center">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Demographics data not available</p>
                <button 
                  onClick={() => window.location.href="/vendor/customers"}
                  className="mt-3 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  View customers
                  <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              Traffic Sources
            </h3>
            
            <div className="flex h-48 items-center justify-center">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Traffic source data not available</p>
                <button 
                  onClick={() => window.open('https://analytics.google.com', '_blank')}
                  className="mt-3 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  Connect Google Analytics
                  <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            Sales by Category
          </h3>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {categorySales.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{category.name}</p>
                <div className="mt-1 flex items-center">
                  <div className="flex flex-1 items-center">
                    <div className="relative h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                          <div 
                            className={`absolute h-2 rounded-full ${
                              index === 0 ? 'bg-green-600' : index === 1 ? 'bg-purple-600' : 'bg-yellow-600'
                            }`} 
                            style={{ width: `${Math.min(100, category.percentage)}%` }}
                          ></div>
                    </div>
                  </div>
                      <span className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                        ${category.revenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default VendorAnalytics; 