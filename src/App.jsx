// src/App.jsx

import { Routes, Route, Navigate } from 'react-router-dom' 
import { SpeedInsights } from '@vercel/speed-insights/react'; // 👈 IMPORT SpeedInsights
import SignUp from './SignUp.jsx' 
import Login from './Login.jsx' 
import UpdatePassword from './UpdatePassword.jsx' 
import AdminPage from './AdminPage.jsx'; 
import MainPage from './MainPage.jsx';     
import AuthGuard from './AuthGuard.jsx'; 

function App() {
  
  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2>Welcome Users</h2>
      </div>

      <Routes>
        {/* Default route redirects to /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* AUTHENTICATION ROUTES - Protected by AuthGuard */}
        {/* AuthGuard prevents logged-in users from seeing the login/signup pages */}
        <Route 
          path="/login" 
          element={<AuthGuard><Login /></AuthGuard>} 
        />
        
        <Route 
          path="/signup" 
          element={<AuthGuard><SignUp /></AuthGuard>} 
        />

        {/* PASSWORD RESET ROUTE */}
        <Route path="/update-password" element={<UpdatePassword />} />
        
        {/* PROTECTED DASHBOARD ROUTES */}
        <Route path="/admin" element={<AdminPage />} /> 
        <Route path="/main" element={<MainPage />} />
        
        {/* Optional 404 Route */}
        {/* <Route path="*" element={<div>404 Not Found</div>} /> */}
      </Routes>

      {/* Vercel Speed Insights Integration */}
      <SpeedInsights /> 
    </>
  )
}

export default App