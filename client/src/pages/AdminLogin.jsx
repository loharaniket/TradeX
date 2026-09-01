import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGeneralContext } from '../context/GeneralContext';

function AdminLogin() {
  const { adminLogin, loading } = useGeneralContext();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const res = await adminLogin(email, password);
    if (res.success) {
      navigate('/admin/dashboard');
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@tradex.com');
    setPassword('Admin@12345');
    setErrorMessage('');
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-shield-icon">🛡️</div>
          <h2>TradeX Administration</h2>
          <p className="admin-login-subtitle">Elevated Administrator Access Portal</p>
        </div>

        {errorMessage && (
          <div className="alert alert-danger">
            {errorMessage}
          </div>
        )}

        {/* Demo Credentials Box */}
        <div className="admin-demo-box">
          <div className="demo-info">
            <span className="demo-badge">Default Admin Credentials</span>
            <p><strong>Email:</strong> admin@tradex.com</p>
            <p><strong>Password:</strong> Admin@12345</p>
          </div>
          <button type="button" onClick={handleFillDemo} className="btn-fill-demo">
            Auto-Fill Demo Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label htmlFor="admin-email">Administrator Email</label>
            <input
              type="email"
              id="admin-email"
              placeholder="admin@tradex.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-password">Password</label>
            <input
              type="password"
              id="admin-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-control"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block btn-lg btn-admin-submit"
          >
            {loading ? 'Authenticating Administrator...' : 'Login to Admin Console 🛡️'}
          </button>
        </form>

        <div className="admin-login-footer">
          <p>
            Standard trader account? <Link to="/login">User Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
