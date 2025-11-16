import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning' }) => {
  if (!isOpen) return null;

  const colors = {
    warning: 'from-yellow-500 to-amber-500',
    danger: 'from-red-500 to-rose-500',
    info: 'from-blue-500 to-cyan-500'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
        {/* Header */}
        <div className={`bg-gradient-to-r ${colors[type]} text-white p-6 rounded-t-2xl`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-xl font-bold">{title}</h3>
            </div>
            <button
              onClick={onCancel}
              className="hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-6 py-3 bg-gradient-to-r ${colors[type]} text-white rounded-xl hover:shadow-lg transition-all font-semibold`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
