import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../../components/deliveryperson/Sidebar';
import DeliveryHistory from '../../components/deliveryperson/DeliveryHistory';
import DeliveryRequests from '../../components/deliveryperson/DeliveryRequests';
import QuoteManagement from '../../components/deliveryperson/QuoteManagement';
import ApprovedQuotes from '../../components/deliveryperson/ApprovedQuotes';
import CoverageAreaManagement from '../../components/deliveryperson/CoverageAreaManagement';
import EarningsTracker from '../../components/deliveryperson/EarningsTracker';
import CurrentDeliveries from '../../components/deliveryperson/CurrentDeliveries';
import DashboardFooter from '../../components/common/DashboardFooter';
import RoleBasedRoute from '../../components/common/RoleBasedRoute';
import { ROLES } from '../../utils/roleUtils';



const DeliveryPersonDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      
      {/* Main Content */}
      <div className="lg:ml-64 flex flex-col flex-1">
        <main className="p-4 lg:p-8 flex-1">
          <Routes>
            <Route index element={<Navigate to="delivery-requests" replace />} />
            <Route path="delivery-requests" element={
              <RoleBasedRoute allowedRoles={[ROLES.DELIVERY_PERSON]}>
                <DeliveryRequests />
              </RoleBasedRoute>
            } />
            <Route path="delivery-history" element={
              <RoleBasedRoute allowedRoles={[ROLES.DELIVERY_PERSON]}>
                <DeliveryHistory />
              </RoleBasedRoute>
            } />
            <Route path="quote-management" element={
              <RoleBasedRoute allowedRoles={[ROLES.DELIVERY_PERSON]}>
                <QuoteManagement />
              </RoleBasedRoute>
            } />
            <Route path="approved-quotes" element={
              <RoleBasedRoute allowedRoles={[ROLES.DELIVERY_PERSON]}>
                <ApprovedQuotes />
              </RoleBasedRoute>
            } />
            <Route path="coverage-area" element={
              <RoleBasedRoute allowedRoles={[ROLES.DELIVERY_PERSON]}>
                <CoverageAreaManagement />
              </RoleBasedRoute>
            } />
            <Route path="earnings" element={
              <RoleBasedRoute allowedRoles={[ROLES.DELIVERY_PERSON]}>
                <EarningsTracker />
              </RoleBasedRoute>
            } />
            <Route path="current-deliveries" element={
              <RoleBasedRoute allowedRoles={[ROLES.DELIVERY_PERSON]}>
                <CurrentDeliveries />
              </RoleBasedRoute>
            } />
          </Routes>
        </main>
        
        {/* Footer */}
        <DashboardFooter />
      </div>
    </div>
  );
};

export default DeliveryPersonDashboard;

