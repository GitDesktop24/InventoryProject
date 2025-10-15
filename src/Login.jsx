// src/Login.jsx

import { useState } from 'react';
import { supabase } from './supabaseClient'; 
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  
  const navigate = useNavigate();

  // --- LOGIC (UNCHANGED) ---

  const handleSignIn = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const userId = signInData.user.id;

    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
    
    if (profileError || !profileData) {
        console.error("Profile fetch error:", profileError);
        setError("Login successful, but profile data missing. Please contact support.");
        await supabase.auth.signOut(); 
        setLoading(false);
        return;
    }

    if (profileData.role === 'admin') {
        navigate('/admin', { replace: true });
    } else {
        navigate('/main', { replace: true });
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`, 
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage('Password reset email sent! Check your inbox to continue.');
      setForgotPasswordMode(false);
    }
    setLoading(false);
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // --- Render Functions (UNCHANGED) ---
  const renderLoginForm = () => (
    <form onSubmit={handleSignIn} style={styles.form}>
      <label htmlFor="email-login" style={styles.label}>Email</label>
      <input
        id="email-login"
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={styles.input}
        disabled={loading}
      />

      <label htmlFor="password-login" style={styles.label}>Password</label>
      <div style={styles.passwordContainer}>
        <input
          id="password-login"
          type={showPassword ? 'text' : 'password'} 
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.passwordInput} 
          disabled={loading}
        />
        <button 
          type="button" 
          onClick={togglePasswordVisibility} 
          style={styles.toggleButton}
          disabled={loading}
        >
          {showPassword ? '👁️' : '🔒'} 
        </button>
      </div>

      <button type="submit" disabled={loading} style={styles.button}>
        {loading ? 'Logging In...' : 'Log In'}
      </button>

      <p style={{...styles.link, textAlign: 'right', marginTop: '10px'}} onClick={() => {
        setForgotPasswordMode(true);
        setError('');
        setMessage('');
      }}>
        Forgot Password?
      </p>
      
      <p style={{...styles.link, marginTop: '20px', textDecoration: 'none', textAlign: 'center'}}>
        <Link to="/signup" style={styles.link}>
            Need an account? Sign Up
        </Link>
      </p>
    </form>
  );

  const renderForgotPasswordForm = () => (
    <form onSubmit={handlePasswordReset} style={styles.form}>
      <p style={styles.resetInfo}>
        Enter your registered email address below. We'll send you a link to reset your password.
      </p>
      <label htmlFor="email-reset" style={styles.label}>Email</label>
      <input
        id="email-reset"
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={styles.input}
        disabled={loading}
      />

      <button type="submit" disabled={loading} style={styles.button}>
        {loading ? 'Sending Link...' : 'Send Reset Email'}
      </button>

      <p style={{...styles.link, textAlign: 'center', marginTop: '20px'}} onClick={() => {
        setForgotPasswordMode(false);
        setError('');
        setMessage('');
      }}>
        Back to Login
      </p>
    </form>
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>
        {forgotPasswordMode ? 'Reset Password' : 'Welcome Back'}
      </h2>
      <p style={styles.subtitle}>
        {forgotPasswordMode ? 'Enter your email' : 'Please log in to your account.'}
      </p>
      
      {error && <p style={styles.errorMessage}>❌ {error}</p>}
      {message && <p style={styles.successMessage}>✅ {message}</p>}

      {forgotPasswordMode ? renderForgotPasswordForm() : renderLoginForm()}
    </div>
  );
}

// UPDATED STYLES FOR DARK GLASSPMORPHISM + MESH TEXTURE
const styles = {
    container: {
        maxWidth: '400px',
        margin: '50px auto', 
        padding: '30px', 
        borderRadius: '16px', 
        // Glassmorphism effects - DARK
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dark transparent background
        border: '1px solid rgba(255, 255, 255, 0.5)', // Light border
        backdropFilter: 'blur(10px)', 
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6)', 
        
        // Mesh Texture (Subtle white grid on dark card)
        backgroundImage: `
            repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 10px),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 10px)
        `,
        backgroundSize: '10px 10px', 
        
        color: '#f0f0f0', 
    },
    header: {
        textAlign: 'center',
        color: '#ffffff', // White header
        marginBottom: '5px',
        fontSize: '1.8em',
        textShadow: '0 1px 3px rgba(0,0,0,0.4)',
    },
    subtitle: {
        textAlign: 'center',
        color: '#e9ecef', // Light subtitle
        marginBottom: '20px',
        fontSize: '1em',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
    },
    label: {
        marginBottom: '8px',
        fontWeight: '600', 
        color: '#f8f9fa', // Light gray label
        marginTop: '15px',
        fontSize: '0.9em',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
    },
    // Input Field Style (adjusted for dark card)
    input: {
        padding: '12px', 
        marginBottom: '15px',
        border: '1px solid rgba(255, 255, 255, 0.5)', 
        borderRadius: '8px', 
        fontSize: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)', 
        color: '#ffffff', 
        transition: 'border-color 0.3s, background-color 0.3s',
        '::placeholder': { 
            color: 'rgba(255, 255, 255, 0.7)',
        },
    },
    passwordContainer: { 
        display: 'flex',
        marginBottom: '15px',
        position: 'relative',
    },
    passwordInput: {
        flexGrow: 1,
        padding: '12px',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        borderRadius: '8px',
        fontSize: '16px',
        paddingRight: '45px', 
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        color: '#ffffff',
        transition: 'border-color 0.3s, background-color 0.3s',
        '::placeholder': {
            color: 'rgba(255, 255, 255, 0.7)',
        },
    },
    // Toggle Button Style (adjusted for dark card)
    toggleButton: {
        position: 'absolute',
        right: '10px',
        top: '50%',
        transform: 'translateY(-50%)',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1em',
        color: 'rgba(255, 255, 255, 0.9)', 
        padding: '5px',
        zIndex: 10,
    },
    // Submit Button Style (adjusted for dark card contrast)
    button: {
        padding: '14px', 
        backgroundColor: 'rgba(0, 123, 255, 0.9)', // Solid blue for contrast
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '1.1em',
        fontWeight: 'bold',
        marginTop: '20px',
        transition: 'background-color 0.3s, transform 0.1s, border-color 0.3s',
        ':hover': {
            backgroundColor: 'rgba(0, 123, 255, 1)',
        }
    },
    errorMessage: {
        color: '#ffdddd', 
        backgroundColor: 'rgba(220, 53, 69, 0.7)', 
        padding: '10px',
        borderRadius: '4px',
        textAlign: 'center',
        marginTop: '15px',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
    },
    successMessage: {
        color: '#ddffdd', 
        backgroundColor: 'rgba(40, 167, 69, 0.7)', 
        padding: '10px',
        borderRadius: '4px',
        textAlign: 'center',
        marginTop: '15px',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
    },
    link: {
        display: 'block',
        color: '#87ceeb', // Light blue link
        cursor: 'pointer',
        textDecoration: 'none', 
        fontWeight: '600',
        fontSize: '0.9em',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
        ':hover': {
            textDecoration: 'underline',
        }
    },
    resetInfo: {
        fontSize: '0.9em',
        color: '#e9ecef',
        textAlign: 'center',
        marginBottom: '15px',
        padding: '0 10px',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
    }
};

export default Login;