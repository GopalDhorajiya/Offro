import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Owner Pages
import OwnerLogin from '../pages/owner/Login';
import OwnerSignup from '../pages/owner/Signup';
import OwnerDashboard from '../pages/owner/Dashboard';
import CreateOffer from '../pages/owner/CreateOffer';
import OfferDetails from '../pages/owner/OfferDetails';
import VerifyQR from '../pages/owner/VerifyQR';

// Customer Pages
import CustomerLogin from '../pages/customer/Login';
import CustomerSignup from '../pages/customer/Signup';
import OfferView from '../pages/customer/OfferView';
import ClaimPage from '../pages/customer/ClaimPage';
import MyClaim from '../pages/customer/MyClaim';
import MyClaims from '../pages/customer/MyClaims';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { customerToken, ownerToken, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  const token = requiredRole === 'owner' ? ownerToken : customerToken;

  if (!token) {
    return <Navigate to={requiredRole === 'owner' ? '/owner/login' : '/login'} />;
  }

  return children;
};

const AppRoutes = () => {
  const { customerToken, ownerToken } = useAuth();

  return (
    <Routes>
      {/* Root Redirection */}
      <Route path="/" element={<Navigate to={ownerToken ? "/owner/dashboard" : (customerToken ? "/my-claims" : "/login")} />} />

      {/* Owner Routes */}
      <Route path="/owner/login" element={<OwnerLogin />} />
      <Route path="/owner/signup" element={<OwnerSignup />} />
      <Route 
        path="/owner/dashboard" 
        element={
          <ProtectedRoute requiredRole="owner">
            <OwnerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/owner/offer/:id" 
        element={
          <ProtectedRoute requiredRole="owner">
            <OfferDetails />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/owner/create" 
        element={
          <ProtectedRoute requiredRole="owner">
            <CreateOffer />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/owner/verify" 
        element={
          <ProtectedRoute requiredRole="owner">
            <VerifyQR />
          </ProtectedRoute>
        } 
      />

      {/* Customer Routes */}
      <Route path="/login" element={<CustomerLogin />} />
      <Route path="/customer/signup" element={<CustomerSignup />} />
      <Route path="/home" element={<Navigate to={customerToken ? "/my-claims" : "/login"} />} />
      <Route 
        path="/my-claims" 
        element={
          <ProtectedRoute requiredRole="customer">
            <MyClaims />
          </ProtectedRoute>
        } 
      />
      <Route path="/offer/:id" element={<OfferView />} />
      <Route 
        path="/claim/:id" 
        element={
          <ProtectedRoute requiredRole="customer">
            <ClaimPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/my-claim/:claimCode" 
        element={
          <ProtectedRoute requiredRole="customer">
            <MyClaim />
          </ProtectedRoute>
        } 
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
