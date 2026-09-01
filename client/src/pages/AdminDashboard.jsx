import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGeneralContext } from '../context/GeneralContext';
import axiosInstance from '../axiosInstance';

function AdminDashboard() {
  const { isAuthenticated, isAdmin, user } = useGeneralContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAdminMetrics = async () => {
    if (!isAuthenticated || !isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/admin/dashboard');
      if (res.data?.success) {
        setData(res.data);
      }
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch administrative metrics');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminMetrics();
  }, [isAuthenticated, isAdmin]);

  // Auth gate for non-admin users
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="admin-gate-container">
        <div className="admin-gate-card">
          <span className="gate-icon">🔒</span>
          <h2>Administrator Access Required</h2>
          <p>
            You are attempting to access a restricted administrative control panel. Please log in with verified administrator credentials to continue.
          </p>
          <div className="gate-actions">
            <Link to="/admin/login" className="btn btn-primary btn-lg">
              Admin Portal Login 🛡️
            </Link>
            <Link to="/" className="btn btn-secondary btn-lg">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const analytics = data?.analytics || {
    totalUsers: 0,
    totalTraders: 0,
    totalAdmins: 0,
    totalTrades: 0,
    totalPlatformVolume: 0,
    activeStocksCount: 10,
  };

  const mostTraded = data?.mostTradedStocks || [];
  const recentActivity = data?.recentPlatformActivity || [];

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
    <div className="admin-dashboard-container">
      {/* Header Banner */}
      <div className="admin-header-banner">
        <div className="admin-header-text">
          <div className="admin-banner-badge">
            <span className="admin-shield-sm">🛡️</span> TradeX Management Console
          </div>
          <h1>Platform Administration</h1>
          <p className="admin-header-sub">
            Real-time surveillance of user accounts, paper trading execution volume, and platform activity
          </p>
        </div>

        <div className="admin-header-actions">
          <span className="admin-user-tag">
            Admin: <strong>{user?.name}</strong> ({user?.email})
          </span>
          <button onClick={loadAdminMetrics} className="btn btn-secondary btn-sm" title="Refresh metrics">
            🔄 Refresh Analytics
          </button>
        </div>
      </div>

      {loading && (
        <div className="stock-loading">
          <div className="spinner"></div>
          <p>Aggregating platform analytics and surveillance data...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <p>{error}</p>
          <button onClick={loadAdminMetrics} className="btn btn-secondary btn-sm mt-2">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Key Administrative Metric Cards */}
          <div className="admin-metrics-grid">
            <div className="admin-metric-card">
              <span className="admin-metric-label">Total Users</span>
              <span className="admin-metric-val">{analytics.totalUsers}</span>
              <span className="admin-metric-hint">
                {analytics.totalTraders} traders · {analytics.totalAdmins} admin
              </span>
            </div>

            <div className="admin-metric-card">
              <span className="admin-metric-label">Total Platform Trades</span>
              <span className="admin-metric-val text-primary">{analytics.totalTrades}</span>
              <span className="admin-metric-hint">Completed paper orders</span>
            </div>

            <div className="admin-metric-card highlight-card">
              <span className="admin-metric-label">Total Platform Volume</span>
              <span className="admin-metric-val text-green">
                ${analytics.totalPlatformVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="admin-metric-hint">Cumulative trade turnover</span>
            </div>

            <div className="admin-metric-card">
              <span className="admin-metric-label">Listed US Equities</span>
              <span className="admin-metric-val">{analytics.activeStocksCount}</span>
              <span className="admin-metric-hint">Live open market assets</span>
            </div>
          </div>

          {/* Two Columns: Most Traded Stocks & Platform Activity */}
          <div className="admin-split-grid">
            {/* Most Traded Stocks */}
            <div className="admin-panel-card">
              <div className="panel-header">
                <div>
                  <h2>🔥 Most Traded Stocks</h2>
                  <p className="panel-sub">Ranked by execution volume and trade count</p>
                </div>
              </div>

              <div className="stock-table-container">
                <table className="stock-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Stock</th>
                      <th className="text-right">Trades</th>
                      <th className="text-right">Volume</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mostTraded.map((item, index) => (
                      <tr key={item.symbol} className="stock-row">
                        <td className="rank-td">
                          <span className="rank-badge">#{index + 1}</span>
                        </td>
                        <td>
                          <Link to={`/stocks/${item.symbol}`} className="stock-symbol-badge-link">
                            <span className="stock-symbol-badge">{item.symbol}</span>
                          </Link>
                          <span className="holding-company-name">{item.companyName}</span>
                        </td>
                        <td className="text-right font-bold">{item.tradesCount}</td>
                        <td className="text-right font-bold">
                          ${item.totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-right">
                          <Link to={`/stocks/${item.symbol}`} className="btn btn-secondary btn-xs">
                            View 📈
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Platform Activity */}
            <div className="admin-panel-card">
              <div className="panel-header">
                <div>
                  <h2>📡 Recent Platform Activity</h2>
                  <p className="panel-sub">Real-time trade audit stream across all users</p>
                </div>
              </div>

              {recentActivity.length > 0 ? (
                <div className="stock-table-container">
                  <table className="stock-table">
                    <thead>
                      <tr>
                        <th>Trader</th>
                        <th>Stock</th>
                        <th>Type</th>
                        <th className="text-right">Amount</th>
                        <th className="text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivity.map((act) => {
                        const isBuy = act.orderType === 'BUY';
                        return (
                          <tr key={act._id} className="stock-row">
                            <td>
                              <div className="trader-col">
                                <span className="trader-name">{act.userName}</span>
                                <span className="trader-email">{act.userEmail}</span>
                              </div>
                            </td>
                            <td>
                              <span className="stock-symbol-badge">{act.stock}</span>
                            </td>
                            <td>
                              <span className={`order-type-badge ${isBuy ? 'badge-buy' : 'badge-sell'}`}>
                                {act.orderType}
                              </span>
                            </td>
                            <td className="text-right font-bold">
                              ${act.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="text-right text-muted text-sm">{formatDate(act.timestamp)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="dash-empty-box">
                  <p>No trades executed across the platform yet.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
