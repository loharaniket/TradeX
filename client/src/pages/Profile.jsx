import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGeneralContext } from '../context/GeneralContext';
import axiosInstance from '../axiosInstance';

function Profile() {
  const { user, wallet, fetchWallet, resetWallet, isAuthenticated } = useGeneralContext();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit profile states
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [contactInput, setContactInput] = useState('');
  const [updateFeedback, setUpdateFeedback] = useState('');

  const loadProfile = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/users/profile');
      if (res.data) {
        setProfile(res.data);
        setNameInput(res.data.name || '');
        setContactInput(res.data.contact || '');
      }
      setLoading(false);
    } catch {
      setError('Unable to retrieve profile information. Please ensure the server is active.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    fetchWallet();
  }, [isAuthenticated]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateFeedback('');
    try {
      const res = await axiosInstance.put('/users/profile', {
        name: nameInput,
        contact: contactInput,
      });
      if (res.data?.success) {
        setUpdateFeedback(res.data.message);
        setProfile((prev) => ({ ...prev, ...res.data.user }));
        setIsEditing(false);
        setTimeout(() => setUpdateFeedback(''), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleResetCash = async () => {
    if (window.confirm('Reset your virtual cash balance to $100,000.00?')) {
      const res = await resetWallet();
      setUpdateFeedback(res.message);
      await Promise.all([loadProfile(), fetchWallet()]);
      setTimeout(() => setUpdateFeedback(''), 4000);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="profile-container">
        <div className="portfolio-auth-prompt">
          <span className="prompt-icon">🔒</span>
          <h2>Account Profile Restricted</h2>
          <p>Please log in or register to view your paper trading profile and account statistics.</p>
          <div className="prompt-actions">
            <Link to="/login" className="btn btn-primary btn-lg">
              Log In
            </Link>
            <Link to="/register" className="btn btn-secondary btn-lg">
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stats = profile?.stats || {
    totalTrades: 0,
    totalBuys: 0,
    totalSells: 0,
    totalTurnover: 0,
    mostActiveTicker: 'N/A',
  };

  const cash = wallet?.availableBalance ?? profile?.virtualBalance ?? 100000;
  const invested = wallet?.investedAmount ?? 0;
  const portfolioVal = wallet?.portfolioValue ?? 0;
  const netWorth = wallet?.totalAccountValue ?? (cash + portfolioVal);
  const pnl = wallet?.unrealizedProfitLoss ?? 0;
  const pnlPct = wallet?.profitLossPercent ?? 0;
  const isPnlPositive = pnl >= 0;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const initials = (profile?.name || user?.name || 'TR')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-hero-banner">
        <div className="profile-hero-left">
          <div className="profile-avatar-circle">{initials}</div>
          <div className="profile-header-info">
            <div className="profile-role-row">
              <span className={`role-badge ${profile?.role === 'admin' ? 'role-badge-admin' : 'role-badge-user'}`}>
                {profile?.role === 'admin' ? '🛡️ Administrator' : '⚡ Verified Paper Trader'}
              </span>
              <span className="member-since-tag">
                Member since {formatDate(profile?.createdAt)}
              </span>
            </div>
            <h1>{profile?.name || user?.name}</h1>
            <p className="profile-email-line">
              📧 {profile?.email || user?.email} · 📞 {profile?.contact || 'No phone provided'}
            </p>
          </div>
        </div>

        <div className="profile-hero-actions">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn btn-secondary btn-sm"
          >
            {isEditing ? '✕ Cancel Editing' : '✏️ Edit Profile'}
          </button>
        </div>
      </div>

      {updateFeedback && (
        <div className="alert alert-success mt-2">
          {updateFeedback}
        </div>
      )}

      {/* Inline Profile Edit Form */}
      {isEditing && (
        <div className="profile-edit-card">
          <h3>Edit Personal Details</h3>
          <form onSubmit={handleUpdateProfile} className="profile-edit-form">
            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="edit-name">Full Name</label>
                <input
                  type="text"
                  id="edit-name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  required
                  className="form-control"
                />
              </div>

              <div className="form-group flex-1">
                <label htmlFor="edit-contact">Phone / Contact</label>
                <input
                  type="text"
                  id="edit-contact"
                  value={contactInput}
                  onChange={(e) => setContactInput(e.target.value)}
                  className="form-control"
                />
              </div>
            </div>

            <div className="edit-form-actions">
              <button type="submit" className="btn btn-primary btn-sm">
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && (
        <div className="stock-loading">
          <div className="spinner"></div>
          <p>Loading trading performance and account metrics...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <p>{error}</p>
          <button onClick={loadProfile} className="btn btn-secondary btn-sm mt-2">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Account Balance & Virtual Funds Overview */}
          <div className="profile-section-card">
            <div className="section-header-row">
              <div>
                <h2>💰 Account Balance & Virtual Funds</h2>
                <span className="section-sub">Paper money allocations and net worth</span>
              </div>
              <button
                onClick={handleResetCash}
                className="btn btn-secondary btn-xs reset-btn"
                title="Reset virtual balance back to $100k"
              >
                🔄 Reset Cash ($100k)
              </button>
            </div>

            <div className="profile-balance-grid">
              <div className="balance-item">
                <span className="bal-label">Available Cash</span>
                <span className="bal-value text-green">
                  ${cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="bal-hint">Liquid buying power</span>
              </div>

              <div className="balance-item">
                <span className="bal-label">Invested in Equities</span>
                <span className="bal-value">
                  ${invested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="bal-hint">Cost basis of holdings</span>
              </div>

              <div className="balance-item">
                <span className="bal-label">Portfolio Valuation</span>
                <span className="bal-value text-primary">
                  ${portfolioVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`bal-hint ${isPnlPositive ? 'text-green' : 'text-red'}`}>
                  P&L: {isPnlPositive ? '+' : ''}${pnl.toFixed(2)} ({isPnlPositive ? '+' : ''}{pnlPct.toFixed(2)}%)
                </span>
              </div>

              <div className="balance-item highlight-card">
                <span className="bal-label">Total Account Net Worth</span>
                <span className="bal-value">
                  ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="bal-hint">Cash + Stock Portfolio</span>
              </div>
            </div>
          </div>

          {/* Trading Performance Statistics */}
          <div className="profile-section-card">
            <div className="section-header-row">
              <div>
                <h2>📊 Trading Statistics & Analytics</h2>
                <span className="section-sub">Historical paper execution records</span>
              </div>
            </div>

            <div className="profile-stats-grid">
              <div className="stat-card">
                <span className="stat-card-num">{stats.totalTrades}</span>
                <span className="stat-card-label">Total Executions</span>
                <span className="stat-card-sub">All completed orders</span>
              </div>

              <div className="stat-card">
                <span className="stat-card-num text-green">{stats.totalBuys}</span>
                <span className="stat-card-label">Buy Orders</span>
                <span className="stat-card-sub">Long positions opened</span>
              </div>

              <div className="stat-card">
                <span className="stat-card-num text-red">{stats.totalSells}</span>
                <span className="stat-card-label">Sell Orders</span>
                <span className="stat-card-sub">Positions liquidated</span>
              </div>

              <div className="stat-card">
                <span className="stat-card-num">
                  ${stats.totalTurnover.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="stat-card-label">Total Turnover</span>
                <span className="stat-card-sub">Cumulative trading volume</span>
              </div>

              <div className="stat-card">
                <span className="stat-card-num text-primary">{stats.mostActiveTicker}</span>
                <span className="stat-card-label">Most Active Asset</span>
                <span className="stat-card-sub">Highest trade frequency</span>
              </div>
            </div>
          </div>

          {/* Quick Links to Portfolio & History */}
          <div className="profile-shortcuts-grid">
            <Link to="/portfolio" className="shortcut-card">
              <div className="shortcut-icon">💼</div>
              <div className="shortcut-info">
                <h3>View Active Portfolio</h3>
                <p>Inspect your active stock holdings, real-time unrealized profit/loss, and position valuations.</p>
              </div>
              <span className="shortcut-arrow">→</span>
            </Link>

            <Link to="/history" className="shortcut-card">
              <div className="shortcut-icon">📜</div>
              <div className="shortcut-info">
                <h3>View Transaction History</h3>
                <p>Access your permanent, immutable audit ledger of all historical buy and sell order executions.</p>
              </div>
              <span className="shortcut-arrow">→</span>
            </Link>

            <Link to="/" className="shortcut-card">
              <div className="shortcut-icon">📈</div>
              <div className="shortcut-info">
                <h3>Trade US Stocks</h3>
                <p>Explore real-time US equity market quotes, analyze interactive charts, and execute paper trades.</p>
              </div>
              <span className="shortcut-arrow">→</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default Profile;
