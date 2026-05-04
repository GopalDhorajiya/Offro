import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Input from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { setupRecaptcha, sendOTP, verifyOTP, loginWithFirebase } from '../../services/authService';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const redirectPath = location.state?.from || '/my-claims';

  useEffect(() => {
    setupRecaptcha("recaptcha-container");
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Basic validation for phone number (should start with + and country code)
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+91' + formattedPhone; // Default to India if no country code
      }
      
      await sendOTP(formattedPhone);
      setShowOtp(true);
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const idToken = await verifyOTP(otp);
      const data = await loginWithFirebase(idToken, 'customer');
      
      login(data.user, data.token, 'customer');
      navigate(redirectPath);
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-orange-600 mb-2">offro</h1>
          <p className="text-gray-500">Get the best deals near you</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <div id="recaptcha-container"></div>

        {!showOtp ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <Input
              label="Phone Number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91 00000 00000"
              required
            />
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 disabled:bg-gray-400"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <Input
              label="Enter OTP"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              required
            />
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 disabled:bg-gray-400"
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            
            <button
              type="button"
              onClick={() => setShowOtp(false)}
              className="w-full text-gray-500 text-sm font-medium hover:underline"
            >
              Change Phone Number
            </button>
          </form>
        )}

        <div className="text-center">
          <p className="text-gray-500">
            Don't have an account?{' '}
            <Link to="/customer/signup" state={{ from: redirectPath }} className="text-orange-600 font-bold">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
