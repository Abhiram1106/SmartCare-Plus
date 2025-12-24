import React from 'react';
import Toast from './Toast';

const ToastContainer = ({ toasts = [], removeToast = () => {} }) => {
  // Return null if no toasts to display
  if (!toasts || toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
