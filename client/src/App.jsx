import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GeneralProvider } from './context/GeneralContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import StockChart from './pages/StockChart';
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
              <Route path="/stocks/:symbol" element={<StockChart />} />
            </Routes>
          </main>
        </div>
      </Router>
    </GeneralProvider>
  );
}

export default App;
