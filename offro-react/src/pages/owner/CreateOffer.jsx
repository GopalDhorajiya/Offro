import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import { createOffer } from '../../services/offerService';
import { useAuth } from '../../context/AuthContext';

const formatToLocalDatetime = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getNextHourStart = () => {
  const now = new Date();
  if (now.getMinutes() > 0) {
    now.setHours(now.getHours() + 1);
  }
  now.setMinutes(0, 0, 0);
  return formatToLocalDatetime(now);
};

const CreateOffer = () => {
  const navigate = useNavigate();
  const { ownerToken } = useAuth();
  const [formData, setFormData] = useState({
    benefitType: 'discount',
    constraintType: 'time_limit',
    productName: '',
    productPrice: '',
    productDescription: '',
    productWeight: '',
    productUnit: 'kg',
    discount: '',
    discountedPrice: '',
    buyQty: '',
    getQty: '',
    discountAmount: '',
    minPurchase: '',
    totalSlots: '',
    startTime: getNextHourStart(),
    endTime: '',
    duration: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    // Reciprocal calculations for Time
    if (name === 'duration' && value !== '') {
      const dur = parseFloat(value);
      if (!isNaN(dur) && formData.startTime) {
        const start = new Date(formData.startTime);
        const end = new Date(start.getTime() + dur * 60 * 60 * 1000);
        newFormData.endTime = formatToLocalDatetime(end);
      }
    } else if (name === 'endTime' && value !== '') {
      if (formData.startTime) {
        const start = new Date(formData.startTime);
        const end = new Date(value);
        const diffHours = (end - start) / (1000 * 60 * 60);
        newFormData.duration = diffHours > 0 ? diffHours.toFixed(2) : '';
      }
    } else if (name === 'startTime' && value !== '') {
      if (formData.duration !== '') {
        const dur = parseFloat(formData.duration);
        const start = new Date(value);
        const end = new Date(start.getTime() + dur * 60 * 60 * 1000);
        newFormData.endTime = formatToLocalDatetime(end);
      } else if (formData.endTime) {
        const start = new Date(value);
        const end = new Date(formData.endTime);
        const diffHours = (end - start) / (1000 * 60 * 60);
        newFormData.duration = diffHours > 0 ? diffHours.toFixed(2) : '';
      }
    }

    // Reciprocal calculations for Discount
    if (formData.benefitType === 'discount' && formData.productPrice > 0) {
      if (name === 'discount' && value !== '') {
        const disc = parseFloat(value);
        if (!isNaN(disc)) {
          const price = parseFloat(formData.productPrice);
          newFormData.discountedPrice = (price - (price * disc / 100)).toFixed(2);
        }
      } else if (name === 'discountedPrice' && value !== '') {
        const dPrice = parseFloat(value);
        if (!isNaN(dPrice)) {
          const price = parseFloat(formData.productPrice);
          newFormData.discount = (((price - dPrice) / price) * 100).toFixed(2);
        }
      } else if (name === 'productPrice' && value !== '') {
        const price = parseFloat(value);
        if (!isNaN(price) && formData.discount !== '') {
          const disc = parseFloat(formData.discount);
          newFormData.discountedPrice = (price - (price * disc / 100)).toFixed(2);
        }
      }
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      let payload = { ...formData };

      if (formData.constraintType === 'time_limit') {
        const start = new Date(formData.startTime);
        const end = new Date(formData.endTime);
        if (end <= start) throw new Error('End time must be after start time');
        payload.startTime = start;
        payload.endTime = end;
      } else {
        delete payload.startTime;
        delete payload.endTime;
        delete payload.duration;
      }

      await createOffer(payload, ownerToken);
      setMessage({ type: 'success', text: 'Offer created successfully!' });
      
      setTimeout(() => {
        navigate('/owner/dashboard');
      }, 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const minDateTime = new Date().toISOString().slice(0, 16);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto py-10 px-4">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Create New Offer
          </h1>

          {message.text && (
            <div className={`mb-6 p-4 rounded-lg font-medium text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.type === 'success' ? '✅ ' : '❌ '}{message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Offer Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-gray-700 text-sm font-bold">Benefit Type</label>
                <select
                  name="benefitType"
                  value={formData.benefitType}
                  onChange={handleChange}
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                >
                  <option value="discount">Discount</option>
                  <option value="buy_x_get_y">Buy X Get Y</option>
                  <option value="instant_off">Instant Off</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-gray-700 text-sm font-bold">Constraint Type</label>
                <select
                  name="constraintType"
                  value={formData.constraintType}
                  onChange={handleChange}
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                >
                  <option value="time_limit">Time Limit</option>
                  <option value="slot_limit">Slot Limit</option>
                  <option value="group_goal">Group Goal</option>
                </select>
              </div>
            </div>

            {/* Product Details Section */}
            <div className="pt-6 border-t border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                📦 Product Details
              </h2>
              <div className="space-y-4">
                <Input
                  label="Product Name"
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  placeholder="e.g. Fresh Mangoes"
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Original Price (₹)"
                    name="productPrice"
                    type="number"
                    value={formData.productPrice}
                    onChange={handleChange}
                    placeholder="0"
                    required
                    min="0"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Weight/Qty"
                      name="productWeight"
                      type="number"
                      value={formData.productWeight}
                      onChange={handleChange}
                      placeholder="e.g. 1"
                      min="0"
                    />
                    <div className="space-y-2">
                      <label className="block text-gray-700 text-sm font-bold">Unit</label>
                      <select
                        name="productUnit"
                        value={formData.productUnit}
                        onChange={handleChange}
                        className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                      >
                        <option value="kg">kg</option>
                        <option value="L">L</option>
                        <option value="pcs">pcs</option>
                        <option value="ml">ml</option>
                        <option value="g">g</option>
                      </select>
                    </div>
                  </div>
                </div>
                <Input
                  label="Description (Optional)"
                  name="productDescription"
                  value={formData.productDescription}
                  onChange={handleChange}
                  placeholder="Brief details about the product..."
                />
              </div>
            </div>

            {/* Offer Specifics Section */}
            <div className="pt-6 border-t border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                ✨ Offer Configuration
              </h2>
              
              <div className="space-y-4">
                {formData.benefitType === 'discount' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                    <Input
                      label="Discount (%)"
                      name="discount"
                      type="number"
                      value={formData.discount}
                      onChange={handleChange}
                      placeholder="20"
                      required
                      min="1"
                      max="100"
                    />
                    <Input
                      label="Offer Price (₹)"
                      name="discountedPrice"
                      type="number"
                      value={formData.discountedPrice}
                      onChange={handleChange}
                      placeholder="80"
                      required
                    />
                  </div>
                )}

                {formData.benefitType === 'buy_x_get_y' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                    <Input
                      label="Buy Quantity"
                      name="buyQty"
                      type="number"
                      value={formData.buyQty}
                      onChange={handleChange}
                      placeholder="2"
                      required
                      min="1"
                    />
                    <Input
                      label="Get Free"
                      name="getQty"
                      type="number"
                      value={formData.getQty}
                      onChange={handleChange}
                      placeholder="1"
                      required
                      min="1"
                    />
                  </div>
                )}

                {formData.benefitType === 'instant_off' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                    <Input
                      label="Discount Amount (₹)"
                      name="discountAmount"
                      type="number"
                      value={formData.discountAmount}
                      onChange={handleChange}
                      placeholder="50"
                      required
                      min="1"
                    />
                    <Input
                      label="Min Purchase (₹)"
                      name="minPurchase"
                      type="number"
                      value={formData.minPurchase}
                      onChange={handleChange}
                      placeholder="500"
                      required
                      min="1"
                    />
                  </div>
                )}

                {(formData.constraintType === 'slot_limit' || formData.constraintType === 'group_goal') && (
                  <div className="animate-fadeIn">
                    <Input
                      label={formData.constraintType === 'group_goal' ? "Participant Goal" : "Total Slots"}
                      name="totalSlots"
                      type="number"
                      value={formData.totalSlots}
                      onChange={handleChange}
                      placeholder="10"
                      required
                      min="1"
                    />
                  </div>
                )}

                {formData.constraintType === 'time_limit' && (
                  <div className="space-y-4 animate-fadeIn">
                    <Input
                      label="Duration (Hours)"
                      name="duration"
                      type="number"
                      value={formData.duration}
                      onChange={handleChange}
                      placeholder="2.5"
                      min="0.01"
                      step="0.01"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Starts At"
                        name="startTime"
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={handleChange}
                        required
                        min={minDateTime}
                      />
                      <Input
                        label="Ends At"
                        name="endTime"
                        type="datetime-local"
                        value={formData.endTime}
                        onChange={handleChange}
                        required
                        min={formData.startTime || minDateTime}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-4 rounded-xl shadow-lg transition-all duration-200 ${loading ? 'opacity-50 cursor-not-allowed scale-95' : 'hover:scale-[1.02]'}`}
            >
              {loading ? 'Processing...' : '🚀 Launch Offer'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateOffer;
