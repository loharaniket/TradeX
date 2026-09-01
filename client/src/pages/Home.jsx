import { Link } from 'react-router-dom';
import { useGeneralContext } from '../context/GeneralContext';

function Home() {
  const { user, isAuthenticated } = useGeneralContext();

  return (
    <div className="home-container">
      {isAuthenticated ? (
        <div className="dashboard-welcome">
          <div className="welcome-banner">
            <h1>Welcome back, {user?.name}! 👋</h1>
            <p className="welcome-subtitle">
              Your virtual paper trading account is active and ready.
            </p>
          </div>

          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-icon">💰</span>
              <div className="metric-info">
                <span className="metric-label">Virtual Cash Balance</span>
                <span className="metric-value">
                  ${user?.virtualBalance ? user.virtualBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '100,000.00'}
                </span>
                <span className="metric-hint">Risk-free paper funds</span>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-icon">📊</span>
              <div className="metric-info">
                <span className="metric-label">Account Status</span>
                <span className="metric-value status-active">Active ({user?.role || 'user'})</span>
                <span className="metric-hint">{user?.email}</span>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-icon">🚀</span>
              <div className="metric-info">
                <span className="metric-label">Trading Market</span>
                <span className="metric-value">US Stocks</span>
                <span className="metric-hint">Market integration coming in Phase 6</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="hero-landing">
          <div className="hero-content">
            <span className="hero-badge">Paper Stock Trading Simulation</span>
            <h1>Master US Stock Trading With Zero Financial Risk</h1>
            <p className="hero-description">
              Sign up today and receive <strong>$100,000 in virtual funds</strong>. Practice trading top US stocks, experiment with strategies, and track your portfolio in real time.
            </p>

            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started ($100k Virtual Cash)
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Existing Trader Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
