import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { LayoutProvider } from './context/LayoutContext.jsx'
import { UnsavedChangesProvider } from './context/UnsavedChangesContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <LayoutProvider>
        <UnsavedChangesProvider>
          <App />
        </UnsavedChangesProvider>
      </LayoutProvider>
    </AuthProvider>
  </React.StrictMode>
)
