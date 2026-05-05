import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import Header from '../../components/common/Header';
import { getOfferById } from '../../services/offerService';
import socket from '../../services/socketService';
import { getServerTime } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';

const OfferStatus = ({ offer }) => {
  const [trigger, setTrigger] = useState(0);

  const { status } = useMemo(() => {
    const now = getServerTime();
    if (!offer.isActive) return { status: "disabled" };

    const startTime = offer.startTime ? new Date(offer.startTime) : null;
    const endTime = offer.endTime ? new Date(offer.endTime) : null;

    if (startTime && now < startTime) return { status: "upcoming" };

    if (offer.constraintType === "time_limit" && endTime) {
      if (now > endTime) return { status: "expired" };
      return { status: "active" };
    }

    if (offer.constraintType === "slot_limit") {
      if (offer.filledSlots >= offer.totalSlots) return { status: "expired" };
    }

    if (offer.constraintType === "group_goal") {
      if ((offer.participants?.length || 0) >= offer.totalSlots) return { status: "completed" };
    }

    return { status: "active" };
  }, [offer, trigger]);

  useEffect(() => {
    const timer = setInterval(() => setTrigger(t => t + 1), 5000); // Check every 5s is enough
    return () => clearInterval(timer);
  }, []);

  const colors = {
    active: 'bg-green-600',
    upcoming: 'bg-blue-500',
    completed: 'bg-purple-600',
    expired: 'bg-gray-500',
    disabled: 'bg-red-500'
  };

  return (
    <div className={`${colors[status]} text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider`}>
      {status}
    </div>
  );
};

const OfferView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { customerToken } = useAuth();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffer = async () => {
      setLoading(true);
      try {
        const data = await getOfferById(id);
        setOffer(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOffer();

    socket.on('offerUpdated', (updated) => {
      if (updated.id === id) setOffer(updated);
    });

    return () => socket.off('offerUpdated');
  }, [id]);

  const handleClaim = () => {
    if (!customerToken) {
      navigate('/login', { state: { from: location.pathname } });
    } else {
      navigate(`/claim/${offer.id}`);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen animate-pulse text-orange-600 font-bold">offro...</div>;
  if (!offer) return <div className="p-10 text-center">Offer not found</div>;

  return (
    <div className="min-h-screen bg-white pb-20">
      <Header />
      <div className="relative h-64 bg-orange-100 flex items-center justify-center">
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white/80 p-2 rounded-full shadow-lg z-10"
        >
          ←
        </button>
        <div className="text-6xl">🛍️</div>
      </div>

      <div className="px-6 -mt-8 relative">
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-black text-gray-900">{offer.applicableProducts?.[0]?.name || 'Special Offer'}</h1>
            <OfferStatus offer={offer} />
          </div>

          <p className="text-gray-500 mb-6 font-medium">{offer.applicableProducts?.[0]?.description || 'No description available.'}</p>

          <div className="flex items-end gap-2 mb-8">
            {offer.benefitType === 'discount' && (
              <>
                <span className="text-4xl font-black text-orange-600">₹{offer.applicableProducts?.[0]?.price * (1 - offer.discount/100)}</span>
                <span className="text-xl text-gray-400 line-through mb-1">₹{offer.applicableProducts?.[0]?.price}</span>
                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold mb-1">{offer.discount}% OFF</span>
              </>
            )}
            {offer.benefitType === 'buy_x_get_y' && (
              <span className="text-3xl font-black text-orange-600">Buy {offer.buyQty} Get {offer.getQty} Free</span>
            )}
            {offer.benefitType === 'instant_off' && (
              <div className="flex flex-col">
                <span className="text-4xl font-black text-orange-600">₹{offer.discountAmount} OFF</span>
                <span className="text-sm text-gray-500 font-bold">On minimum purchase of ₹{offer.minPurchase}</span>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-4 text-gray-700">
              <span className="text-2xl">🏪</span>
              <div>
                <p className="font-bold">{offer.shop?.name || 'Shop Name'}</p>
                <p className="text-sm text-gray-500">Visit store to claim this offer</p>
              </div>
            </div>

            {offer.constraintType === 'slot_limit' && (
              <div className="bg-gray-50 p-4 rounded-2xl flex justify-between items-center">
                <span className="font-bold text-gray-600">Availability</span>
                <span className="text-orange-600 font-black">{offer.totalSlots - offer.filledSlots} Slots Left</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100">
        <button 
          onClick={handleClaim}
          className="block w-full bg-black text-white text-center font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition-transform"
        >
          Verify and Claim Offer
        </button>
      </div>
    </div>
  );
};

export default OfferView;
