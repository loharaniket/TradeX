import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGeneralContext } from '../context/GeneralContext';
import axiosInstance from '../axiosInstance';

const QUICK_TICKERS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX', 'JPM', 'V'];

function UserDashboard() {
  const { user, wallet, fetchWallet, resetWallet } = useGeneralContext();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetFeedback, setResetFeedback] = useState('');
  const [quickSearch, setQuickSearch] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/dashboard');
      if (res.data?.success) {
        setDashboardData(res.data);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    fetchWallet();
  }, []);

  const handleReset = async () => {
    if (window.confirm('Reset your virtual paper trading cash to $100,000.00?')) {
      const res = await resetWallet();
      setResetFeedback(res.message);
      await loadDashboard();
      setTimeout(() => setResetFeedback(''), 4000);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const sym = quickSearch.trim().toUpperCase();
    if (sym) {
      navigate(`/stocks/${sym}`);
    }
  };

  const portfolio = dashboardData?.portfolio || {
    availableCash: wallet?.availableBalance ?? user?.virtualBalance ?? 100000,
    totalInvested: wallet?.investedAmount ?? 0,
    totalPortfolioValue: wallet?.portfolioValue ?? 0,
    totalProfitLoss: wallet?.unrealizedProfitLoss ?? 0,
    totalProfitLossPercent: wallet?.profitLossPercent ?? 0,
    totalNetWorth: wallet?.totalAccountValue ?? (user?.virtualBalance || 100000),
    holdingsCount: 0,
    topHoldings: [],
  };

  const recentTransactions = dashboardData?.recentTransactions || [];
  const marketHighlights = dashboardData?.marketHighlights || [];
  const isPnlPositive = portfolio.totalProfitLoss >= 0;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="user-dashboard-wrapper">
      {/* 1. Account Overview & Greeting */}
      <div className="dashboard-hero-banner">
        <div className="dashboard-hero-left">
          <div className="user-badge-row">
            <span className="account-type-pill">⚡ Paper Trading Account</span>
            <span className="account-role-tag">{user?.role === 'admin' ? 'Admin' : 'Verified Trader'}</span>
          </div>
          <h1>Welcome back, {user?.name || 'Trader'}! 👋</h1>
          <p className="dashboard-hero-sub">
            Track your paper performance, monitor active US positions, and execute simulated trades.
          </p>
        </div>

        <div className="dashboard-hero-actions">
          <button onClick={handleReset} className="btn btn-secondary btn-sm" title="Reset virtual cash to $100k">
            🔄 Reset Cash ($100k)
          </button>
        </div>
      </div>

      {resetFeedback && (
        <div className="alert alert-success mt-2">
          {resetFeedback}
        </div>
      )}

      {/* 2. Key Portfolio Metrics Cards */}
      <div className="dashboard-metrics-grid">
        <div className="dash-metric-card highlight-card">
          <span className="dash-metric-title">Total Net Worth</span>
          <span className="dash-metric-num">
            ${portfolio.totalNetWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="dash-metric-sub">Liquid Cash + Portfolio Value</span>
        </div>

        <div className="dash-metric-card">
          <span className="dash-metric-title">Available Cash</span>
          <span className="dash-metric-num text-green">
            ${portfolio.availableCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="dash-metric-sub">Ready for new orders</span>
        </div>

        <div className="dash-metric-card">
          <span className="dash-metric-title">Portfolio Holdings</span>
          <span className="dash-metric-num text-primary">
            ${portfolio.totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="dash-metric-sub">{portfolio.holdingsCount} active stock position{portfolio.holdingsCount === 1 ? '' : 's'}</span>
        </div>

        <div className="dash-metric-card">
          <span className="dash-metric-title">Unrealized P&L</span>
          <span className={`dash-metric-num ${isPnlPositive ? 'text-green' : 'text-red'}`}>
            {isPnlPositive ? '+' : ''}${portfolio.totalProfitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={`dash-metric-sub ${isPnlPositive ? 'text-green' : 'text-red'}`}>
            {isPnlPositive ? '+' : ''}{portfolio.totalProfitLossPercent.toFixed(2)}% overall return
          </span>
        </div>
      </div>

      {/* 3. Quick Trade Access Section */}
      <div className="dashboard-section-card quick-trade-card">
        <div className="section-header-row">
          <div>
            <h3>⚡ Quick Trade Access</h3>
            <span className="section-sub">Jump straight to any US stock chart & order box</span>
          </div>
        </div>

        <div className="quick-trade-content">
          <form onSubmit={handleSearchSubmit} className="quick-search-form">
            <input
              type="text"
              placeholder="Enter ticker (e.g. AAPL, NVDA, TSLA)..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              className="quick-trade-input"
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Trade Stock 📈
            </button>
          </form>

          <div className="quick-ticker-pill-row">
            <span className="pill-row-label">Popular Tickers:</span>
            {QUICK_TICKERS.map((sym) => (
              <Link key={sym} to={`/stocks/${sym}`} className="quick-ticker-link">
                {sym}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Market Highlights & Top Movers */}
      <div className="dashboard-section-card">
        <div className="section-header-row">
          <div>
            <h3>🔥 Market Highlights</h3>
            <span className="section-sub">Top US market movers today</span>
          </div>
          <Link to="/" className="view-all-link">
            Browse All Stocks →
          </Link>
        </div>

        <div className="highlights-grid">
          {marketHighlights.map((m) => {
            const pos = m.changePercent >= 0;
            return (
              <Link key={m.symbol} to={`/stocks/${m.symbol}`} className="highlight-stock-card">
                <div className="highlight-top">
                  <span className="highlight-sym">{m.symbol}</span>
                  <span className={`change-pill ${pos ? 'pill-positive' : 'pill-negative'}`}>
                    {pos ? '+' : ''}{m.changePercent.toFixed(2)}%
                  </span>
                </div>
                <div className="highlight-name">{m.companyName}</div>
                <div className="highlight-price">${m.currentPrice.toFixed(2)}</div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 5. Two-column split: Top Holdings & Recent Transactions */}
      <div className="dashboard-split-grid">
        {/* Top Holdings Preview */}
        <div className="dashboard-section-card">
          <div className="section-header-row">
            <div>
              <h3>💼 Active Holdings</h3>
              <span className="section-sub">{portfolio.holdingsCount} positions currently owned</span>
            </div>
            <Link to="/portfolio" className="view-all-link">
              Full Portfolio →
            </Link>
          </div>

          {portfolio.topHoldings && portfolio.topHoldings.length > 0 ? (
            <div className="dash-table-container">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th className="text-right">Shares</th>
                    <th className="text-right">Value</th>
                    <th className="text-right">P&L</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.topHoldings.map((h) => {
                    const pos = h.unrealizedProfitLoss >= 0;
                    return (
                      <tr key={h.symbol}>
                        <td>
                          <Link to={`/stocks/${h.symbol}`} className="stock-symbol-badge-link">
                            <span className="stock-symbol-badge">{h.symbol}</span>
                          </Link>
                        </td>
                        <td className="text-right font-bold">{h.quantity}</td>
                        <td className="text-right font-bold">${h.currentValue.toFixed(2)}</td>
                        <td className="text-right">
                          <span className={`change-pill ${pos ? 'pill-positive' : 'pill-negative'}`}>
                            {pos ? '+' : ''}${h.unrealizedProfitLoss.toFixed(2)}
                          </span>
                        </td>
                        <td className="text-right">
                          <Link to={`/stocks/${h.symbol}`} className="btn btn-secondary btn-xs">
                            Trade
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dash-empty-box">
              <p>No active positions held yet.</p>
              <Link to="/" className="btn btn-primary btn-sm">
                Explore Market
              </Link>
            </div>
          )}
        </div>

        {/* Recent Transactions Preview */}
        <div className="dashboard-section-card">
          <div className="section-header-row">
            <div>
              <h3>📜 Recent Transactions</h3>
              <span className="section-sub">Last paper trades executed</span>
            </div>
            <Link to="/history" className="view-all-link">
              Full History →
            </Link>
          </div>

          {recentTransactions.length > 0 ? (
            <div className="dash-table-container">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th>Type</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx) => {
                    const isBuy = tx.orderType === 'BUY';
                    return (
                      <tr key={tx._id}>
                        <td>
                          <span className="stock-symbol-badge">{tx.stock}</span>
                        </td>
                        <td>
                          <span className={`order-type-badge ${isBuy ? 'badge-buy' : 'badge-sell'}`}>
                            {tx.orderType}
                          </span>
                        </td>
                        <td className="text-right font-bold">
                          ${tx.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-right text-muted text-sm">{formatDate(tx.timestamp)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dash-empty-box">
              <p>No transactions recorded yet.</p>
              <Link to="/" className="btn btn-secondary btn-sm">
                Make Your First Trade
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
