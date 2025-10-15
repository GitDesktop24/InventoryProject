// src/App.jsx

import { Routes, Route, Navigate } from 'react-router-dom' 
import { SpeedInsights } from '@vercel/speed-insights/react'; 
import SignUp from './SignUp.jsx' 
import Login from './Login.jsx' 
import UpdatePassword from './UpdatePassword.jsx' 
import AdminPage from './AdminPage.jsx'; 
import MainPage from './MainPage.jsx';     
import AuthGuard from './AuthGuard.jsx'; 

// NEW: Import the background image here, as App.jsx will now handle the full page background
import backgroundImage from './assets/asset1.jpg'; 

function App() {
  
  return (
    // MODIFIED: Apply the image background to the highest level wrapper
    <div style={styles.appWrapper}>
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
        
      </Routes>
      <SpeedInsights /> 
    </div>
  )
}

const styles = {
    // NEW/MODIFIED: Wrapper style to apply the IMAGE background across the entire app surface
    appWrapper: {
        minHeight: '100vh',
        width: '100%',
        backgroundImage: `url(${backgroundImage})`, // Use imported image URL
        backgroundSize: 'cover', // Ensures image covers the whole area
        backgroundPosition: 'center', // Centers the image
        backgroundRepeat: 'no-repeat',
        
        // Ensure content (Login/Signup cards) are centered
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    }
};

export default App