import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { LayoutProvider } from './context/LayoutContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <LayoutProvider>
        <App />
      </LayoutProvider>
    </AuthProvider>
  </React.StrictMode>
)
