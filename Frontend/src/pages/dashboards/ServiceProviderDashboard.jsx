import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../../components/serviceprovider/Sidebar';
import ServiceOverview from '../../components/serviceprovider/ServiceOverview';
import ServiceHistory from '../../components/serviceprovider/ServiceHistory';
import ServiceRequests from './../../components/serviceprovider/ServiceRequests';
import ServiceAdsForm from '../../components/serviceprovider/ServiceAdsForm';
import SellerChatPanel from '../../components/chat/SellerChatPanel';
import DashboardFooter from '../../components/common/DashboardFooter';
import RoleBasedRoute from '../../components/common/RoleBasedRoute';
import { ROLES } from '../../utils/roleUtils';



const ServiceProviderDashboard= () => {
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
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={
              <RoleBasedRoute allowedRoles={[ROLES.SERVICE_PROVIDER]}>
                <ServiceOverview />
              </RoleBasedRoute>
            } />
            <Route path="service-requests" element={
              <RoleBasedRoute allowedRoles={[ROLES.SERVICE_PROVIDER]}>
                <ServiceRequests />
              </RoleBasedRoute>
            } />
            <Route path="my-services" element={
              <RoleBasedRoute allowedRoles={[ROLES.SERVICE_PROVIDER]}>
                <ServiceAdsForm />
              </RoleBasedRoute>
            } />
            <Route path="service-history" element={
              <RoleBasedRoute allowedRoles={[ROLES.SERVICE_PROVIDER]}>
                <ServiceHistory />
              </RoleBasedRoute>
            } />
            <Route path="messages" element={
              <RoleBasedRoute allowedRoles={[ROLES.SERVICE_PROVIDER]}>
                <SellerChatPanel />
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

export default ServiceProviderDashboard;

