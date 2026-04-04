import React, { createContext, useContext, useState } from 'react';
import AuthModal from '../components/AuthModal';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  const triggerSessionExpired = () => {
    setIsSessionExpired(true);
  };

  return (
    <AuthContext.Provider value={{ triggerSessionExpired }}>
      {children}
      <AuthModal isOpen={isSessionExpired} onClose={() => setIsSessionExpired(false)} />
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
