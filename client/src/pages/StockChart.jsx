import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGeneralContext } from '../context/GeneralContext';
import axiosInstance from '../axiosInstance';
import StockChartComponent from '../components/StockChart';

const POPULAR_SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX', 'JPM', 'V'];

function StockChartPage() {
  const { symbol = 'AAPL' } = useParams();
  const navigate = useNavigate();
  const { user, wallet, fetchWallet, isAuthenticated } = useGeneralContext();

  const [stock, setStock] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Trading state
  const [orderType, setOrderType] = useState('BUY');
  const [quantity, setQuantity] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderFeedback, setOrderFeedback] = useState(null);
  const [holding, setHolding] = useState({ ownedShares: 0, averageBuyPrice: 0 });

  // Fetch holding for the authenticated user
  const fetchHolding = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await axiosInstance.get(`/orders/holding/${symbol}`);
      if (res.data?.success) {
        setHolding(res.data);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setOrderFeedback(null);

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
    fetchHolding();

    return () => {
      isMounted = false;
    };
  }, [symbol, isAuthenticated]);

  // Handle Order Placement (Buy or Sell)
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setOrderFeedback({ type: 'error', message: 'Please enter a valid quantity of 1 or more.' });
      return;
    }

    setOrderLoading(true);
    setOrderFeedback(null);

    try {
      const res = await axiosInstance.post('/orders', {
        symbol: stock.symbol,
        orderType,
        quantity: qty,
      });

      if (res.data?.success) {
        setOrderFeedback({ type: 'success', message: res.data.message });
        setQuantity(1);
        await Promise.all([fetchHolding(), fetchWallet()]);
      }
      setOrderLoading(false);
    } catch (err) {
      setOrderLoading(false);
      const msg = err.response?.data?.message || 'Order execution failed. Please try again.';
      setOrderFeedback({ type: 'error', message: msg });
    }
  };

  // Calculate period statistics from history
  const prices = history.map((h) => h.price);
  const periodMin = prices.length ? Math.min(...prices) : 0;
  const periodMax = prices.length ? Math.max(...prices) : 0;
  const firstPrice = prices[0] || 0;
  const lastPrice = prices[prices.length - 1] || 0;
  const periodChange = lastPrice - firstPrice;
  const periodChangePercent = firstPrice ? ((periodChange / firstPrice) * 100) : 0;

  const isPositive = (stock?.change || 0) >= 0;
  const availableCash = wallet?.availableBalance ?? user?.virtualBalance ?? 100000;
  const currentPrice = stock?.currentPrice || 0;
  const estimatedTotal = Number((quantity * currentPrice).toFixed(2));

  // Max shares user can buy
  const maxAffordableShares = currentPrice > 0 ? Math.floor(availableCash / currentPrice) : 0;

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

          {/* Paper Trading Execution Section */}
          <div className="trading-box-card">
            <div className="trading-box-header">
              <div className="trading-title-group">
                <h3>Paper Trading: {stock.symbol}</h3>
                <span className="trading-tag">Virtual Execution (Zero Risk)</span>
              </div>

              {isAuthenticated && (
                <div className="trading-user-status">
                  <span className="cash-indicator">
                    Cash: <strong>${availableCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </span>
                  <span className="shares-indicator">
                    Owned: <strong>{holding.ownedShares} shares</strong>
                  </span>
                </div>
              )}
            </div>

            {orderFeedback && (
              <div className={`alert ${orderFeedback.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
                {orderFeedback.message}
              </div>
            )}

            {isAuthenticated ? (
              <form onSubmit={handlePlaceOrder} className="trading-form">
                {/* Buy / Sell Tabs */}
                <div className="order-type-tabs">
                  <button
                    type="button"
                    onClick={() => { setOrderType('BUY'); setOrderFeedback(null); }}
                    className={`order-tab-btn buy-tab ${orderType === 'BUY' ? 'active-buy' : ''}`}
                  >
                    Buy {stock.symbol}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOrderType('SELL'); setOrderFeedback(null); }}
                    className={`order-tab-btn sell-tab ${orderType === 'SELL' ? 'active-sell' : ''}`}
                  >
                    Sell {stock.symbol}
                  </button>
                </div>

                <div className="trading-inputs-grid">
                  {/* Quantity input */}
                  <div className="trade-field">
                    <label htmlFor="order-quantity">Quantity (Shares)</label>
                    <div className="quantity-control-group">
                      <input
                        type="number"
                        id="order-quantity"
                        min="1"
                        step="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="quantity-input"
                        required
                      />
                      <div className="quick-qty-buttons">
                        <button type="button" onClick={() => setQuantity(1)} className="btn-qty">1</button>
                        <button type="button" onClick={() => setQuantity(5)} className="btn-qty">+5</button>
                        <button type="button" onClick={() => setQuantity(10)} className="btn-qty">+10</button>
                        {orderType === 'BUY' && maxAffordableShares > 0 && (
                          <button
                            type="button"
                            onClick={() => setQuantity(maxAffordableShares)}
                            className="btn-qty btn-qty-max"
                            title={`Max affordable shares: ${maxAffordableShares}`}
                          >
                            Max ({maxAffordableShares})
                          </button>
                        )}
                        {orderType === 'SELL' && holding.ownedShares > 0 && (
                          <button
                            type="button"
                            onClick={() => setQuantity(holding.ownedShares)}
                            className="btn-qty btn-qty-max"
                            title={`Max owned shares: ${holding.ownedShares}`}
                          >
                            All ({holding.ownedShares})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Total Estimation */}
                  <div className="trade-summary-field">
                    <div className="summary-line">
                      <span>Execution Price:</span>
                      <strong>${currentPrice.toFixed(2)}</strong>
                    </div>
                    <div className="summary-line total-line">
                      <span>Estimated {orderType === 'BUY' ? 'Cost' : 'Credit'}:</span>
                      <strong className={orderType === 'BUY' ? 'cost-text' : 'credit-text'}>
                        ${estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Validation Warnings */}
                {orderType === 'BUY' && estimatedTotal > availableCash && (
                  <div className="trade-warning">
                    ⚠️ Insufficient virtual funds. You need ${estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} but only have ${availableCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}.
                  </div>
                )}

                {orderType === 'SELL' && quantity > holding.ownedShares && (
                  <div className="trade-warning">
                    ⚠️ Insufficient shares. You own {holding.ownedShares} shares of {stock.symbol}, but selected {quantity}.
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={
                    orderLoading ||
                    (orderType === 'BUY' && estimatedTotal > availableCash) ||
                    (orderType === 'SELL' && (holding.ownedShares === 0 || quantity > holding.ownedShares))
                  }
                  className={`btn btn-lg btn-block ${orderType === 'BUY' ? 'btn-trade-buy' : 'btn-trade-sell'}`}
                >
                  {orderLoading
                    ? 'Processing Paper Order...'
                    : orderType === 'BUY'
                    ? `Confirm Buy ${quantity} ${stock.symbol} ($${estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })})`
                    : `Confirm Sell ${quantity} ${stock.symbol} (+$${estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })})`}
                </button>
              </form>
            ) : (
              <div className="trading-logged-out-box">
                <p>
                  Log in or create an account to paper trade <strong>{stock.companyName} ({stock.symbol})</strong> with <strong>$100,000</strong> in risk-free virtual funds.
                </p>
                <div className="logged-out-actions">
                  <Link to="/login" className="btn btn-primary btn-sm">
                    Log In to Trade
                  </Link>
                  <Link to="/register" className="btn btn-secondary btn-sm">
                    Create Account ($100k Cash)
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Key Statistics Grid */}
          <div className="key-stats-section">
            <h3>Market Overview & Statistics</h3>
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
