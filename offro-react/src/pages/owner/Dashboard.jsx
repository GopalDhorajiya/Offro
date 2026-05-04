import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/common/Header';
import { getShopOffers } from '../../services/offerService';
import socket from '../../services/socketService';
import { OfferCard } from '../../components/owner/OfferCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const { ownerToken } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ownerToken) {
      fetchOffers();
    }

    socket.on('offerUpdated', (updatedOffer) => {
      console.log('[Socket] Dashboard received offerUpdated:', updatedOffer);
      setOffers((prevOffers) => 
        prevOffers.map((offer) => 
          offer.id === updatedOffer.id ? updatedOffer : offer
        )
      );
    });

    socket.on('offerDeleted', (deletedOfferId) => {
      console.log('[Socket] Dashboard received offerDeleted:', deletedOfferId);
      setOffers((prevOffers) => prevOffers.filter((offer) => offer.id !== deletedOfferId));
    });

    return () => {
      socket.off('offerUpdated');
      socket.off('offerDeleted');
    };
  }, [ownerToken]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const data = await getShopOffers(ownerToken);
      setOffers(data);
    } catch (err) {
      console.error('Error fetching offers:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Your Offers</h1>
          <button 
            onClick={() => navigate('/owner/create')}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition duration-200"
          >
            + Create New Offer
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading your offers...</p>
          </div>
        ) : offers.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-md text-center">
            <div className="text-6xl mb-4">📢</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No offers yet</h3>
            <p className="text-gray-500 mb-6">Create your first offer to start reaching customers!</p>
            <button 
              onClick={() => navigate('/owner/create')}
              className="text-orange-600 font-bold hover:underline"
            >
              Get started now →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <OfferCard 
                key={offer.id} 
                offer={offer} 
                onClick={() => navigate(`/owner/offer/${offer.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
