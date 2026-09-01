import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGeneralContext } from '../context/GeneralContext';
import axiosInstance from '../axiosInstance';

function History() {
  const { isAuthenticated } = useGeneralContext();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadTransactions = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/transactions');
      if (res.data?.success) {
        setTransactions(res.data.transactions);
      }
      setLoading(false);
    } catch {
      setError('Unable to load transaction history. Please verify the server is active.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="history-container">
        <div className="portfolio-auth-prompt">
          <span className="prompt-icon">🔒</span>
          <h2>Authentication Required</h2>
          <p>Please log in or register to view your immutable paper trading transaction history.</p>
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

  // Filter transactions by type and search query
  const filteredTransactions = transactions.filter((tx) => {
    const matchesType = filterType === 'ALL' || tx.orderType === filterType;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      tx.stock.toLowerCase().includes(query) ||
      (tx.companyName && tx.companyName.toLowerCase().includes(query));
    return matchesType && matchesSearch;
  });

  // Calculate quick metrics
  const totalVolume = transactions.reduce((acc, t) => acc + t.totalValue, 0);
  const totalBuys = transactions.filter((t) => t.orderType === 'BUY');
  const totalSells = transactions.filter((t) => t.orderType === 'SELL');

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="history-container">
      {/* Title Header */}
      <div className="history-header">
        <div>
          <h1>Transaction History</h1>
          <p className="history-subtitle">
            Immutable, permanent audit ledger of all paper trading buy & sell executions
          </p>
        </div>
        <button onClick={loadTransactions} className="btn btn-secondary btn-sm">
          🔄 Refresh History
        </button>
      </div>

      {/* Metrics Summary Strip */}
      <div className="history-summary-strip">
        <div className="history-stat-box">
          <span className="stat-label">Total Executions</span>
          <span className="stat-num">{transactions.length}</span>
        </div>
        <div className="history-stat-box">
          <span className="stat-label">Buy Orders</span>
          <span className="stat-num text-green">{totalBuys.length}</span>
        </div>
        <div className="history-stat-box">
          <span className="stat-label">Sell Orders</span>
          <span className="stat-num text-red">{totalSells.length}</span>
        </div>
        <div className="history-stat-box">
          <span className="stat-label">Total Turnover</span>
          <span className="stat-num">${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="history-toolbar">
        <div className="filter-buttons-group">
          <button
            onClick={() => setFilterType('ALL')}
            className={`filter-btn ${filterType === 'ALL' ? 'active-filter' : ''}`}
          >
            All Orders ({transactions.length})
          </button>
          <button
            onClick={() => setFilterType('BUY')}
            className={`filter-btn ${filterType === 'BUY' ? 'active-filter-buy' : ''}`}
          >
            Buys Only ({totalBuys.length})
          </button>
          <button
            onClick={() => setFilterType('SELL')}
            className={`filter-btn ${filterType === 'SELL' ? 'active-filter-sell' : ''}`}
          >
            Sells Only ({totalSells.length})
          </button>
        </div>

        <div className="history-search-wrapper">
          <input
            type="text"
            placeholder="Search by ticker or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="history-search-input"
          />
        </div>
      </div>

      {loading && (
        <div className="stock-loading">
          <div className="spinner"></div>
          <p>Loading permanent transaction ledger...</p>
        </div>
      )}

      {error && (
        <div className="stock-error alert alert-danger">
          <p>{error}</p>
          <button onClick={loadTransactions} className="btn btn-secondary btn-sm mt-2">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="history-card">
          {filteredTransactions.length > 0 ? (
            <div className="stock-table-container">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th>Type</th>
                    <th className="text-right">Quantity</th>
                    <th className="text-right">Execution Price</th>
                    <th className="text-right">Total Amount</th>
                    <th>Date & Time</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => {
                    const isBuy = tx.orderType === 'BUY';
                    return (
                      <tr key={tx._id} className="stock-row">
                        <td>
                          <Link to={`/stocks/${tx.stock}`} className="stock-symbol-badge-link">
                            <span className="stock-symbol-badge">{tx.stock}</span>
                          </Link>
                          {tx.companyName && (
                            <span className="holding-company-name">{tx.companyName}</span>
                          )}
                        </td>
                        <td>
                          <span className={`order-type-badge ${isBuy ? 'badge-buy' : 'badge-sell'}`}>
                            {tx.orderType}
                          </span>
                        </td>
                        <td className="text-right font-bold">{tx.quantity} shares</td>
                        <td className="text-right">${tx.price.toFixed(2)}</td>
                        <td className="text-right font-bold">
                          ${tx.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-muted text-sm">{formatDate(tx.timestamp)}</td>
                        <td className="text-center">
                          <span className="status-badge-completed">
                            ✓ {tx.status || 'COMPLETED'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-portfolio-box">
              <span className="empty-icon">📜</span>
              <h3>No Transactions Found</h3>
              <p>
                {searchQuery || filterType !== 'ALL'
                  ? 'No paper trading transactions match your active filters.'
                  : "You haven't made any paper trades yet. Purchase top US stocks to start building your trading history."}
              </p>
              <Link to="/" className="btn btn-primary btn-md mt-2">
                Explore US Stock Market
              </Link>
            </div>
          )}

          <div className="immutable-notice">
            🔒 <strong>Immutable Record:</strong> All transactions are executed against virtual funds and permanently recorded in the TradeX paper trading ledger. Transactions cannot be modified or deleted.
          </div>
        </div>
      )}
    </div>
  );
}

export default History;
