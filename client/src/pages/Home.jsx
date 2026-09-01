import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGeneralContext } from '../context/GeneralContext';
import axiosInstance from '../axiosInstance';

function Home() {
  const { user, isAuthenticated } = useGeneralContext();
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

  return (
    <div className="home-container">
      {isAuthenticated ? (
        <div className="dashboard-welcome">
          <div className="welcome-banner">
            <h1>Welcome back, {user?.name}! 👋</h1>
            <p className="welcome-subtitle">
              Your virtual paper trading account is active. Explore live US stocks below.
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
                <span className="metric-hint">Risk-free virtual funds</span>
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
              <span className="metric-icon">📈</span>
              <div className="metric-info">
                <span className="metric-label">Market Status</span>
                <span className="metric-value">US Equities</span>
                <span className="metric-hint">Live Open Market Data</span>
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
