import React from 'react';
import { useAuth } from '../../context/AuthContext';
import PageMeta from '../../components/common/PageMeta';
import EcommerceMetrics from '../../components/ecommerce/EcommerceMetrics';
import MonthlySalesChart from '../../components/ecommerce/MonthlySalesChart';
import StatisticsChart from '../../components/ecommerce/StatisticsChart';
import MonthlyTarget from '../../components/ecommerce/MonthlyTarget';
import RecentOrders from '../../components/ecommerce/RecentOrders';
import DemographicCard from '../../components/ecommerce/DemographicCard';
import { Navigate } from 'react-router';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // If the user is a vendor, redirect to vendor dashboard
  if (user?.role === 'vendor') {
    return <Navigate to="/vendor/dashboard" replace />;
  }

  return (
    <>
      <PageMeta
        title="Phone Bay Admin Dashboard"
        description="Admin dashboard for Phone Bay e-commerce platform"
      />
      
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Admin Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Welcome back, {user?.first_name || 'Admin'}! Here's what's happening with your store today.
        </p>
      </div>
      
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics />
          <MonthlySalesChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget />
        </div>

        <div className="col-span-12">
          <StatisticsChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <DemographicCard />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentOrders />
        </div>
      </div>
    </>
  );
};

export default Dashboard; 