import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking backend connection...')
  const [serverOnline, setServerOnline] = useState(false)

  useEffect(() => {
    // Check if backend server is reachable
    axios.get('http://localhost:8000/')
      .then((response) => {
        setBackendStatus(response.data.message || 'Connected to backend successfully!')
        setServerOnline(true)
      })
      .catch((error) => {
        setBackendStatus('Backend is offline or not reachable on http://localhost:8000')
        setServerOnline(false)
      })
  }, [])

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>SB Stocks</h1>
        <p className="tagline">Paper Stock Trading & Virtual Market Simulation</p>
      </header>

      <main className="app-main">
        <div className="status-card">
          <h2>System Setup Status</h2>
          <div className="status-row">
            <span className="status-label">Frontend (Vite + React):</span>
            <span className="status-badge status-online">Running on Port 5173</span>
          </div>
          <div className="status-row">
            <span className="status-label">Backend (Express API):</span>
            <span className={`status-badge ${serverOnline ? 'status-online' : 'status-pending'}`}>
              {backendStatus}
            </span>
          </div>
        </div>

        <div className="info-box">
          <h3>Phase 1 Setup Completed</h3>
          <p>Client and Server environments have been successfully initialized.</p>
        </div>
      </main>
    </div>
  )
}

export default App
