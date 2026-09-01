import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGeneralContext } from '../context/GeneralContext';
import axiosInstance from '../axiosInstance';

function Landing() {
  const { isAuthenticated } = useGeneralContext();
  const navigate = useNavigate();
  const [highlights, setHighlights] = useState([]);

  useEffect(() => {
    // If user is already authenticated, redirect to home dashboard
    if (isAuthenticated) {
      navigate('/');
      return;
    }

    const fetchHighlights = async () => {
      try {
        const res = await axiosInstance.get('/stocks');
        if (res.data?.stocks) {
          setHighlights(res.data.stocks.slice(0, 6));
        }
      } catch {
        setHighlights([]);
      }
    };

    fetchHighlights();
  }, [isAuthenticated, navigate]);

  return (
    <div className="landing-page-container">
      {/* 1. Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <span className="hero-pill-badge">🚀 Zero-Risk Paper Trading Simulation</span>
          <h1 className="landing-hero-title">
            Master US Stock Trading With <span className="text-gradient">$100,000</span> in Virtual Funds
          </h1>
          <p className="landing-hero-desc">
            Trade top Wall Street equities like Apple, NVIDIA, Tesla, and Microsoft with live market quotes. Practice strategies, track your portfolio, and build trading confidence with zero financial risk.
          </p>

          <div className="landing-hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg hero-cta-btn">
              Get Started ($100k Virtual Cash) 📈
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Sign In to Account
            </Link>
          </div>

          <div className="landing-hero-perks">
            <span>✓ No real deposits</span>
            <span>✓ No credit card needed</span>
            <span>✓ 100% Free educational platform</span>
          </div>
        </div>
      </section>

      {/* 2. Market Highlights */}
      <section className="landing-highlights-section">
        <div className="section-title-wrap text-center">
          <h2>🔥 Live Market Highlights</h2>
          <p className="section-subtitle">Real-time US market equities available for paper trading right now</p>
        </div>

        <div className="landing-cards-grid">
          {highlights.map((stock) => {
            const isPos = (stock.changePercent || 0) >= 0;
            return (
              <div key={stock.symbol} className="landing-stock-card">
                <div className="stock-card-top">
                  <span className="stock-symbol-badge">{stock.symbol}</span>
                  <span className={`change-pill ${isPos ? 'pill-positive' : 'pill-negative'}`}>
                    {isPos ? '+' : ''}{stock.changePercent?.toFixed(2)}%
                  </span>
                </div>
                <div className="landing-stock-name">{stock.companyName}</div>
                <div className="landing-stock-price">
                  ${stock.currentPrice?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Platform Capabilities */}
      <section className="landing-features-section">
        <div className="section-title-wrap text-center">
          <h2>Why Traders Practice On TradeX</h2>
          <p className="section-subtitle">A realistic trading simulator built for beginner and advanced traders</p>
        </div>

        <div className="features-grid">
          <div className="feature-box">
            <span className="feature-icon">💵</span>
            <h3>$100,000 Virtual Wallet</h3>
            <p>Every trader starts with $100,000 in virtual funds. Reset your balance anytime with one click to test new strategies.</p>
          </div>

          <div className="feature-box">
            <span className="feature-icon">📈</span>
            <h3>Interactive Stock Charts</h3>
            <p>Analyze historical trends and price actions using responsive SVG charts with live price crosshairs and performance indicators.</p>
          </div>

          <div className="feature-box">
            <span className="feature-icon">💼</span>
            <h3>Active Portfolio Management</h3>
            <p>Monitor your active holdings, cost basis, current market valuations, and unrealized profit & loss in real time.</p>
          </div>

          <div className="feature-box">
            <span className="feature-icon">📜</span>
            <h3>Immutable Trade Ledger</h3>
            <p>Every buy and sell order is recorded in a permanent transaction history ledger, exactly like a real brokerage.</p>
          </div>
        </div>
      </section>

      {/* 4. Final CTA Banner */}
      <section className="landing-cta-banner">
        <h2>Ready to Start Your Paper Trading Journey?</h2>
        <p>Join TradeX today and begin trading top US market equities with $100,000 in virtual cash.</p>
        <Link to="/register" className="btn btn-primary btn-lg">
          Create Free Paper Account
        </Link>
      </section>
    </div>
  );
}

export default Landing;
