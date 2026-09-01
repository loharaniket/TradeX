import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GeneralProvider } from './context/GeneralContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import StockChart from './pages/StockChart';
import Portfolio from './pages/Portfolio';
import History from './pages/History';
import Profile from './pages/Profile';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function App() {
  return (
    <GeneralProvider>
      <Router>
        <div className="app-layout">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/stocks/:symbol" element={<StockChart />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/history" element={<History />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>
        </div>
      </Router>
    </GeneralProvider>
  );
}

export default App;
