import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaQuestion, FaTimes, FaCheck } from 'react-icons/fa';
import IconWrapper from '../IconWrapper';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning'
}) => {
  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          bgColor: 'from-red-500 to-pink-500',
          borderColor: 'border-red-500/30',
          confirmButtonColor: 'from-red-500 to-pink-500',
          cancelButtonColor: 'from-gray-600 to-gray-700'
        };
      case 'warning':
        return {
          bgColor: 'from-yellow-500 to-orange-500',
          borderColor: 'border-yellow-500/30',
          confirmButtonColor: 'from-yellow-500 to-orange-500',
          cancelButtonColor: 'from-gray-600 to-gray-700'
        };
      case 'info':
        return {
          bgColor: 'from-blue-500 to-purple-500',
          borderColor: 'border-blue-500/30',
          confirmButtonColor: 'from-blue-500 to-purple-500',
          cancelButtonColor: 'from-gray-600 to-gray-700'
        };
      default:
        return {
          bgColor: 'from-yellow-500 to-orange-500',
          borderColor: 'border-yellow-500/30',
          confirmButtonColor: 'from-yellow-500 to-orange-500',
          cancelButtonColor: 'from-gray-600 to-gray-700'
        };
    }
  };

  const config = getTypeConfig();

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

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
                  <IconWrapper icon={FaQuestion} className="text-white" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">
                    {title}
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
              <p className="text-gray-200 leading-relaxed mb-6">
                {message}
              </p>
              
              {/* Action buttons */}
              <div className="flex gap-3 justify-end">
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-2 bg-gradient-to-r ${config.cancelButtonColor} text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300`}
                >
                  {cancelText}
                </motion.button>
                <motion.button
                  onClick={handleConfirm}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-2 bg-gradient-to-r ${config.confirmButtonColor} text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2`}
                >
                  <IconWrapper icon={FaCheck} size={14} />
                  {confirmText}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal; 