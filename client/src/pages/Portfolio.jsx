import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGeneralContext } from '../context/GeneralContext';
import axiosInstance from '../axiosInstance';

function Portfolio() {
  const { isAuthenticated, user, fetchWallet } = useGeneralContext();
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPortfolio = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/portfolio');
      if (res.data?.success) {
        setPortfolioData(res.data);
      }
      setLoading(false);
    } catch {
      setError('Unable to load portfolio details. Please ensure the server is running.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
    fetchWallet();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="portfolio-container">
        <div className="portfolio-auth-prompt">
          <span className="prompt-icon">🔒</span>
          <h2>Portfolio Access Required</h2>
          <p>Please log in or register to view and manage your virtual stock portfolio.</p>
          <div className="prompt-actions">
            <Link to="/login" className="btn btn-primary btn-lg">
              Log In
            </Link>
            <Link to="/register" className="btn btn-secondary btn-lg">
              Register ($100k Cash)
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const summary = portfolioData?.summary || {
    availableCash: user?.virtualBalance || 100000,
    totalInvested: 0,
    totalPortfolioValue: 0,
    totalProfitLoss: 0,
    totalProfitLossPercent: 0,
    totalNetWorth: user?.virtualBalance || 100000,
    holdingsCount: 0,
  };

  const holdings = portfolioData?.holdings || [];
  const isPnlPositive = summary.totalProfitLoss >= 0;

  return (
    <div className="portfolio-container">
      {/* Portfolio Title & Subtitle */}
      <div className="portfolio-header">
        <div>
          <h1>My Virtual Portfolio</h1>
          <p className="portfolio-subtitle">
            Track your active paper stock holdings, cost basis, and unrealized profit/loss
          </p>
        </div>
        <button onClick={loadPortfolio} className="btn btn-secondary btn-sm" title="Refresh portfolio values">
          🔄 Refresh Portfolio
        </button>
      </div>

      {loading && (
        <div className="stock-loading">
          <div className="spinner"></div>
          <p>Calculating portfolio valuation and holdings...</p>
        </div>
      )}

      {error && (
        <div className="stock-error alert alert-danger">
          <p>{error}</p>
          <button onClick={loadPortfolio} className="btn btn-secondary btn-sm mt-2">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Portfolio Metrics Grid */}
          <div className="portfolio-metrics-grid">
            <div className="portfolio-metric-card">
              <span className="metric-label">Portfolio Value</span>
              <span className="metric-val text-primary">
                ${summary.totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="metric-sub">{summary.holdingsCount} active stock position{summary.holdingsCount === 1 ? '' : 's'}</span>
            </div>

            <div className="portfolio-metric-card">
              <span className="metric-label">Total Invested</span>
              <span className="metric-val">
                ${summary.totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="metric-sub">Total cost basis</span>
            </div>

            <div className="portfolio-metric-card">
              <span className="metric-label">Unrealized Profit / Loss</span>
              <span className={`metric-val ${isPnlPositive ? 'text-green' : 'text-red'}`}>
                {isPnlPositive ? '+' : ''}${summary.totalProfitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`metric-sub ${isPnlPositive ? 'text-green' : 'text-red'}`}>
                {isPnlPositive ? '+' : ''}{summary.totalProfitLossPercent.toFixed(2)}% overall return
              </span>
            </div>

            <div className="portfolio-metric-card">
              <span className="metric-label">Available Cash</span>
              <span className="metric-val text-green">
                ${summary.availableCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="metric-sub">Liquid paper funds</span>
            </div>

            <div className="portfolio-metric-card highlight-card">
              <span className="metric-label">Total Net Worth</span>
              <span className="metric-val">
                ${summary.totalNetWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="metric-sub">Cash + Portfolio Equity</span>
            </div>
          </div>

          {/* Holdings Section */}
          <div className="holdings-card">
            <div className="holdings-header">
              <h2>Active Stock Holdings</h2>
              <span className="holdings-count-badge">{holdings.length} Positions</span>
            </div>

            {holdings.length > 0 ? (
              <div className="stock-table-container">
                <table className="stock-table">
                  <thead>
                    <tr>
                      <th>Stock</th>
                      <th className="text-right">Shares</th>
                      <th className="text-right">Avg Buy Price</th>
                      <th className="text-right">Current Price</th>
                      <th className="text-right">Total Invested</th>
                      <th className="text-right">Current Value</th>
                      <th className="text-right">Unrealized P&L</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((holding) => {
                      const pos = holding.unrealizedProfitLoss >= 0;
                      return (
                        <tr key={holding.symbol} className="stock-row">
                          <td>
                            <Link to={`/stocks/${holding.symbol}`} className="stock-symbol-badge-link">
                              <span className="stock-symbol-badge">{holding.symbol}</span>
                            </Link>
                            <span className="holding-company-name">{holding.companyName}</span>
                          </td>
                          <td className="text-right font-bold">
                            {holding.quantity}
                          </td>
                          <td className="text-right">
                            ${holding.averageBuyPrice.toFixed(2)}
                          </td>
                          <td className="text-right font-bold">
                            ${holding.currentPrice.toFixed(2)}
                          </td>
                          <td className="text-right">
                            ${holding.investedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="text-right font-bold">
                            ${holding.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="text-right">
                            <span className={`change-pill ${pos ? 'pill-positive' : 'pill-negative'}`}>
                              {pos ? '+' : ''}${holding.unrealizedProfitLoss.toFixed(2)} ({pos ? '+' : ''}{holding.profitLossPercent.toFixed(2)}%)
                            </span>
                          </td>
                          <td className="text-right">
                            <Link to={`/stocks/${holding.symbol}`} className="btn btn-primary btn-sm">
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
              <div className="empty-portfolio-box">
                <span className="empty-icon">📂</span>
                <h3>No Active Stock Positions</h3>
                <p>
                  You haven't purchased any stocks yet. Use your <strong>${summary.availableCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> in virtual cash to start paper trading top US stocks!
                </p>
                <Link to="/" className="btn btn-primary btn-lg mt-2">
                  Browse US Stock Market
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Portfolio;
