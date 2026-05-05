import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Input from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { setupRecaptcha, sendOTP, verifyOTP, registerUser } from '../../services/authService';

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: location.state?.phoneNumber || '',
  });
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectPath = location.state?.from || '/my-claims';

  useEffect(() => {
    setupRecaptcha("recaptcha-container");
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let formattedPhone = formData.phoneNumber.trim();
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
      const data = await registerUser(idToken, formData.name);
      
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
          <p className="text-gray-500">Create your account to claim offers</p>
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
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />

            <Input
              label="Phone Number"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+91 00000 00000"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 disabled:bg-gray-400"
            >
              {loading ? 'Sending OTP...' : 'Sign Up'}
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
              {loading ? 'Verifying...' : 'Verify & Create Account'}
            </button>
            
            <button
              type="button"
              onClick={() => setShowOtp(false)}
              className="w-full text-gray-500 text-sm font-medium hover:underline"
            >
              Back to Details
            </button>
          </form>
        )}

        <div className="text-center">
          <p className="text-gray-500">
            Already have an account?{' '}
            <Link to="/login" state={{ from: redirectPath }} className="text-orange-600 font-bold">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
