import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../../components/industrialstuffseller/Sidebar';
import IndustrialStuffOrder from '../../components/industrialstuffseller/IndustrialStuffOrders';
import IndustrialStuffFishStockManagement from '../../components/industrialstuffseller/IndustrialStuffStockManagement';
import IndustrialStuffForm from '../../components/industrialstuffseller/IndustrialStuffForm';
// Reuse farm owner order components for industrial seller
import FarmOwnerOrderManagement from '../../components/farmowner/FarmOwnerOrderManagement';
import OrderHistory from '../../components/farmowner/OrderHistory';
import CanceledOrders from '../../components/farmowner/CanceledOrders';
import DashboardFooter from '../../components/common/DashboardFooter';
import RoleBasedRoute from '../../components/common/RoleBasedRoute';
import SellerChatPanel from '../../components/chat/SellerChatPanel';
import { ROLES } from '../../utils/roleUtils';


const IndustrialStuffSellerDashboard = () => {
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
            <Route index element={<Navigate to="sales-orders" replace />} />
            <Route path="sales-orders" element={
              <RoleBasedRoute allowedRoles={[ROLES.INDUSTRIAL_STUFF_SELLER]}>
                <FarmOwnerOrderManagement />
              </RoleBasedRoute>
            } />
            <Route path="order-history" element={
              <RoleBasedRoute allowedRoles={[ROLES.INDUSTRIAL_STUFF_SELLER]}>
                <OrderHistory />
              </RoleBasedRoute>
            } />
            <Route path="canceled-orders" element={
              <RoleBasedRoute allowedRoles={[ROLES.INDUSTRIAL_STUFF_SELLER]}>
                <CanceledOrders />
              </RoleBasedRoute>
            } />
            <Route path="stock-management" element={
              <RoleBasedRoute allowedRoles={[ROLES.INDUSTRIAL_STUFF_SELLER]}>
                <IndustrialStuffFishStockManagement />
              </RoleBasedRoute>
            } />
            <Route path="create-ads" element={
              <RoleBasedRoute allowedRoles={[ROLES.INDUSTRIAL_STUFF_SELLER]}>
                <IndustrialStuffForm />
              </RoleBasedRoute>
            } />
            <Route path="messages" element={
              <RoleBasedRoute allowedRoles={[ROLES.INDUSTRIAL_STUFF_SELLER]}>
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

export default IndustrialStuffSellerDashboard;
