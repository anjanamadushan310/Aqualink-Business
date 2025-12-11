import { createContext, useContext, useMemo } from 'react';
import { ToastContainer, toast } from 'react-toastify';

const NotificationContext = createContext(null);
const defaultToastOptions = {
  position: 'top-right',
  autoClose: 3500,
  hideProgressBar: false,
  pauseOnHover: true,
  closeOnClick: true,
  draggable: true,
};

export const NotificationProvider = ({ children }) => {
  const notifier = useMemo(() => ({
    notifySuccess: (message, options = {}) => toast.success(message, options),
    notifyError: (message, options = {}) => toast.error(message, options),
    notifyInfo: (message, options = {}) => toast.info(message, options),
    notifyWarning: (message, options = {}) => toast.warn(message, options),
    notify: (message, options = {}) => toast(message, options),
  }), []);

  return (
    <NotificationContext.Provider value={notifier}>
      {children}
      <ToastContainer {...defaultToastOptions} newestOnTop closeButton theme="light" />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
