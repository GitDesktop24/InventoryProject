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
    <div style={styles.appWrapper}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* CORRECTED: REMOVE AuthGuard from /login and /signup */}
        <Route 
          path="/login" 
          element={<Login />} // NO AuthGuard needed here
        />
        
        <Route 
          path="/signup" 
          element={<SignUp />} // NO AuthGuard needed here
        />

        {/* PASSWORD RESET ROUTE - This is already correct and unguarded */}
        <Route path="/update-password" element={<UpdatePassword />} />
        
        {/* PROTECTED DASHBOARD ROUTES - Keep AuthGuard logic here (implied by AdminPage/MainPage logic) */}
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