import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createClaim } from '../../services/claimService';
import { getOfferById } from '../../services/offerService';
import Header from '../../components/common/Header';

const ClaimPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customer, customerToken } = useAuth();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const data = await getOfferById(id);
        setOffer(data);
      } catch (err) {
        setError("Failed to load offer details");
      }
    };
    fetchOffer();
  }, [id]);

  const handleClaim = async () => {
    if (!customer || !customerToken) {
      navigate('/login', { state: { from: `/claim/${id}` } });
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await createClaim(id, customerToken);
      const claim = data.claim;
      const code = claim.claimCode || 'PENDING';
      
      // Navigate to MyClaim page
      navigate(`/my-claim/${code}`, { 
        state: { 
          claim: claim, 
          offer: offer,
          message: data.message 
        } 
      });
    } catch (err) {
      setError(err.message || "Failed to claim offer");
    } finally {
      setLoading(false);
    }
  };

  if (!offer && !error) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl space-y-6">
          <div className="text-6xl">✨</div>
          <h1 className="text-2xl font-black">Confirm Your Claim</h1>
          
          {offer && (
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
              <p className="text-orange-800 font-bold text-lg">
                {offer.benefitType === 'discount' ? `${offer.discount}% OFF` : `Buy ${offer.buyQty} Get ${offer.getQty}`}
              </p>
              <p className="text-orange-600 text-sm">{offer.shop?.name}</p>
            </div>
          )}

          <p className="text-gray-500">
            By claiming this offer, you will receive a unique code to show at the shop counter.
          </p>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
          
          <div className="pt-4">
            <button 
              onClick={handleClaim}
              disabled={loading}
              className="w-full bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all disabled:bg-gray-400"
            >
              {loading ? 'Processing...' : 'Get Claim Code'}
            </button>
            <button 
              onClick={() => navigate(-1)}
              disabled={loading}
              className="mt-4 text-gray-400 font-medium hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimPage;
