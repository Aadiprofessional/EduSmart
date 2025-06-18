import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck, FaExclamationTriangle, FaInfo, FaTimes, FaCheckCircle } from 'react-icons/fa';
import IconWrapper from '../IconWrapper';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  autoClose = true,
  autoCloseDelay = 3000
}) => {
  React.useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: FaCheckCircle,
          bgColor: 'from-green-500 to-emerald-500',
          borderColor: 'border-green-500/30',
          iconColor: 'text-green-400',
          titleColor: 'text-green-400'
        };
      case 'error':
        return {
          icon: FaExclamationTriangle,
          bgColor: 'from-red-500 to-pink-500',
          borderColor: 'border-red-500/30',
          iconColor: 'text-red-400',
          titleColor: 'text-red-400'
        };
      case 'warning':
        return {
          icon: FaExclamationTriangle,
          bgColor: 'from-yellow-500 to-orange-500',
          borderColor: 'border-yellow-500/30',
          iconColor: 'text-yellow-400',
          titleColor: 'text-yellow-400'
        };
      case 'info':
        return {
          icon: FaInfo,
          bgColor: 'from-blue-500 to-purple-500',
          borderColor: 'border-blue-500/30',
          iconColor: 'text-blue-400',
          titleColor: 'text-blue-400'
        };
      default:
        return {
          icon: FaInfo,
          bgColor: 'from-blue-500 to-purple-500',
          borderColor: 'border-blue-500/30',
          iconColor: 'text-blue-400',
          titleColor: 'text-blue-400'
        };
    }
  };

  const config = getTypeConfig();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className={`bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-md w-full border ${config.borderColor} overflow-hidden`}
          >
            {/* Header with icon */}
            <div className={`bg-gradient-to-r ${config.bgColor} p-4`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <IconWrapper icon={config.icon} className="text-white" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">
                    {title || type.charAt(0).toUpperCase() + type.slice(1)}
                  </h3>
                </div>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-300"
                >
                  <IconWrapper icon={FaTimes} size={16} />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-200 leading-relaxed">
                {message}
              </p>
              
              {/* Action button */}
              <div className="mt-6 flex justify-end">
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-2 bg-gradient-to-r ${config.bgColor} text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300`}
                >
                  OK
                </motion.button>
              </div>
            </div>

            {/* Auto-close progress bar */}
            {autoClose && (
              <div className="h-1 bg-gray-700 overflow-hidden">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: autoCloseDelay / 1000, ease: 'linear' }}
                  className={`h-full bg-gradient-to-r ${config.bgColor}`}
                />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationModal; 