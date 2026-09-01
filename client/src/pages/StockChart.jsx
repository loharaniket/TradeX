import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import StockChartComponent from '../components/StockChart';

const POPULAR_SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX', 'JPM', 'V'];

function StockChartPage() {
  const { symbol = 'AAPL' } = useParams();
  const navigate = useNavigate();

  const [stock, setStock] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadStockDetails = async () => {
      try {
        const [quoteRes, historyRes] = await Promise.all([
          axiosInstance.get(`/stocks/${symbol}`),
          axiosInstance.get(`/stocks/${symbol}/history`),
        ]);

        if (isMounted) {
          if (quoteRes.data?.stock) {
            setStock(quoteRes.data.stock);
          }
          if (historyRes.data?.history) {
            setHistory(historyRes.data.history);
          }
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setError(`Unable to load market data for '${symbol}'. Please verify the stock symbol.`);
          setLoading(false);
        }
      }
    };

    loadStockDetails();

    return () => {
      isMounted = false;
    };
  }, [symbol]);

  // Calculate period statistics from history
  const prices = history.map((h) => h.price);
  const periodMin = prices.length ? Math.min(...prices) : 0;
  const periodMax = prices.length ? Math.max(...prices) : 0;
  const firstPrice = prices[0] || 0;
  const lastPrice = prices[prices.length - 1] || 0;
  const periodChange = lastPrice - firstPrice;
  const periodChangePercent = firstPrice ? ((periodChange / firstPrice) * 100) : 0;

  const isPositive = (stock?.change || 0) >= 0;

  return (
    <div className="stock-details-container">
      {/* Navigation header */}
      <div className="details-nav-header">
        <Link to="/" className="back-link">
          ← Back to Stock Market
        </Link>

        {/* Quick stock selector pills */}
        <div className="quick-symbol-selector">
          <span className="selector-label">Switch stock:</span>
          <div className="symbol-pills">
            {POPULAR_SYMBOLS.map((s) => (
              <button
                key={s}
                onClick={() => navigate(`/stocks/${s}`)}
                className={`symbol-pill-btn ${s === symbol.toUpperCase() ? 'active-pill' : ''}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="stock-loading">
          <div className="spinner"></div>
          <p>Loading stock details and chart for {symbol}...</p>
        </div>
      )}

      {error && (
        <div className="stock-error alert alert-danger">
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="btn btn-secondary btn-sm mt-2">
            Return to Market Listing
          </button>
        </div>
      )}

      {!loading && !error && stock && (
        <div className="stock-details-card">
          {/* Main header: Symbol, Company name, Price & 24h change */}
          <div className="stock-details-header">
            <div>
              <div className="symbol-row">
                <span className="stock-symbol-badge-lg">{stock.symbol}</span>
                <span className="stock-market-tag">NASDAQ / US Market</span>
              </div>
              <h1 className="stock-detail-title">{stock.companyName}</h1>
            </div>

            <div className="stock-detail-pricing">
              <div className="current-price-lg">
                ${stock.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={`change-pill change-pill-lg ${isPositive ? 'pill-positive' : 'pill-negative'}`}>
                {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
              </div>
            </div>
          </div>

          {/* Interactive Stock Chart */}
          <div className="chart-wrapper-card">
            <StockChartComponent history={history} symbol={stock.symbol} isPositive={isPositive} />
          </div>

          {/* Key Statistics Grid */}
          <div className="key-stats-section">
            <h3>Market Overview & Performance</h3>
            <div className="stats-grid">
              <div className="stat-box">
                <span className="stat-label">52-Week High</span>
                <span className="stat-val">${stock.high52Week || '-'}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">52-Week Low</span>
                <span className="stat-val">${stock.low52Week || '-'}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">1-Month High</span>
                <span className="stat-val">${periodMax.toFixed(2)}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">1-Month Low</span>
                <span className="stat-val">${periodMin.toFixed(2)}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">1-Month Return</span>
                <span className={`stat-val ${periodChange >= 0 ? 'text-green' : 'text-red'}`}>
                  {periodChange >= 0 ? '+' : ''}{periodChangePercent.toFixed(2)}%
                </span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Market Cap</span>
                <span className="stat-val">
                  {stock.marketCap
                    ? stock.marketCap >= 1e12
                      ? `$${(stock.marketCap / 1e12).toFixed(2)}T`
                      : `$${(stock.marketCap / 1e9).toFixed(2)}B`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockChartPage;
