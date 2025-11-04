import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const FloatingChatButton = () => {
  const location = useLocation();
  
  // Don't show the button if we're already on the chatbot page
  if (location.pathname === '/chatbot') {
    return null;
  }

  return (
    <Link
      to="/chatbot"
      className="fixed bottom-6 right-6 z-50 group"
      aria-label="Open Chatbot"
    >
      <div className="relative">
        {/* Main Button */}
        <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-2xl transform hover:scale-110 transition-all duration-300 cursor-pointer">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </div>

        {/* Pulse Animation */}
        <div className="absolute inset-0 w-16 h-16 bg-teal-400 rounded-full animate-ping opacity-20"></div>

        {/* Notification Badge (Optional - can be made dynamic) */}
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-bold">!</span>
        </div>

        {/* Tooltip */}
        <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg whitespace-nowrap text-sm font-medium">
            Chat with AI Assistant
            <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default FloatingChatButton;
