import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';

const OnlineStatusIndicator = ({ userId, userName, size = 'md', showLabel = false }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const { on, off, emit } = useSocket();

  useEffect(() => {
    if (!userId) return;

    // Request status when component mounts
    emit('user:getStatus', { userId });

    // Listen for status updates
    const handleUserOnline = (data) => {
      if (data.userId === userId) {
        setIsOnline(true);
        setLastSeen(null);
      }
    };

    const handleUserOffline = (data) => {
      if (data.userId === userId) {
        setIsOnline(false);
        setLastSeen(data.lastSeen || new Date().toISOString());
      }
    };

    const handleUserStatus = (data) => {
      if (data.userId === userId) {
        setIsOnline(data.status === 'online');
        setLastSeen(data.lastSeen);
      }
    };

    on('user:online', handleUserOnline);
    on('user:offline', handleUserOffline);
    on('user:statusResponse', handleUserStatus);

    // Cleanup
    return () => {
      off('user:online', handleUserOnline);
      off('user:offline', handleUserOffline);
      off('user:statusResponse', handleUserStatus);
    };
  }, [userId, on, off, emit]);

  const formatLastSeen = (lastSeenDate) => {
    if (!lastSeenDate) return 'Offline';
    
    const date = new Date(lastSeenDate);
    const now = new Date();
    const diff = now - date;

    // Less than 1 minute
    if (diff < 60000) return 'Just left';
    
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} min ago`;
    }
    
    // Less than 1 day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }
    
    // Otherwise show date
    return date.toLocaleDateString();
  };

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative inline-flex">
        <span
          className={`${sizeClasses[size]} rounded-full ${
            isOnline
              ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse'
              : 'bg-gray-400'
          }`}
          title={isOnline ? 'Online' : formatLastSeen(lastSeen)}
        />
        {isOnline && (
          <span
            className={`absolute ${sizeClasses[size]} rounded-full bg-green-400 animate-ping`}
          />
        )}
      </div>
      {showLabel && (
        <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
          {isOnline ? 'Online' : formatLastSeen(lastSeen)}
        </span>
      )}
    </div>
  );
};

export default OnlineStatusIndicator;
