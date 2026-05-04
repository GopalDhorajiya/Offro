import { useMemo, useState, useEffect } from 'react';
import { getServerTime } from '../../services/apiClient';

export const OfferStatusBadge = ({ offer }) => {
  const [trigger, setTrigger] = useState(0);

  const { status, nextTransition } = useMemo(() => {
    const now = getServerTime();
    if (!offer.isActive) return { status: "disabled", nextTransition: null };

    const startTime = offer.startTime ? new Date(offer.startTime) : null;
    const endTime = offer.endTime ? new Date(offer.endTime) : null;

    if (startTime && now < startTime) return { status: "upcoming", nextTransition: startTime };

    if (offer.constraintType === "time_limit" && endTime) {
      if (now > endTime) return { status: "expired", nextTransition: null };
      return { status: "active", nextTransition: endTime };
    }

    if (offer.constraintType === "slot_limit") {
      if (offer.filledSlots >= offer.totalSlots) return { status: "expired", nextTransition: null };
    }

    if (offer.constraintType === "group_goal") {
      if ((offer.participants?.length || 0) >= offer.totalSlots) return { status: "completed", nextTransition: null };
    }

    return { status: "active", nextTransition: null };
  }, [offer, trigger]);

  useEffect(() => {
    const handleFocus = () => setTrigger(prev => prev + 1);
    window.addEventListener('focus', handleFocus);

    let timer;
    if (nextTransition) {
      const delay = nextTransition.getTime() - getServerTime().getTime();
      if (delay > 0) {
        timer = setTimeout(() => setTrigger(prev => prev + 1), delay + 100);
      } else {
        setTrigger(prev => prev + 1);
      }
    }

    return () => {
      window.removeEventListener('focus', handleFocus);
      if (timer) clearTimeout(timer);
    };
  }, [nextTransition, offer.id]);

  const colors = {
    active: 'bg-green-100 text-green-800',
    upcoming: 'bg-blue-100 text-blue-800',
    completed: 'bg-purple-100 text-purple-800',
    expired: 'bg-gray-100 text-gray-800',
    disabled: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${colors[status] || colors.expired}`}>
      {status}
    </span>
  );
};

export const OfferCard = ({ offer, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500 cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg text-gray-900 capitalize">
            {offer.benefitType.replace(/_/g, ' ')} ({offer.constraintType.replace(/_/g, ' ')})
          </h3>
          {offer.constraintType === 'time_limit' && (
            <p className="text-sm text-gray-500">
              {new Date(offer.startTime).toLocaleDateString()} - {new Date(offer.endTime).toLocaleDateString()}
            </p>
          )}
        </div>
        <OfferStatusBadge offer={offer} />
      </div>
      
      <div className="mb-4">
        {offer.applicableProducts && offer.applicableProducts.length > 0 && (
          <p className="text-gray-700 font-medium">
            Product: {offer.applicableProducts[0].name}
          </p>
        )}
        {offer.benefitType === 'discount' && (
          <p className="text-orange-600 font-bold text-xl">
            {offer.discount}% OFF
          </p>
        )}
        {offer.benefitType === 'buy_x_get_y' && (
          <p className="text-orange-600 font-bold text-xl">
            Buy {offer.buyQty} Get {offer.getQty}
          </p>
        )}
        {(offer.constraintType === 'slot_limit' || offer.constraintType === 'group_goal') && (
          <p className="text-gray-700">
            {offer.constraintType === 'group_goal' ? 'Participants' : 'Slots'}: {offer.constraintType === 'group_goal' ? (offer.participants?.length || 0) : offer.filledSlots} / {offer.totalSlots}
          </p>
        )}
      </div>

      <div className="text-xs text-gray-400">
        Created: {new Date(offer.createdAt).toLocaleString()}
      </div>
    </div>
  );
};
