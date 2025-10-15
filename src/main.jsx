// main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // 👈 IMPORT BrowserRouter
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 👈 WRAP App with BrowserRouter */}
    <BrowserRouter> 
      <App />
    </BrowserRouter>
  </StrictMode>,
)