import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import axios from 'axios'
import App from './App'
import './index.css'

if (import.meta.env.VITE_API_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1B1D19',
            color: '#F3F2EC',
            border: '1px solid #2A2D26',
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#C6FF4A', secondary: '#101110' },
          },
          error: {
            iconTheme: { primary: '#ff4a6e', secondary: '#101110' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
