import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

export const useNotifications = (user) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { on, off } = useSocket(user);

  useEffect(() => {
    if (!user) return;

    // Load notifications from localStorage
    const savedNotifications = localStorage.getItem(`notifications_${user.id}`);
    if (savedNotifications) {
      const parsed = JSON.parse(savedNotifications);
      setNotifications(parsed);
      setUnreadCount(parsed.filter(n => !n.read).length);
    }

    // Appointment notifications
    const handleAppointmentCreated = (data) => {
      addNotification({
        id: Date.now(),
        type: 'appointment',
        subType: 'created',
        title: 'New Appointment',
        message: `New appointment scheduled with ${data.appointment.doctorName || 'Doctor'}`,
        data: data.appointment,
        timestamp: new Date().toISOString(),
        read: false
      });
    };

    const handleAppointmentUpdated = (data) => {
      addNotification({
        id: Date.now(),
        type: 'appointment',
        subType: 'updated',
        title: 'Appointment Updated',
        message: `Appointment with ${data.appointment.doctorName || data.appointment.patientName} has been updated`,
        data: data.appointment,
        timestamp: new Date().toISOString(),
        read: false
      });
    };

    const handleAppointmentCancelled = (data) => {
      addNotification({
        id: Date.now(),
        type: 'appointment',
        subType: 'cancelled',
        title: 'Appointment Cancelled',
        message: `Appointment cancelled. Reason: ${data.reason || 'Not specified'}`,
        data: data,
        timestamp: new Date().toISOString(),
        read: false
      });
    };

    const handleAppointmentAccepted = (data) => {
      addNotification({
        id: Date.now(),
        type: 'appointment',
        subType: 'accepted',
        title: 'Appointment Accepted',
        message: `Dr. ${data.appointment.doctorName} has accepted your appointment`,
        data: data.appointment,
        timestamp: new Date().toISOString(),
        read: false
      });
    };

    const handleAppointmentCompleted = (data) => {
      addNotification({
        id: Date.now(),
        type: 'appointment',
        subType: 'completed',
        title: 'Appointment Completed',
        message: `Appointment with ${data.appointment.doctorName || data.appointment.patientName} has been completed`,
        data: data.appointment,
        timestamp: new Date().toISOString(),
        read: false
      });
    };

    // Chat notifications
    const handleChatMessage = (data) => {
      // Only show notification if message is not from current user
      if (data.senderId !== user.id) {
        addNotification({
          id: Date.now(),
          type: 'chat',
          subType: 'message',
          title: 'New Message',
          message: `${data.senderName}: ${data.message.substring(0, 50)}${data.message.length > 50 ? '...' : ''}`,
          data: data,
          timestamp: new Date().toISOString(),
          read: false
        });
      }
    };

    // Payment notifications
    const handlePaymentCreated = (data) => {
      addNotification({
        id: Date.now(),
        type: 'payment',
        subType: 'created',
        title: 'New Payment',
        message: `New payment of $${data.payment.amount} initiated`,
        data: data.payment,
        timestamp: new Date().toISOString(),
        read: false
      });
    };

    const handlePaymentCompleted = (data) => {
      addNotification({
        id: Date.now(),
        type: 'payment',
        subType: 'completed',
        title: 'Payment Completed',
        message: `Payment of $${data.amount} has been completed successfully`,
        data: data,
        timestamp: new Date().toISOString(),
        read: false
      });
    };

    // User status notifications
    const handleUserOnline = (data) => {
      if (user.role === 'patient' && data.role === 'doctor') {
        addNotification({
          id: Date.now(),
          type: 'user',
          subType: 'online',
          title: 'Doctor Online',
          message: `Dr. ${data.name} is now online`,
          data: data,
          timestamp: new Date().toISOString(),
          read: false,
          autoHide: true // This will be removed after 5 seconds
        });
      }
    };

    // System notifications
    const handleSystemNotification = (data) => {
      addNotification({
        id: Date.now(),
        type: 'system',
        subType: 'info',
        title: data.title || 'System Notification',
        message: data.message,
        data: data,
        timestamp: new Date().toISOString(),
        read: false
      });
    };

    // Subscribe to events
    on('appointment:created', handleAppointmentCreated);
    on('appointment:updated', handleAppointmentUpdated);
    on('appointment:cancelled', handleAppointmentCancelled);
    on('appointment:accepted', handleAppointmentAccepted);
    on('appointment:completed', handleAppointmentCompleted);
    on('chat:message', handleChatMessage);
    on('payment:created', handlePaymentCreated);
    on('payment:completed', handlePaymentCompleted);
    on('user:online', handleUserOnline);
    on('system:notification', handleSystemNotification);

    // Cleanup
    return () => {
      off('appointment:created', handleAppointmentCreated);
      off('appointment:updated', handleAppointmentUpdated);
      off('appointment:cancelled', handleAppointmentCancelled);
      off('appointment:accepted', handleAppointmentAccepted);
      off('appointment:completed', handleAppointmentCompleted);
      off('chat:message', handleChatMessage);
      off('payment:created', handlePaymentCreated);
      off('payment:completed', handlePaymentCompleted);
      off('user:online', handleUserOnline);
      off('system:notification', handleSystemNotification);
    };
  }, [user, on, off]);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (user && notifications.length > 0) {
      // Only keep last 50 notifications
      const recentNotifications = notifications.slice(-50);
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(recentNotifications));
    }
  }, [notifications, user]);

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [...prev, notification]);
    setUnreadCount(prev => prev + 1);

    // Auto-hide certain notifications after 5 seconds
    if (notification.autoHide) {
      setTimeout(() => {
        removeNotification(notification.id);
      }, 5000);
    }

    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }
  }, []);

  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    if (user) {
      localStorage.removeItem(`notifications_${user.id}`);
    }
  }, [user]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    requestNotificationPermission
  };
};

export default useNotifications;
