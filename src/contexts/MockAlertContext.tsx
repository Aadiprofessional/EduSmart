
import React, { createContext, useContext } from 'react';
const AlertContext = createContext<any>(null);
export const useAlert = () => ({
  showSuccess: (msg: string) => console.log('Success:', msg),
  showError: (msg: string) => console.error('Error:', msg),
  showWarning: (msg: string) => console.warn('Warning:', msg),
  showConfirmation: (msg: string, cb: () => void) => { if(window.confirm(msg)) cb(); }
});
export const AlertProvider: React.FC<any> = ({ children }) => <AlertContext.Provider value={{}}>{children}</AlertContext.Provider>;
