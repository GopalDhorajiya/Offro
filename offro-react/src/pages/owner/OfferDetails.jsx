import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import { getShopOffers, deleteOffer } from '../../services/offerService';
import socket from '../../services/socketService';
import { getServerTime } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';

const DEAL_LINES = {
  discount: [
    (d) => `🔥 *${d.discount}% OFF* on ${d.products} — today only at our shop!`,
    (d) => `✂️ We're slashing *${d.discount}%* off ${d.products}. Come grab yours.`,
    (d) => `💸 *${d.discount}% discount* on ${d.products} — walk in and save.`,
  ],
  buy_x_get_y: [
    (d) => `🎁 Buy *${d.buyQty}* get *${d.getQty} FREE* on ${d.products}\nOnly at our shop — visit us today!`,
    (d) => `👉 Pick up *${d.buyQty}* of ${d.products} → take *${d.getQty} home free*\nIn-store deal only. Come see us!`,
    (d) => `🛒 *Buy ${d.buyQty} Get ${d.getQty} FREE* on ${d.products}\nStroll in, stock up, save big.`,
  ],
  group_goal: [
    (d) => `👥 *Group deal — ${d.discount}% OFF*\nBring a friend to the shop, both of you save!\n${d.slotsLeft != null ? `⚠️ Only *${d.slotsLeft} group spots* left.` : ""}`,
  ],
  slot_limit: [
    (d) => `🎯 *Limited offer — ${d.discount}% OFF* on ${d.products}\nOnly *${d.slotsLeft} of ${d.totalSlots} slots* still open. First come, first served at our shop.`,
  ],
};

const URGENCY_LINES = [
  `⏳ This deal is only available for a limited time — don't sleep on it.`,
  `🕐 Offer won't last long. The sooner you visit, the better.`,
];

const VISIT_HOOKS = [
  `📍 We're waiting for you at the shop.`,
  `🏪 Come see us in person and grab this deal yourself.`,
];
 
const FORWARD_LINES = [
  `_Forward this to someone who'd want this deal_ 🙌`,
  `_Share with a friend — deals are better together_ 🙏`,
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const OfferStatus = ({ offer }) => {
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
    <span className={`px-3 py-1 text-xs font-black rounded-full uppercase tracking-widest ${colors[status] || colors.expired}`}>
      {status}
    </span>
  );
};

const ShareBox = ({ offer }) => {
  const [copyStatus, setCopyStatus] = useState('Copy Text');

  const shareText = useMemo(() => {
    if (!offer) return "";
    const shopName = offer.shop?.name?.trim() || "Our Shop";
    const bType = offer.benefitType || "discount";
    const cType = offer.constraintType || "time_limit";
    const products = offer.applicableProducts?.length
      ? offer.applicableProducts.map((p) => p.name).join(", ")
      : "selected items";
    const link = `${import.meta.env.VITE_FRONTEND_URL}/offer/${offer.id}`;

    const discount = offer.discount ?? 0;
    const buyQty = offer.buyQty ?? 0;
    const getQty = offer.getQty ?? 0;
    const totalSlots = offer.totalSlots ?? 0;
    const filledSlots = offer.filledSlots ?? 0;
    const participantsCount = offer.participants?.length || 0;
    const slotsLeft = totalSlots ? totalSlots - (cType === 'group_goal' ? participantsCount : filledSlots) : null;

    const data = { shopName, products, discount, buyQty, getQty, totalSlots, filledSlots, slotsLeft };
    const variants = DEAL_LINES[bType] || DEAL_LINES[cType] || DEAL_LINES["discount"];
    const dealLine = pick(variants)(data);
    const urgency = pick(URGENCY_LINES);
    const visitHook = pick(VISIT_HOOKS);
    const forward = pick(FORWARD_LINES);

    return `\u{1F6CD} 🛍️ ${shopName}\n\n${dealLine}\n\n${urgency}\n${visitHook}\n🔗 More details: ${link}\n\n${forward}`.trim();
  }, [offer]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus('Copy Text'), 2000);
    });
  };

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="mt-12 bg-gray-900 rounded-[2rem] p-8 text-white shadow-2xl overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl pointer-events-none">💬</div>
      
      <div className="relative">
        <h3 className="text-xl font-black mb-6 flex items-center gap-3">
          🚀 Shareable WhatsApp Content
          <span className="text-[10px] bg-orange-600 text-white px-2 py-0.5 rounded-full">PREVIEW</span>
        </h3>
        
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl mb-6 text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed min-h-[150px]">
          {shareText}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleCopy}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-black py-4 px-8 rounded-2xl transition-all duration-200 border border-white/10 flex items-center justify-center gap-2"
          >
            {copyStatus === 'Copied!' ? <>✅ {copyStatus}</> : <>📋 {copyStatus}</>}
          </button>
          
          <button
            onClick={handleWhatsAppShare}
            className="flex-1 bg-[#25D366] hover:bg-[#20bd56] text-white font-black py-4 px-8 rounded-2xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2 group-hover:scale-[1.01]"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-2.578l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.87 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.187-1.622c1.736.946 3.683 1.445 5.656 1.446h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Send on WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

const OfferDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ownerToken } = useAuth();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffer = async () => {
      setLoading(true);
      try {
        const allOffers = await getShopOffers(ownerToken);
        const found = allOffers.find(o => o.id === id);
        if (found) setOffer(found);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOffer();

    socket.on('offerUpdated', (updated) => {
      console.log('[Socket] Details received offerUpdated:', updated);
      if (updated.id === id) {
        setOffer(updated);
      }
    });

    socket.on('offerDeleted', (deletedId) => {
      console.log('[Socket] Details received offerDeleted:', deletedId);
      if (deletedId === id) {
        navigate('/owner/dashboard');
      }
    });

    return () => {
      socket.off('offerUpdated');
      socket.off('offerDeleted');
    };
  }, [id, ownerToken, navigate]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this offer? This action cannot be undone.')) {
      try {
        await deleteOffer(id, ownerToken);
        navigate('/owner/dashboard');
      } catch (err) {
        console.error('Error deleting offer:', err);
        alert('Failed to delete offer. Please try again.');
      }
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen animate-pulse text-orange-600 font-bold text-2xl tracking-tighter italic">offro details...</div>;
  if (!offer) return <div className="min-h-screen flex items-center justify-center flex-col gap-4">
    <p className="text-xl font-bold text-gray-400">Offer not found.</p>
    <button onClick={() => navigate('/owner/dashboard')} className="text-orange-600 underline font-bold">Back to Dashboard</button>
  </div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      <main className="container mx-auto py-10 px-4">
        <button 
          onClick={() => navigate('/owner/dashboard')}
          className="mb-8 text-gray-500 hover:text-black flex items-center gap-2 font-bold transition-colors"
        >
          ← Back to All Offers
        </button>

        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
            {/* Header Section */}
            <div className="bg-orange-600 p-10 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <p className="text-orange-200 text-xs font-black uppercase tracking-widest mb-2">Offer Management</p>
                <h1 className="text-4xl font-black capitalize leading-none tracking-tighter">
                  {offer.benefitType.replace(/_/g, ' ')} Deal
                </h1>
              </div>
              <OfferStatus offer={offer} />
            </div>

            {/* Content Grid */}
            <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Product Info */}
              <div className="space-y-10">
                <section>
                  <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Product details</h2>
                  {offer.applicableProducts?.[0] ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-3xl font-black text-gray-900">{offer.applicableProducts[0].name}</p>
                        <p className="text-gray-500 font-medium">{offer.applicableProducts[0].description || 'No description provided.'}</p>
                      </div>
                      <div className="flex gap-8 pt-2">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Original Price</p>
                          <p className="text-xl font-black text-gray-700">₹{offer.applicableProducts[0].price}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Weight/Unit</p>
                          <p className="text-xl font-black text-gray-700">{offer.applicableProducts[0].weight} {offer.applicableProducts[0].unit}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="italic text-gray-400 font-medium">No product linked to this offer.</p>
                  )}
                </section>

                <section className="pt-10 border-t border-gray-100">
                  <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Constraint details</h2>
                  <div className="bg-gray-50 p-6 rounded-3xl space-y-4 border border-gray-100">
                    <p className="flex justify-between items-center font-bold">
                      <span className="text-gray-500 text-sm">Type</span>
                      <span className="capitalize text-gray-900">{offer.constraintType.replace(/_/g, ' ')}</span>
                    </p>
                    
                    {offer.constraintType === 'time_limit' && (
                      <>
                        <p className="flex justify-between items-center font-bold">
                          <span className="text-gray-500 text-sm">Starts</span>
                          <span className="text-gray-900 text-sm">{new Date(offer.startTime).toLocaleString()}</span>
                        </p>
                        <p className="flex justify-between items-center font-bold">
                          <span className="text-gray-500 text-sm">Ends</span>
                          <span className="text-gray-900 text-sm">{new Date(offer.endTime).toLocaleString()}</span>
                        </p>
                      </>
                    )}

                    {(offer.constraintType === 'slot_limit' || offer.constraintType === 'group_goal') && (
                      <div className="space-y-2">
                         <div className="flex justify-between items-center font-bold">
                          <span className="text-gray-500 text-sm">{offer.constraintType === 'group_goal' ? 'Goal' : 'Total Slots'}</span>
                          <span className="text-gray-900 text-xl font-black">{offer.totalSlots}</span>
                        </div>
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-gray-500 text-sm">{offer.constraintType === 'group_goal' ? 'Joined' : 'Claimed'}</span>
                          <span className="text-orange-600 text-xl font-black">
                            {offer.constraintType === 'group_goal' ? (offer.participants?.length || 0) : offer.filledSlots}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 h-2 rounded-full mt-4 overflow-hidden">
                          <div 
                            className="bg-orange-500 h-full transition-all duration-500"
                            style={{ width: `${Math.min(100, ((offer.constraintType === 'group_goal' ? offer.participants?.length : offer.filledSlots) / offer.totalSlots) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Benefit Specifics */}
              <div className="flex flex-col">
                <section>
                  <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Benefit details</h2>
                  <div className="bg-orange-50 p-8 rounded-[2rem] border border-orange-100 flex items-center justify-between">
                    <div>
                      <p className="text-orange-600/60 text-xs font-black uppercase mb-1">Current Deal</p>
                      <p className="text-3xl font-black text-orange-900">
                        {offer.benefitType === 'discount' ? `${offer.discount}% OFF` : `Buy ${offer.buyQty} Get ${offer.getQty}`}
                      </p>
                    </div>
                    <div className="text-5xl opacity-20">💰</div>
                  </div>
                </section>

                <div className="mt-auto space-y-4 pt-10">
                  <div className="flex gap-4">
                    <button className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 rounded-2xl hover:bg-gray-200 transition-colors">Pause Offer</button>
                    <button 
                      onClick={handleDelete}
                      className="flex-1 bg-red-50 text-red-600 font-bold py-4 rounded-2xl hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                  <button className="w-full border-2 border-orange-600 text-orange-600 font-bold py-4 rounded-2xl hover:bg-orange-50 transition-colors">Edit Settings</button>
                </div>
              </div>
            </div>
          </div>

          <ShareBox offer={offer} />
        </div>
      </main>
    </div>
  );
};

export default OfferDetails;
