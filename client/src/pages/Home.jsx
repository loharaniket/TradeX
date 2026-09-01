import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGeneralContext } from '../context/GeneralContext';
import axiosInstance from '../axiosInstance';

function Home() {
  const { user, wallet, fetchWallet, resetWallet, isAuthenticated } = useGeneralContext();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch stocks from the backend API
  const fetchStocks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/stocks');
      if (response.data?.stocks) {
        setStocks(response.data.stocks);
      }
      setLoading(false);
    } catch {
      setError('Unable to load stock market data. Please ensure the backend server is running.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  // Filter stocks according to search query
  const filteredStocks = stocks.filter((stock) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      stock.symbol.toLowerCase().includes(query) ||
      stock.companyName.toLowerCase().includes(query)
    );
  });

  // Helper to format market capitalization into readable string (e.g. $3.54T)
  const formatMarketCap = (num) => {
    if (!num) return 'N/A';
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const [resetMessage, setResetMessage] = useState('');

  const handleResetWallet = async () => {
    if (window.confirm('Reset your virtual cash balance to $100,000.00?')) {
      const res = await resetWallet();
      setResetMessage(res.message);
      setTimeout(() => setResetMessage(''), 4000);
    }
  };

  const cash = wallet?.availableBalance ?? user?.virtualBalance ?? 100000;
  const invested = wallet?.investedAmount ?? 0;
  const portfolio = wallet?.portfolioValue ?? 0;
  const totalValue = wallet?.totalAccountValue ?? (cash + portfolio);
  const pnl = wallet?.unrealizedProfitLoss ?? 0;
  const pnlPct = wallet?.profitLossPercent ?? 0;
  const isPnlPositive = pnl >= 0;

  return (
    <div className="home-container">
      {isAuthenticated ? (
        <div className="dashboard-welcome">
          <div className="welcome-banner">
            <div className="welcome-banner-text">
              <h1>Welcome back, {user?.name}! 👋</h1>
              <p className="welcome-subtitle">
                Virtual paper trading account is active. Trade top US stocks with risk-free funds.
              </p>
            </div>
            <button
              onClick={handleResetWallet}
              className="btn btn-secondary btn-sm reset-wallet-btn"
              title="Reset virtual balance to $100,000"
            >
              🔄 Reset Virtual Cash ($100k)
            </button>
          </div>

          {resetMessage && (
            <div className="alert alert-success mt-2">
              {resetMessage}
            </div>
          )}

          {/* Virtual Wallet Metrics Grid */}
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-icon">💵</span>
              <div className="metric-info">
                <span className="metric-label">Available Balance</span>
                <span className="metric-value">
                  ${cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="metric-hint">Liquid cash for new orders</span>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-icon">💼</span>
              <div className="metric-info">
                <span className="metric-label">Invested Amount</span>
                <span className="metric-value">
                  ${invested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="metric-hint">Cost basis of active holdings</span>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-icon">📊</span>
              <div className="metric-info">
                <span className="metric-label">Portfolio Value</span>
                <span className="metric-value">
                  ${portfolio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`metric-hint ${isPnlPositive ? 'text-green' : 'text-red'}`}>
                  P&L: {isPnlPositive ? '+' : ''}${pnl.toFixed(2)} ({isPnlPositive ? '+' : ''}{pnlPct.toFixed(2)}%)
                </span>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-icon">🏦</span>
              <div className="metric-info">
                <span className="metric-label">Total Account Value</span>
                <span className="metric-value">
                  ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="metric-hint">Cash + Stock Portfolio</span>
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

      {/* Stock Market Section */}
      <section className="stock-section">
        <div className="stock-section-header">
          <div>
            <h2>US Stock Market</h2>
            <p className="stock-section-subtitle">
              Browse real-time prices, 24h market performance, and company valuations
            </p>
          </div>

          {/* Search bar */}
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by symbol or company (e.g. AAPL, Tesla)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="search-clear-btn"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Loading and error indicators */}
        {loading && (
          <div className="stock-loading">
            <div className="spinner"></div>
            <p>Fetching real-time stock market data...</p>
          </div>
        )}

        {error && (
          <div className="stock-error alert alert-danger">
            <p>{error}</p>
            <button onClick={fetchStocks} className="btn btn-secondary btn-sm mt-2">
              Retry
            </button>
          </div>
        )}

        {/* Stock List Table */}
        {!loading && !error && (
          <div className="stock-table-container">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Company</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">24h Change</th>
                  <th className="text-right">52-Week Range</th>
                  <th className="text-right">Market Cap</th>
                  <th className="text-right">Chart</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.length > 0 ? (
                  filteredStocks.map((stock) => {
                    const isPositive = stock.change >= 0;
                    return (
                      <tr key={stock.symbol} className="stock-row">
                        <td>
                          <Link to={`/stocks/${stock.symbol}`} className="stock-symbol-badge-link">
                            <span className="stock-symbol-badge">{stock.symbol}</span>
                          </Link>
                        </td>
                        <td>
                          <span className="stock-company-name">{stock.companyName}</span>
                        </td>
                        <td className="text-right stock-price">
                          ${stock.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-right">
                          <span className={`change-pill ${isPositive ? 'pill-positive' : 'pill-negative'}`}>
                            {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                          </span>
                        </td>
                        <td className="text-right stock-range">
                          ${stock.low52Week || '-'} — ${stock.high52Week || '-'}
                        </td>
                        <td className="text-right stock-market-cap">
                          {formatMarketCap(stock.marketCap)}
                        </td>
                        <td className="text-right">
                          <Link to={`/stocks/${stock.symbol}`} className="btn btn-secondary btn-sm chart-btn">
                            Chart 📈
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="no-stocks-found">
                      No stocks found matching "<strong>{searchQuery}</strong>".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
