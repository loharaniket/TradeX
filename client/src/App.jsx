import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GeneralProvider, useGeneralContext } from './context/GeneralContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import StockChart from './pages/StockChart';
import Portfolio from './pages/Portfolio';
import History from './pages/History';
import Profile from './pages/Profile';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function AppRoutes() {
  const { isAuthenticated } = useGeneralContext();

  return (
    <Routes>
      {/* Root: Shows interactive dashboard if authenticated, or stunning landing page for guests */}
      <Route path="/" element={isAuthenticated ? <Home /> : <Landing />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/market" element={<Home />} />

      {/* Public Authentication routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Stock market details & charts */}
      <Route path="/stocks/:symbol" element={<StockChart />} />

      {/* Protected User Routes (Require active authentication) */}
      <Route
        path="/portfolio"
        element={
          <ProtectedRoute>
            <Portfolio />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Protected Administrator Routes (Require role: 'admin') */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute adminOnly={true}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <GeneralProvider>
      <Router>
        <div className="app-layout">
          <Navbar />
          <main className="main-content">
            <AppRoutes />
          </main>
          <Footer />
        </div>
      </Router>
    </GeneralProvider>
  );
}

export default App;
