import React from 'react';
import { useError } from '../contexts/ErrorContext';
import './ErrorNotification.css';

const ErrorNotification: React.FC = () => {
  const { errorState, clearError } = useError();

  if (!errorState.isOffline && !errorState.hasApiErrors) {
    return null;
  }

  return (
    <div className="error-notification-container">
      {errorState.isOffline && (
        <div className="error-notification offline">
          <div className="error-icon">📡</div>
          <div className="error-content">
            <div className="error-title">You're offline</div>
            <div className="error-message">
              Some features may not work properly. Please check your internet connection.
            </div>
          </div>
        </div>
      )}
      
      {errorState.hasApiErrors && (
        <div className="error-notification api-error">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <div className="error-title">Service temporarily unavailable</div>
            <div className="error-message">
              {errorState.errorMessage || 'We\'re experiencing some technical difficulties. Please try again in a moment.'}
            </div>
          </div>
          <button className="error-close" onClick={clearError}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default ErrorNotification;