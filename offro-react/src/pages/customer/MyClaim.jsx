import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import socket from '../../services/socketService';
import { getClaimById } from '../../services/claimService';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/common/Header';

const MyClaim = () => {
  const { claimCode: urlCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { customerToken } = useAuth();
  const [claim, setClaim] = useState(location.state?.claim || null);
  const [offer, setOffer] = useState(location.state?.offer || null);
  const message = location.state?.message;

  const isPending = !claim?.claimCode || claim?.claimCode === 'PENDING';

  useEffect(() => {
    const refetchData = async () => {
      if (!claim && urlCode !== 'PENDING') {
        // We have a code but no claim object, could be from a direct link or refresh
        // This is a bit tricky since we don't have the ID, only the claimCode in URL
        // For now, if we have state we are good. If not, we might need a getClaimByCode API.
      }
      
      // If we are missing offer but have claim, fetch offer
      if (!offer && claim?.offerId) {
        try {
          const offerId = typeof claim.offerId === 'string' ? claim.offerId : claim.offerId._id;
          const { getOfferById } = await import('../../services/offerService');
          const data = await getOfferById(offerId);
          setOffer(data);
        } catch (err) {
          console.error("Failed to fetch offer:", err);
        }
      }
    };

    refetchData();
  }, [claim, offer]);

  useEffect(() => {
    if (offer?.id || offer?._id) {
      const offerId = offer.id || offer._id;
      socket.on('offerUpdated', async (updatedOffer) => {
        if (updatedOffer.id === offerId) {
          setOffer(updatedOffer);
          
          // If we are pending and the goal is now reached, refetch our claim to get the code
          if (isPending && updatedOffer.participants?.length === updatedOffer.totalSlots) {
             try {
               const updatedClaim = await getClaimById(claim._id || claim.id, customerToken);
               setClaim(updatedClaim);
               // Update URL without reloading to reflect the new code
               navigate(`/my-claim/${updatedClaim.claimCode}`, { replace: true, state: { claim: updatedClaim, offer: updatedOffer } });
             } catch (err) {
               console.error("Failed to refetch claim:", err);
             }
          }
        }
      });
    }

    return () => {
      socket.off('offerUpdated');
    };
  }, [offer, isPending, claim, customerToken, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className={`flex-1 ${isPending ? 'bg-blue-600' : 'bg-orange-600'} flex items-center justify-center p-6 transition-colors duration-500`}>
        <div className="w-full max-w-sm bg-white rounded-[3rem] p-8 shadow-2xl text-center space-y-8">
          <div>
            <h1 className="text-xl font-bold text-gray-400 uppercase tracking-widest mb-2">
              {isPending ? 'Joining Group' : 'Claim Success'}
            </h1>
            <div className={`text-5xl font-black tracking-tighter ${isPending ? 'text-blue-600 animate-pulse' : 'text-gray-900'}`}>
              {isPending ? 'WAITING...' : claim?.claimCode || urlCode}
            </div>
          </div>

          <div className="aspect-square bg-gray-50 rounded-3xl flex items-center justify-center border-4 border-dashed border-gray-200">
            <div className="text-center space-y-4 px-6">
              {isPending ? (
                <>
                  <div className="flex justify-center gap-2">
                    {[...Array(offer?.totalSlots || 3)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-4 h-4 rounded-full ${i < (offer?.participants?.length || 0) ? 'bg-blue-600' : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm font-black text-blue-900">
                    {offer?.participants?.length || 0} / {offer?.totalSlots} Joined
                  </p>
                  <p className="text-xs font-bold text-gray-400">
                    Your code will be generated once the group is full.
                  </p>
                </>
              ) : (
                <>
                  <span className="text-4xl">📱</span>
                  <p className="text-xs font-bold text-gray-400">Show this code at the counter to redeem</p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {message && <p className="text-sm font-bold text-gray-800">{message}</p>}
            <p className="text-sm text-gray-500 italic">
              {isPending ? 'Tell your friends to join!' : 'Valid for 24 hours only.'}
            </p>
            <Link 
              to="/home" 
              className={`block w-full py-4 font-bold border-2 rounded-2xl transition-colors
                ${isPending ? 'text-blue-600 border-blue-600 hover:bg-blue-50' : 'text-orange-600 border-orange-600 hover:bg-orange-50'}`}
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyClaim;
