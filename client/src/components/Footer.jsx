import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="brand-icon">📈</span>
            <span className="footer-brand-title">TradeX</span>
            <p className="footer-brand-sub">
              Professional US Equity Paper Trading Simulation Platform
            </p>
          </div>

          <div className="footer-nav">
            <div className="footer-col">
              <h4>Platform</h4>
              <Link to="/market">Market Equities</Link>
              <Link to="/portfolio">Portfolio Desk</Link>
              <Link to="/history">Trade History</Link>
              <Link to="/profile">Trader Profile</Link>
            </div>

            <div className="footer-col">
              <h4>Security & Admin</h4>
              <Link to="/admin/login">Admin Console</Link>
              <Link to="/admin/dashboard">Platform Surveillance</Link>
            </div>
          </div>
        </div>

        <div className="footer-disclaimer-box">
          <p>
            <strong>⚠️ Educational Simulation Disclaimer:</strong> TradeX is strictly a paper trading and educational simulation platform. All accounts begin with $100,000 in simulated virtual funds. No real money, deposits, withdrawals, or real-world financial transactions are supported. Stock quotes and chart metrics are provided for educational simulation purposes.
          </p>
        </div>

        <div className="footer-bottom">
          <p>© 2026 TradeX Simulation Technologies. All rights reserved.</p>
          <div className="system-status-indicator">
            <span className="status-dot-pulse"></span> Virtual Exchange Status: Online
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
