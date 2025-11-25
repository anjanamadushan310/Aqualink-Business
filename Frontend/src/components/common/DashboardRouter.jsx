import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPrimaryRole, ROLES } from '../../utils/roleUtils';

// Lazy load dashboard components for better performance
const AdminDashboard = lazy(() => import('../../pages/dashboards/AdminDashboard'));
const ShopOwnerDashboard = lazy(() => import('../../pages/dashboards/ShopOwnerDashboard'));
const FarmOwnerDashboard = lazy(() => import('../../pages/dashboards/FarmOwnerDashboard'));
const ExporterDashboard = lazy(() => import('../../pages/dashboards/ExporterDashboard'));
const ServiceProviderDashboard = lazy(() => import('../../pages/dashboards/ServiceProviderDashboard'));
const IndustrialStuffSellerDashboard = lazy(() => import('../../pages/dashboards/IndustrialStuffSellerDashboard'));
const DeliveryPersonDashboard = lazy(() => import('../../pages/dashboards/DeliveryPersonDashboard'));

/**
 * Dashboard router component that renders the appropriate dashboard
 * based on the user's active role
 */
const DashboardRouter = () => {
  const { user, activeRole } = useAuth();

  // Use activeRole if available, otherwise fall back to primary role
  const currentRole = activeRole || getPrimaryRole(user?.roles);

  // Loading component
  const DashboardLoading = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Loading dashboard...</p>
      </div>
    </div>
  );

  // No role found - should not happen if ProtectedRoute is used correctly
  if (!currentRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Role Assigned</h2>
          <p className="text-gray-600 mb-4">
            Your account doesn't have any roles assigned. Please contact support for assistance.
          </p>
          <a 
            href="/" 
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  // Map roles to dashboard components
  const getDashboardComponent = () => {
    switch (currentRole) {
      case ROLES.ADMIN:
        return <AdminDashboard />;
      case ROLES.SHOP_OWNER:
        return <ShopOwnerDashboard />;
      case ROLES.FARM_OWNER:
        return <FarmOwnerDashboard />;
      case ROLES.EXPORTER:
        return <ExporterDashboard />;
      case ROLES.SERVICE_PROVIDER:
        return <ServiceProviderDashboard />;
      case ROLES.INDUSTRIAL_STUFF_SELLER:
        return <IndustrialStuffSellerDashboard />;
      case ROLES.DELIVERY_PERSON:
        return <DeliveryPersonDashboard />;
      default:
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50">
            <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
              <div className="text-yellow-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Unknown Role</h2>
              <p className="text-gray-600 mb-4">
                Your role ({currentRole}) is not recognized. Please contact support.
              </p>
              <a 
                href="/" 
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Go to Home
              </a>
            </div>
          </div>
        );
    }
  };

  return (
    <Suspense fallback={<DashboardLoading />}>
      {getDashboardComponent()}
    </Suspense>
  );
};

export default DashboardRouter;
