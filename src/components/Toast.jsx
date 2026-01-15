import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const Toast = ({
  message,
  type = 'success',
  onClose,
  action = null,
  duration = 5000
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle size={18} className="text-green-600" />,
    error: <AlertCircle size={18} className="text-red-600" />,
    warning: <AlertCircle size={18} className="text-amber-600" />,
    info: <Info size={18} className="text-blue-600" />
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-blue-50 border-blue-200'
  };

  return (
    <div
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${bgColors[type]} max-w-md animate-slide-up`}
      role="alert"
    >
      {icons[type]}
      <span className="text-sm text-gray-800 flex-1">{message}</span>
      {action && (
        <button
          onClick={action.onClick}
          className="text-sm font-medium text-harvard-crimson hover:text-harvard-crimson-dark underline"
        >
          {action.label}
        </button>
      )}
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};

// Toast container to manage multiple toasts
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ bottom: `${1 + index * 4}rem` }}
          className="fixed left-1/2 transform -translate-x-1/2 z-50"
        >
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
            action={toast.action}
            duration={toast.duration}
          />
        </div>
      ))}
    </>
  );
};

// Custom hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = React.useState([]);

  const addToast = React.useCallback((message, options = {}) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, ...options }]);
    return id;
  }, []);

  const removeToast = React.useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
};

export default Toast;
