
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Navbar from "./components/home/Navbar";
import LoginForm from "./pages/Login"
import RegistrationForm from "./components/RegistrationForm";
import HomePage from "./pages/HomePage";
import OrderUI from "./pages/OrderUI";
import ProtectedRoute from "./components/common/ProtectedRoute";
import DashboardRouter from "./components/common/DashboardRouter";
import UserVerificationDashboard from "./components/admin/AdminDashboard";
import ProductApprove from "./components/admin/ProductApprove";
import FishAdsForm from "./components/farmowner/FishAdsForm";
import UserProfile from "./pages/UserProfile";
import AboutPage from './pages/AboutPage';
import Contact from './pages/Contact';
import QuoteAcceptance from "./components/shopowner/QuoteAcceptance";
import DeliveryQuoteRequest from "./components/shopowner/DeliveryQuoteRequest";
import OrderConfirmation from "./components/shopowner/OrderConfirmation";
import Cart from "./components/shopowner/Cart";
import OrdersManagement from "./components/shopowner/OrdersManagement";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import ChatPage from "./pages/ChatPage";
import ChatTestPage from "./pages/ChatTestPage";
import ServiceDetailsPage from "./pages/ServiceDetailsPage";
import FishDetailsPage from "./pages/FishDetailsPage";
import IndustrialDetailsPage from "./pages/IndustrialDetailsPage";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { useCart } from "./context/CartContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { NotificationProvider } from "./context/NotificationContext";

// Main App Content Component (to use auth hooks inside provider)
const AppContent = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // "Open login" global event for nav"
  useEffect(() => {
    const f = () => setShowLogin(true);
    window.addEventListener("show-login", f);
    return () => window.removeEventListener("show-login", f);
  }, []);

  return (
    <Router>
      <AppRouter 
        showLogin={showLogin}
        setShowLogin={setShowLogin}
        showProfileMenu={showProfileMenu}
        setShowProfileMenu={setShowProfileMenu}
      />
    </Router>
  );
};

// Router component that uses navigation hooks
const AppRouter = ({ showLogin, setShowLogin, showProfileMenu, setShowProfileMenu }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Safely get cart context
  let clearCart;
  try {
    const cart = useCart();
    clearCart = cart.clearCart;
  } catch (error) {
    console.warn('Cart context not available:', error);
    clearCart = null;
  }

  // Function to determine if current route is a dashboard
  const getDashboardName = () => {
    const pathname = location.pathname;
    if (pathname.startsWith('/dashboard')) {
      return 'Dashboard';
    }
    return null;
  };

  const dashboardName = getDashboardName();

  // Handle logout navigation and cart clearing
  useEffect(() => {
    const handleLogout = async () => {
      setShowProfileMenu(false); // Close profile menu
      
      // Clear cart on logout (if available)
      if (clearCart) {
        try {
          await clearCart();
        } catch (error) {
          console.error('Failed to clear cart on logout:', error);
        }
      }
      
      navigate('/'); // Navigate to home page
    };
    
    window.addEventListener("user-logout", handleLogout);
    return () => window.removeEventListener("user-logout", handleLogout);
  }, [navigate, clearCart, setShowProfileMenu]);

  return (
    <div>
      {/* Navbar */}
      <Navbar
        dashboardName={dashboardName}
        showProfileMenu={showProfileMenu}
        setShowProfileMenu={setShowProfileMenu}
      />

      {/* Login Modal */}
      {showLogin && (
      <LoginForm
     onClose={() => setShowLogin(false)}
      />
      )}

      {/* Main Content */}
      <main className="w-full mt-10">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegistrationForm setShowLogin={setShowLogin} />} />
          
          <Route path="/cart" element={<Cart />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<Contact/>} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:postId" element={<BlogPostPage />} />
          
          {/* Product Details Routes */}
          <Route path="/service/:id" element={<ServiceDetailsPage />} />
          <Route path="/fish/:id" element={<FishDetailsPage />} />
          <Route path="/industrial/:id" element={<IndustrialDetailsPage />} />

          {/* Protected Chat Route - Only for logged-in users */}
          <Route 
            path="/chats" 
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Chat Testing Page - For development/debugging */}
          <Route 
            path="/chat-test" 
            element={
              <ProtectedRoute>
                <ChatTestPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected Dashboard Route - Single route for all roles */}
          <Route 
            path="/dashboard/*" 
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            } 
          />
          <Route path="/admin/verification" element={<UserVerificationDashboard />} />

          <Route path="/productaprove" element={<ProductApprove />} />

          {/* Not completed */}
          <Route path="/user-profile" element={<UserProfile />} />
          <Route path="/fish-ads-form" element={<FishAdsForm />} />
          <Route path="/orderUI" element={<OrderUI />} />
         
          <Route path="/delivery-request" element={<DeliveryQuoteRequest />} />
          <Route path="/quote-acceptance" element={<QuoteAcceptance />} />
          <Route path="/shop-owner/quote-acceptance" element={<QuoteAcceptance />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
          <Route path="/orders" element={<OrdersManagement />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
};

export default App;
