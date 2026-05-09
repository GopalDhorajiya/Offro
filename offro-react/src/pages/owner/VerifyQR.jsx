import { useState } from 'react';
import Header from '../../components/common/Header';
import { verifyClaim } from '../../services/claimService';
import { useAuth } from '../../context/AuthContext';
import { Scanner } from '@yudiel/react-qr-scanner';

const VerifyQR = () => {
  const { ownerToken } = useAuth();
  const [claimCode, setClaimCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  const performVerification = async (code) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await verifyClaim(code, ownerToken);
      setResult(data);
      setShowScanner(false);
    } catch (err) {
      setError(err.message || 'Invalid claim code or server error');
      setShowScanner(false);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!claimCode || claimCode.length < 4) return;
    performVerification(claimCode.toUpperCase());
  };

  const handleScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const scannedCode = detectedCodes[0].rawValue;
      setClaimCode(scannedCode.toUpperCase());
      performVerification(scannedCode.toUpperCase());
    }
  };

  const resetScanner = () => {
    setResult(null);
    setError(null);
    setClaimCode('');
    setShowScanner(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto py-10 px-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
            <h1 className="text-3xl font-black mb-8 text-gray-900 flex items-center justify-center gap-3 tracking-tighter italic">
              <span className="bg-orange-600 text-white p-2 rounded-xl not-italic">🔍</span>
              VERIFY CLAIM
            </h1>

            {showScanner ? (
              <div className="space-y-6">
                <div className="overflow-hidden rounded-3xl border-4 border-orange-100 shadow-inner bg-black aspect-square relative">
                  <Scanner 
                    onScan={handleScan}
                    onError={(err) => setError('Camera error: ' + err.message)}
                    styles={{
                      container: { width: '100%', height: '100%' }
                    }}
                  />
                  <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none flex items-center justify-center">
                    <div className="w-full h-full border-2 border-orange-500 rounded-xl"></div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowScanner(false)}
                  className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl hover:bg-black transition-all"
                >
                  CANCEL SCANNING
                </button>
              </div>
            ) : !result ? (
              <form onSubmit={handleVerify} className="space-y-8">
                <div className="text-center space-y-2">
                  <p className="text-gray-500 font-medium">Enter the 8-character coupon code</p>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Provided by the customer</p>
                </div>

                <div className="relative group">
                  <input
                    type="text"
                    value={claimCode}
                    onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                    placeholder="E.G. AB12CD34"
                    maxLength={10}
                    className="w-full text-center text-4xl font-black tracking-[0.5em] py-8 rounded-[2rem] border-4 border-gray-100 focus:border-orange-500 outline-none transition-all placeholder:text-gray-100 placeholder:tracking-normal uppercase"
                    autoFocus
                  />
                  {claimCode && (
                    <button 
                      type="button"
                      onClick={() => setClaimCode('')}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-900 font-black text-xl"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-6 rounded-3xl border border-red-100 flex items-center gap-4 animate-shake">
                    <span className="text-2xl">⚠️</span>
                    <p className="font-bold">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || claimCode.length < 4}
                  className={`w-full font-black py-6 rounded-[2rem] text-xl transition-all shadow-lg flex items-center justify-center gap-3
                    ${loading || claimCode.length < 4 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-orange-600 text-white hover:bg-orange-700 active:scale-95'}`}
                >
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : 'VERIFY NOW'}
                </button>

                <div className="pt-8 border-t border-gray-100">
                  <button 
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="w-full bg-gray-50 text-gray-500 font-black py-4 rounded-2xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                  >
                    📷 OPEN QR SCANNER
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                <div className="text-center">
                  <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl shadow-inner">
                    ✅
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">VERIFIED SUCCESSFULLY!</h2>
                  <p className="text-gray-500 font-medium mt-1">Ready to fulfill the offer</p>
                </div>

                <div className="bg-orange-50 rounded-[2rem] p-8 border border-orange-100 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-orange-600/60 uppercase tracking-widest mb-1">Customer</p>
                      <p className="text-2xl font-black text-orange-900">{result.claimDetails.customerName || 'Customer'}</p>
                      <p className="text-sm font-bold text-orange-600/40">{result.claimDetails.customerPhone}</p>
                    </div>
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-orange-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Status</p>
                      <p className="text-xs font-black text-green-600">REDEEMED</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-orange-200/50">
                    <p className="text-[10px] font-black text-orange-600/60 uppercase tracking-widest mb-1">Offer Benefit</p>
                    <p className="text-3xl font-black text-orange-900">
                      {result.claimDetails.offer.benefitType === 'discount' 
                        ? `${result.claimDetails.offer.discount}% OFF` 
                        : result.claimDetails.offer.benefitType === 'buy_x_get_y'
                        ? `Buy ${result.claimDetails.offer.buyQty} Get ${result.claimDetails.offer.getQty}`
                        : `₹${result.claimDetails.offer.discountAmount} OFF on ₹${result.claimDetails.offer.minPurchase}`}
                    </p>
                    <p className="text-gray-600 font-bold mt-1">
                      on {result.claimDetails.offer.applicableProducts?.[0]?.name || 'Selected Items'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={resetScanner}
                    className="bg-gray-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2"
                  >
                    🔄 NEXT CUSTOMER
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="bg-white border-2 border-gray-100 text-gray-900 font-black py-5 rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    🖨️ PRINT BILL
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 bg-blue-50 p-6 rounded-3xl border border-blue-100 flex gap-4 items-start">
            <span className="text-2xl">💡</span>
            <div className="text-sm">
              <p className="font-black text-blue-900 mb-1">Owner Instruction</p>
              <p className="text-blue-700 font-medium">Verify the product and price on your bill matches the offer details above before completing the sale.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VerifyQR;
