
import React, { useEffect, useRef } from 'react';
import { Fish, User, Settings, LogOut, Briefcase, Home, MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProfileMenu from './ProfileMenu';
import { getDashboardPath } from '../../utils/roleUtils';

function Navbar({
  dashboardName,
  showProfileMenu,
  setShowProfileMenu,
}) {
  const navigate = useNavigate();
  const { user, logout, setActiveRole } = useAuth();
  const profileMenuRef = useRef(null);

  // Note: outside-click and escape handling for the profile menu is handled
  // inside the portal-based <ProfileMenu /> component so we don't add
  // a conflicting listener here (clicks inside the portal would be seen
  // as outside otherwise).

  // Handle dashboard selection with navigation
  const handleDashboardSelect = (role) => {
    // Set the active role in AuthContext (persists to localStorage)
    setActiveRole(role);
    
    // Navigate to dashboard (DashboardRouter will use activeRole)
    navigate(getDashboardPath());
    
    // Close the profile menu
    setShowProfileMenu(false);
  };

  // Handle user profile navigation
  const handleUserProfileSelect = () => {
    navigate('/user-profile');
    setShowProfileMenu(false);
  };

  return (
    <nav className="bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-700 text-white shadow-2xl sticky top-0 z-50 backdrop-blur-sm">
      <div className="mx-14">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/"> 
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 mt-2 rounded-full">
                <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-full"/>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-blue-200 bg-clip-text text-transparent">
                AquaLink
              </h1>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="flex items-center space-x-6">
            {!dashboardName && (
              <>
                <Link to="/cart" className="text-white font-medium hover:underline">
                  Shopping Cart
                </Link>
                <Link to="/blog" className="text-white font-medium hover:underline">
                  Blog
                </Link>
                <Link to="/about" className="text-white font-medium hover:underline">
                  About
                </Link>
                <Link to="/contact" className="text-white font-medium hover:underline">
                  Contact Us
                </Link>
              </>
            )}

            
            

            {/* Auth Buttons */}
            {!user && (
              <>
                <button 
                  onClick={() => window.dispatchEvent(new Event('show-login'))}
                  className="text-white font-medium hover:underline"
                >
                  Login
                </button>
                <button 
                  onClick={() => navigate("/register")}
                  className="ml-2 bg-cyan-400 hover:bg-cyan-500 text-white px-4 py-1 rounded-full font-bold transition"
                >
                  Register
                </button>
              </>
            )}

            {/* Chat Button - Show for all logged-in users */}
            {user && (
              <Link 
                to="/chats" 
                className="flex items-center space-x-2 text-white font-medium hover:bg-white hover:bg-opacity-10 px-3 py-2 rounded-lg transition-all duration-200"
                title="My Chats"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Chats</span>
              </Link>
            )}

            {/* Home Button - Only show on dashboard pages */}
            {dashboardName && (
              <Link 
                to="/" 
                className="flex items-center space-x-2 text-white font-medium hover:bg-white hover:bg-opacity-10 px-3 py-2 rounded-lg transition-all duration-200"
                title="Go to Home"
              >
                <Home className="w-5 h-5" />
                <span>Home</span>
              </Link>
            )}

            {/* Profile Button */}
            {user && (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu((prev) => !prev)}
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-cyan-300 border-2 border-white flex items-center justify-center text-xl text-white focus:outline-none overflow-hidden"
                  title="Profile"
                >
                  {user.logoUrl ? (
                    <img 
                      src={user.logoUrl} 
                      alt="Profile Logo" 
                      className="w-full h-full rounded-full object-cover" 
                    />
                  ) : (
                    // Default profile icon when no logo is uploaded
                    <svg 
                      className="w-6 h-6 text-white" 
                      fill="currentColor" 
                      viewBox="0 0 20 20" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  )}
                </button>

                {/* Portal-based Profile Menu to avoid clipping when long */}
                <ProfileMenu
                  open={showProfileMenu}
                  anchorRef={profileMenuRef}
                  user={user}
                  onClose={() => setShowProfileMenu(false)}
                  onProfileClick={handleUserProfileSelect}
                  onDashboardSelect={handleDashboardSelect}
                  onLogout={logout}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
