import { Link, useNavigate } from 'react-router-dom';
import { useGeneralContext } from '../context/GeneralContext';

function Navbar() {
  const { user, isAuthenticated, logout } = useGeneralContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">📈</span> SB Stocks
        </Link>

        <div className="navbar-links">
          {isAuthenticated ? (
            <>
              <div className="navbar-balance">
                <span className="balance-label">Virtual Cash:</span>
                <span className="balance-amount">
                  ${user?.virtualBalance ? user.virtualBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '100,000.00'}
                </span>
              </div>
              <span className="navbar-user">Hello, {user?.name || 'Trader'}</span>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
