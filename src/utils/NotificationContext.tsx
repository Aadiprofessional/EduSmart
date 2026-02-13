import React, { createContext, useContext, useState, ReactNode } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import ConfirmationModal from '../components/ui/ConfirmationModal';

interface NotificationState {
  isOpen: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

interface ConfirmationState {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
}

interface NotificationContextType {
  showNotification: (notification: Omit<NotificationState, 'isOpen'>) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showConfirmation: (confirmation: Omit<ConfirmationState, 'isOpen'>) => void;
  closeNotification: () => void;
  closeConfirmation: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    isOpen: false,
    message: '',
    onConfirm: () => {}
  });

  const showNotification = (newNotification: Omit<NotificationState, 'isOpen'>) => {
    const { type, message } = newNotification;
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'warning':
        toast(message, {
          icon: '⚠️',
        });
        break;
      case 'info':
        toast(message, {
          icon: 'ℹ️',
        });
        break;
      default:
        toast(message);
    }
  };

  const showSuccess = (message: string, title?: string) => {
    toast.success(message);
  };

  const showError = (message: string, title?: string) => {
    toast.error(message);
  };

  const showWarning = (message: string, title?: string) => {
    toast(message, {
      icon: '⚠️',
    });
  };

  const showInfo = (message: string, title?: string) => {
    toast(message, {
      icon: 'ℹ️',
    });
  };

  const showConfirmation = (newConfirmation: Omit<ConfirmationState, 'isOpen'>) => {
    setConfirmation({
      ...newConfirmation,
      isOpen: true
    });
  };

  const closeNotification = () => {
    toast.dismiss();
  };

  const closeConfirmation = () => {
    setConfirmation(prev => ({ ...prev, isOpen: false }));
  };

  const contextValue: NotificationContextType = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirmation,
    closeNotification,
    closeConfirmation
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <Toaster 
        position="top-center"
        toastOptions={{
          className: 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-lg rounded-lg border border-gray-100 dark:border-white/10',
          duration: 3000,
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={closeConfirmation}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        type={confirmation.type}
      />
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}; 