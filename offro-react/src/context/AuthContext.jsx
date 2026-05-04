import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [customerToken, setCustomerToken] = useState(localStorage.getItem('customer_token'));
  
  const [owner, setOwner] = useState(null);
  const [ownerToken, setOwnerToken] = useState(localStorage.getItem('owner_token'));
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedCustomer = localStorage.getItem('customer_user');
    const savedOwner = localStorage.getItem('owner_user');
    
    if (savedCustomer && customerToken) {
      setCustomer(JSON.parse(savedCustomer));
    }
    if (savedOwner && ownerToken) {
      setOwner(JSON.parse(savedOwner));
    }
    setLoading(false);
  }, [customerToken, ownerToken]);

  const login = (userData, userToken, userRole) => {
    if (userRole === 'customer') {
      setCustomer(userData);
      setCustomerToken(userToken);
      localStorage.setItem('customer_token', userToken);
      localStorage.setItem('customer_user', JSON.stringify(userData));
    } else if (userRole === 'owner') {
      setOwner(userData);
      setOwnerToken(userToken);
      localStorage.setItem('owner_token', userToken);
      localStorage.setItem('owner_user', JSON.stringify(userData));
    }
  };

  const logout = (userRole) => {
    if (userRole === 'customer' || !userRole) {
      setCustomer(null);
      setCustomerToken(null);
      localStorage.removeItem('customer_token');
      localStorage.removeItem('customer_user');
    }
    if (userRole === 'owner' || !userRole) {
      setOwner(null);
      setOwnerToken(null);
      localStorage.removeItem('owner_token');
      localStorage.removeItem('owner_user');
    }
    
    // Clean up legacy keys if they exist
    if (!userRole) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      localStorage.removeItem('shop');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      customer, 
      customerToken, 
      owner, 
      ownerToken, 
      login, 
      logout, 
      loading,
      // Helper for legacy components - prioritize owner if both exist? 
      // Actually, better to just provide them and let components choose.
      // We'll keep these for minimal breakage but they are deprecated.
      user: owner || customer,
      token: ownerToken || customerToken,
      role: owner ? 'owner' : (customer ? 'customer' : null)
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
