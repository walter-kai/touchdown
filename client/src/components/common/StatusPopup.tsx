import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaTimes, FaSpinner } from 'react-icons/fa';

interface StatusFooterProps {
  type: 'loading' | 'success' | 'error';
  message: string;
  onClose: () => void;
}

const StatusPopup: React.FC<StatusFooterProps> = ({ type, message, onClose }) => {
  useEffect(() => {
    // Only set timeout for non-loading types
    if (type !== 'loading') {
      const timer = setTimeout(() => {
        onClose();
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [type, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'loading':
        return <FaSpinner className="animate-spin text-blue-400" />;
      case 'success':
        return <FaCheckCircle className="text-green-400" />;
      case 'error':
        return <FaExclamationTriangle className="text-red-400" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'loading':
        return 'bg-blue-900/90 border-blue-400/50';
      case 'success':
        return 'bg-green-900/90 border-green-400/50';
      case 'error':
        return 'bg-red-900/90 border-red-400/50';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-in-right">
      <div className={`${getBgColor()} border rounded-lg p-4 backdrop-blur-sm shadow-lg max-w-sm`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          
          <div className="flex-1">
            <p className="text-white text-sm">{message}</p>
          </div>
          
          {type !== 'loading' && (
            <button
              onClick={onClose}
              className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
            >
              <FaTimes className="text-sm" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusPopup;
