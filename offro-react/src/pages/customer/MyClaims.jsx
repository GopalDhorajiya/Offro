import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import { useAuth } from '../../context/AuthContext';
import { getUserClaims } from '../../services/claimService';

const MyClaims = () => {
  const navigate = useNavigate();
  const { customer, customerToken } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customer && customerToken) {
      fetchClaims();
    }
  }, [customer, customerToken]);

  const fetchClaims = async () => {
    try {
      const data = await getUserClaims(customerToken);
      setClaims(data);
    } catch (err) {
      console.error('Failed to fetch claims:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      <div className="bg-white p-6 pb-12 rounded-b-[3rem] shadow-sm">
        <h1 className="text-3xl font-black text-gray-900 mt-8 tracking-tighter italic">MY CLAIMS</h1>
        <p className="text-gray-500 font-medium">Your active and past offer claims</p>
      </div>

      <div className="px-6 -mt-6">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-500 font-bold">Loading your history...</p>
          </div>
        ) : claims.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-xl border border-gray-100">
            <div className="text-5xl mb-4">🎫</div>
            <h2 className="text-xl font-bold text-gray-800">No claims yet</h2>
            <p className="text-gray-500 mb-8">Start exploring offers and claim your first deal!</p>
            <Link 
              to="/home" 
              className="inline-block bg-orange-600 text-white font-bold px-8 py-3 rounded-2xl shadow-lg active:scale-95 transition-transform"
            >
              Explore Offers
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => {
              const isPending = !claim.claimCode;
              const offer = claim.offerId;
              const shop = offer?.shop;
              
              return (
                <div 
                  key={claim._id}
                  onClick={() => navigate(`/my-claim/${claim.claimCode || 'PENDING'}`, { state: { claim, offer } })}
                  className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 flex justify-between items-center cursor-pointer hover:shadow-lg transition-shadow group"
                >
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                      {shop?.name || 'Shop'}
                    </p>
                    <h3 className="text-lg font-black text-gray-900 leading-tight">
                      {offer ? (
                        offer.benefitType === 'discount' 
                          ? `${offer.discount}% OFF` 
                          : `Buy ${offer.buyQty} Get ${offer.getQty}`
                      ) : 'Unknown Offer'}
                    </h3>
                    <p className="text-xs font-bold text-gray-500">
                      {offer?.applicableProducts?.[0]?.name || 'Selected Items'}
                    </p>
                  </div>

                  <div className="text-right">
                    {isPending ? (
                      <div className="space-y-1">
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                          Waiting
                        </span>
                        <p className="text-xs font-bold text-gray-400">
                           {offer?.participants?.length || 0} / {offer?.totalSlots} Joined
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className={`text-[10px] ${claim.status === 'redeemed' ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-600'} px-2 py-0.5 rounded-full font-black uppercase tracking-widest`}>
                          {claim.status}
                        </span>
                        <p className="text-lg font-black text-gray-900 font-mono tracking-tighter">
                          {claim.claimCode}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyClaims;
