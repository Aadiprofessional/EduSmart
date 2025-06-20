import React, { createContext, useContext, useState, ReactNode } from 'react';
import NotificationModal from '../components/ui/NotificationModal';
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
  const [notification, setNotification] = useState<NotificationState>({
    isOpen: false,
    type: 'info',
    message: '',
    autoClose: true,
    autoCloseDelay: 3000
  });

  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    isOpen: false,
    message: '',
    onConfirm: () => {}
  });

  const showNotification = (newNotification: Omit<NotificationState, 'isOpen'>) => {
    setNotification({
      ...newNotification,
      isOpen: true
    });
  };

  const showSuccess = (message: string, title?: string) => {
    showNotification({
      type: 'success',
      message,
      title: title || 'Success',
      autoClose: true,
      autoCloseDelay: 3000
    });
  };

  const showError = (message: string, title?: string) => {
    showNotification({
      type: 'error',
      message,
      title: title || 'Error',
      autoClose: true,
      autoCloseDelay: 5000
    });
  };

  const showWarning = (message: string, title?: string) => {
    showNotification({
      type: 'warning',
      message,
      title: title || 'Warning',
      autoClose: true,
      autoCloseDelay: 4000
    });
  };

  const showInfo = (message: string, title?: string) => {
    showNotification({
      type: 'info',
      message,
      title: title || 'Information',
      autoClose: true,
      autoCloseDelay: 3000
    });
  };

  const showConfirmation = (newConfirmation: Omit<ConfirmationState, 'isOpen'>) => {
    setConfirmation({
      ...newConfirmation,
      isOpen: true
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
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
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        autoClose={notification.autoClose}
        autoCloseDelay={notification.autoCloseDelay}
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