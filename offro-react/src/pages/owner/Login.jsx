import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const { login } = useAuth();

  useEffect(() => {
    setupRecaptcha("recaptcha-container");
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+91' + formattedPhone;
      }
      
      await sendOTP(formattedPhone);
      setShowOtp(true);
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
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
      const data = await loginWithFirebase(idToken, 'owner');
      
      login(data.shop, data.token, 'owner');
      navigate('/owner/dashboard');
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">offro</h1>
          <p className="text-gray-500 font-medium text-lg">Shop Owner Login</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <div id="recaptcha-container"></div>

        {!showOtp ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <Input
              label="Phone Number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91 00000 00000"
              required
            />
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-md disabled:bg-gray-400"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <Input
              label="Enter OTP"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              required
            />
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-md disabled:bg-gray-400"
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
            </div>
            
            <button
              type="button"
              onClick={() => setShowOtp(false)}
              className="w-full text-gray-500 text-sm font-medium hover:underline"
            >
              Change Phone Number
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/owner/signup" className="text-orange-600 font-bold hover:underline">
              Register Shop
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
