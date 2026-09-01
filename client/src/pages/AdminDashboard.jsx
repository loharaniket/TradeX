import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGeneralContext } from '../context/GeneralContext';
import axiosInstance from '../axiosInstance';

function AdminDashboard() {
  const { isAuthenticated, isAdmin, user } = useGeneralContext();
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'users', 'trades', 'stocks'

  // Data states
  const [data, setData] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [tradesList, setTradesList] = useState([]);
  const [stocksList, setStocksList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  // Editing balance state
  const [editingUserId, setEditingUserId] = useState(null);
  const [newBalance, setNewBalance] = useState('');

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

  const loadUsers = async () => {
    try {
      const res = await axiosInstance.get('/admin/users');
      if (res.data?.success) setUsersList(res.data.users);
    } catch {
      // Fallback
    }
  };

  const loadTrades = async () => {
    try {
      const res = await axiosInstance.get('/admin/trades');
      if (res.data?.success) setTradesList(res.data.trades);
    } catch {
      // Fallback
    }
  };

  const loadStocks = async () => {
    try {
      const res = await axiosInstance.get('/admin/stocks');
      if (res.data?.success) {
        setStocksList(res.data.stocks);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadAdminMetrics();
    loadUsers();
    loadTrades();
    loadStocks();
  }, [isAuthenticated, isAdmin]);

  // Adjust virtual balance handler
  const handleSaveBalance = async (userId) => {
    const val = parseFloat(newBalance);
    if (isNaN(val) || val < 0) {
      alert('Please enter a valid balance amount (0 or greater).');
      return;
    }

    try {
      const res = await axiosInstance.put(`/admin/users/${userId}/balance`, { balance: val });
      if (res.data?.success) {
        setActionSuccess(res.data.message);
        setEditingUserId(null);
        setNewBalance('');
        await Promise.all([loadUsers(), loadAdminMetrics()]);
        setTimeout(() => setActionSuccess(''), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to adjust user balance');
    }
  };

  // Toggle stock trading status handler
  const handleToggleStock = async (symbol) => {
    try {
      const res = await axiosInstance.put(`/admin/stocks/${symbol}/toggle`);
      if (res.data?.success) {
        setActionSuccess(res.data.message);
        await Promise.all([loadStocks(), loadAdminMetrics()]);
        setTimeout(() => setActionSuccess(''), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update stock status');
    }
  };

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
            <span className="admin-shield-sm">🛡️</span> TradeX Administration Console
          </div>
          <h1>Platform Administration & Management</h1>
          <p className="admin-header-sub">
            Platform-wide user management, paper order surveillance, and stock trading controls
          </p>
        </div>

        <div className="admin-header-actions">
          <span className="admin-user-tag">
            Admin: <strong>{user?.name}</strong> ({user?.email})
          </span>
          <button onClick={() => { loadAdminMetrics(); loadUsers(); loadTrades(); loadStocks(); }} className="btn btn-secondary btn-sm" title="Refresh all data">
            🔄 Refresh All Data
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="alert alert-success">
          {actionSuccess}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="admin-tabs-row">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`admin-tab-btn ${activeTab === 'analytics' ? 'active-admin-tab' : ''}`}
        >
          📊 Analytics & Surveillance
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`admin-tab-btn ${activeTab === 'users' ? 'active-admin-tab' : ''}`}
        >
          👥 User Management ({usersList.length || analytics.totalUsers})
        </button>
        <button
          onClick={() => setActiveTab('trades')}
          className={`admin-tab-btn ${activeTab === 'trades' ? 'active-admin-tab' : ''}`}
        >
          📜 All Trades ({tradesList.length || analytics.totalTrades})
        </button>
        <button
          onClick={() => setActiveTab('stocks')}
          className={`admin-tab-btn ${activeTab === 'stocks' ? 'active-admin-tab' : ''}`}
        >
          ⚙️ Stock Trading Controls
        </button>
      </div>

      {loading && (
        <div className="stock-loading">
          <div className="spinner"></div>
          <p>Aggregating platform data and administrative records...</p>
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
          {/* TAB 1: ANALYTICS & SURVEILLANCE */}
          {activeTab === 'analytics' && (
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

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="admin-panel-card">
              <div className="panel-header">
                <div>
                  <h2>👥 Registered Platform Users</h2>
                  <p className="panel-sub">View user details, roles, and adjust testing virtual balances</p>
                </div>
              </div>

              <div className="stock-table-container">
                <table className="stock-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th className="text-right">Virtual Balance</th>
                      <th className="text-right">Registered</th>
                      <th className="text-right">Balance Tool</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u) => (
                      <tr key={u._id} className="stock-row">
                        <td>
                          <strong>{u.name}</strong>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`role-badge ${u.role === 'admin' ? 'role-badge-admin' : 'role-badge-user'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="text-right font-bold">
                          ${u.virtualBalance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </td>
                        <td className="text-right text-muted text-sm">{formatDate(u.createdAt)}</td>
                        <td className="text-right">
                          {editingUserId === u._id ? (
                            <div className="balance-edit-group">
                              <input
                                type="number"
                                value={newBalance}
                                onChange={(e) => setNewBalance(e.target.value)}
                                placeholder="New $"
                                className="balance-edit-input"
                              />
                              <button onClick={() => handleSaveBalance(u._id)} className="btn btn-primary btn-xs">
                                Save
                              </button>
                              <button onClick={() => setEditingUserId(null)} className="btn btn-secondary btn-xs">
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditingUserId(u._id); setNewBalance(u.virtualBalance || 100000); }}
                              className="btn btn-secondary btn-xs"
                            >
                              Adjust $
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ALL TRADES AUDIT */}
          {activeTab === 'trades' && (
            <div className="admin-panel-card">
              <div className="panel-header">
                <div>
                  <h2>📜 All Platform Trades & Executions</h2>
                  <p className="panel-sub">Immutable audit log of all paper trading orders across every user</p>
                </div>
              </div>

              {tradesList.length > 0 ? (
                <div className="stock-table-container">
                  <table className="stock-table">
                    <thead>
                      <tr>
                        <th>Trader</th>
                        <th>Stock</th>
                        <th>Type</th>
                        <th className="text-right">Quantity</th>
                        <th className="text-right">Price</th>
                        <th className="text-right">Total Amount</th>
                        <th>Timestamp</th>
                        <th className="text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradesList.map((t) => {
                        const isBuy = t.orderType === 'BUY';
                        return (
                          <tr key={t._id} className="stock-row">
                            <td>
                              <div className="trader-col">
                                <span className="trader-name">{t.traderName}</span>
                                <span className="trader-email">{t.traderEmail}</span>
                              </div>
                            </td>
                            <td>
                              <span className="stock-symbol-badge">{t.stock}</span>
                            </td>
                            <td>
                              <span className={`order-type-badge ${isBuy ? 'badge-buy' : 'badge-sell'}`}>
                                {t.orderType}
                              </span>
                            </td>
                            <td className="text-right font-bold">{t.quantity}</td>
                            <td className="text-right">${t.price?.toFixed(2)}</td>
                            <td className="text-right font-bold">
                              ${t.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="text-muted text-sm">{formatDate(t.timestamp)}</td>
                            <td className="text-center">
                              <span className="status-badge-completed">✓ {t.status || 'COMPLETED'}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="dash-empty-box">
                  <p>No trades have been executed on the platform yet.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: STOCK TRADING CONTROLS */}
          {activeTab === 'stocks' && (
            <div className="admin-panel-card">
              <div className="panel-header">
                <div>
                  <h2>⚙️ Stock Market Trading Controls</h2>
                  <p className="panel-sub">Enable or suspend paper trading execution for any US stock asset</p>
                </div>
              </div>

              <div className="stock-table-container">
                <table className="stock-table">
                  <thead>
                    <tr>
                      <th>Ticker</th>
                      <th>Company</th>
                      <th className="text-right">Price</th>
                      <th className="text-center">Trading Status</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stocksList.length > 0
                      ? stocksList
                      : [
                          { symbol: 'AAPL', companyName: 'Apple Inc.', currentPrice: 232.5, tradingEnabled: true },
                          { symbol: 'MSFT', companyName: 'Microsoft Corporation', currentPrice: 428.15, tradingEnabled: true },
                          { symbol: 'NVDA', companyName: 'NVIDIA Corporation', currentPrice: 121.25, tradingEnabled: true },
                          { symbol: 'TSLA', companyName: 'Tesla Inc.', currentPrice: 218.8, tradingEnabled: true },
                          { symbol: 'GOOGL', companyName: 'Alphabet Inc.', currentPrice: 165.4, tradingEnabled: true },
                          { symbol: 'AMZN', companyName: 'Amazon.com Inc.', currentPrice: 188.9, tradingEnabled: true },
                          { symbol: 'META', companyName: 'Meta Platforms Inc.', currentPrice: 512.6, tradingEnabled: true },
                          { symbol: 'NFLX', companyName: 'Netflix Inc.', currentPrice: 684.3, tradingEnabled: true },
                        ]
                    ).map((stk) => {
                      const isEnabled = stk.tradingEnabled !== false;
                      return (
                        <tr key={stk.symbol} className="stock-row">
                          <td>
                            <span className="stock-symbol-badge">{stk.symbol}</span>
                          </td>
                          <td>
                            <strong>{stk.companyName}</strong>
                          </td>
                          <td className="text-right font-bold">
                            ${stk.currentPrice?.toFixed(2)}
                          </td>
                          <td className="text-center">
                            <span className={`status-pill ${isEnabled ? 'status-pill-active' : 'status-pill-suspended'}`}>
                              {isEnabled ? '● Active (Trading Open)' : '✕ Suspended'}
                            </span>
                          </td>
                          <td className="text-right">
                            <button
                              onClick={() => handleToggleStock(stk.symbol)}
                              className={`btn btn-xs ${isEnabled ? 'btn-danger' : 'btn-primary'}`}
                            >
                              {isEnabled ? 'Suspend Trading' : 'Enable Trading'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
