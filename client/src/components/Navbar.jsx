import { Link, useNavigate } from 'react-router-dom';
import { useGeneralContext } from '../context/GeneralContext';

function Navbar() {
  const { user, wallet, isAuthenticated, logout } = useGeneralContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const cash = wallet?.availableBalance ?? user?.virtualBalance ?? 100000;
  const portfolio = wallet?.portfolioValue ?? 0;

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
                <span className="balance-label">Cash:</span>
                <span className="balance-amount">
                  ${cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {portfolio > 0 && (
                  <>
                    <span className="balance-divider">|</span>
                    <span className="balance-label">Holdings:</span>
                    <span className="balance-holdings">
                      ${portfolio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </>
                )}
              </div>
              <Link to="/portfolio" className="nav-link font-semibold">
                Portfolio
              </Link>
              <Link to="/history" className="nav-link font-semibold">
                History
              </Link>
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
