import React from 'react';

const TypingIndicator = ({ userName = 'Someone', show = false }) => {
  if (!show) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg animate-fade-in">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="font-medium">{userName} is typing...</span>
    </div>
  );
};

export default TypingIndicator;
