import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { customer, owner, logout } = useAuth();
  
  const isOwnerPath = location.pathname.startsWith('/owner');
  
  // Determine which user context to display in the header
  // If on owner path, prioritize owner. If on public/customer path, prioritize customer, but fallback to owner if logged in as merchant.
  const displayAsOwner = isOwnerPath || (owner && !customer);
  const user = displayAsOwner ? owner : customer;
  const role = displayAsOwner ? 'owner' : (customer ? 'customer' : null);
  
  const isOwnerDashboard = location.pathname === '/owner/dashboard';
  const isOwnerCreate = location.pathname === '/owner/create';
  
  const handleLogout = () => {
    logout(role);
    navigate(role === 'owner' ? '/owner/login' : '/login');
  };

  return (
    <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center sticky top-0 z-50">
      <Link 
        to={role === 'owner' ? '/owner/dashboard' : '/home'}
        className="text-3xl font-black text-orange-600 tracking-tighter"
      >
        offro
      </Link>
      
      <nav className="flex items-center gap-6">
        {role === 'owner' && user && (
          <>
            <div className="flex items-center gap-4 border-r pr-6 border-gray-200">
              <Link
                to="/owner/create"
                className={`text-sm font-bold ${isOwnerCreate ? 'text-orange-600' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Create
              </Link>
              <Link
                to="/owner/dashboard"
                className={`text-sm font-bold ${isOwnerDashboard ? 'text-orange-600' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Offers
              </Link>
              <Link
                to="/owner/verify"
                className={`text-sm font-bold ${location.pathname === '/owner/verify' ? 'text-orange-600' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Verify
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs font-bold text-gray-400 uppercase leading-none">Merchant</p>
                <p className="text-sm font-black text-gray-800 leading-tight">{user.name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 p-2 rounded-lg transition-colors"
                title="Logout"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </>
        )}

        {role === 'customer' && user ? (
          <div className="flex items-center gap-6">
            <Link 
              to="/my-claims" 
              className="text-sm font-bold text-gray-500 hover:text-orange-600 transition-colors"
            >
              My Claims
            </Link>
            <div className="flex items-center gap-3 border-l pl-6 border-gray-100">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">Customer</p>
                <p className="text-sm font-black text-gray-800 leading-tight">{user.name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 p-2 rounded-lg transition-colors"
                title="Logout"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        ) : !role && (
          <Link 
            to="/login"
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-xl shadow-md transition-all active:scale-95"
          >
            Login
          </Link>
        )}
      </nav>
    </header>
  );
};

export default Header;
