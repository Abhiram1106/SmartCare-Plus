import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    if (!isAuthenticated) {
      return [
        { to: '/', label: 'Home' },
        { to: '/chatbot', label: 'Chatbot' },
        { to: '/login', label: 'Login' },
        { to: '/register', label: 'Register' }
      ];
    }

    switch (user?.role) {
      case 'patient':
        return [
          { to: '/patient/dashboard', label: 'Dashboard' },
          { to: '/patient/doctors', label: 'Find Doctors' },
          { to: '/patient/appointments', label: 'My Appointments' },
          { to: '/patient/prescriptions', label: 'My Prescriptions' },
          { to: '/patient/payments', label: 'Payments' },
          { to: '/patient/profile', label: 'Profile' }
        ];
      case 'doctor':
        return [
          { to: '/doctor/dashboard', label: 'Dashboard' },
          { to: '/doctor/appointments', label: 'Appointments' },
          { to: '/doctor/prescriptions', label: 'Prescriptions' },
          { to: '/doctor/profile', label: 'Profile' }
        ];
      case 'admin':
        return [
          { to: '/admin/dashboard', label: 'Dashboard' },
          { to: '/admin/users', label: 'Manage Users' },
          { to: '/admin/appointments', label: 'Appointments' },
          { to: '/admin/intents', label: 'Chatbot Intents' },
          { to: '/admin/chatlogs', label: 'Chat Logs' },
          { to: '/admin/profile', label: 'Profile' }
        ];
      default:
        return [{ to: '/', label: 'Home' }];
    }
  };

  const navLinks = getNavLinks();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-gradient-to-r from-white via-teal-50 to-white shadow-lg fixed top-0 left-0 right-0 z-50 border-b-2 border-teal-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo Section - Left */}
          <div className="flex items-center flex-shrink-0 w-48">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-sm"></div>
              </div>
              <div className="hidden md:flex md:items-center md:h-10">
                <h1 className="text-xl font-extrabold bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent whitespace-nowrap tracking-tight">
                  SmartCare+
                </h1>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Center */}
          <div className="hidden lg:flex lg:items-center lg:space-x-1 flex-1 justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  isActive(link.to)
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg scale-105'
                    : 'text-gray-800 hover:bg-teal-100 hover:text-teal-700 hover:scale-105'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Section - Fixed Width */}
          <div className="hidden lg:flex lg:items-center lg:space-x-3 flex-shrink-0 w-48 justify-end">
            {isAuthenticated ? (
              <>
                <NotificationCenter user={user} />
                <Link
                  to={`/${user?.role}/profile`}
                  className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border-2 border-teal-200 hover:shadow-lg hover:border-teal-400 transition-all duration-200 cursor-pointer hover:scale-105"
                >
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{user?.name}</span>
                    <span className="text-xs text-teal-700 capitalize font-semibold">{user?.role}</span>
                  </div>
                  <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 whitespace-nowrap"
                >
                  Logout
                </button>
              </>
            ) : null}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-teal-600 hover:bg-gray-100 focus:outline-none transition-colors duration-200"
            >
              <svg
                className="h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 pt-2 pb-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`block px-4 py-3 rounded-lg text-base font-medium transition-all ${
                  isActive(link.to)
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Logged in as</p>
                  <p className="font-semibold text-gray-800">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg font-medium shadow-md"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
