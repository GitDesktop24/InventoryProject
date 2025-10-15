// src/Login.jsx

import { useState } from 'react'; // 👈 REMOVED useEffect
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

  // --- NAVIGATION GUARD LOGIC REMOVED ---
  // The logic is now in AuthGuard.jsx

  // --- Sign In Logic (UNCHANGED) ---
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

  // --- Forgot Password Logic (UNCHANGED) ---
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
  
  // Toggle function (UNCHANGED)
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

      <p style={styles.link} onClick={() => {
        setForgotPasswordMode(true);
        setError('');
        setMessage('');
      }}>
        Forgot Password?
      </p>
      
      <p style={{...styles.link, marginTop: '20px', textDecoration: 'none'}}>
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

      <p style={styles.link} onClick={() => {
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
        {forgotPasswordMode ? 'Reset Password' : 'Please Log In Your Account'}
      </h2>
      
      {error && <p style={styles.errorMessage}>❌ {error}</p>}
      {message && <p style={styles.successMessage}>✅ {message}</p>}

      {forgotPasswordMode ? renderForgotPasswordForm() : renderLoginForm()}
    </div>
  );
}

// Styles (UNCHANGED)
const styles = {
    container: {
        maxWidth: '400px',
        margin: '50px auto',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
    },
    header: {
        textAlign: 'center',
        color: '#333',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
    },
    label: {
        marginBottom: '5px',
        fontWeight: 'bold',
        color: '#555',
        marginTop: '10px',
    },
    input: {
        padding: '10px',
        marginBottom: '15px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '16px',
    },
    passwordContainer: { 
        display: 'flex',
        marginBottom: '15px',
        position: 'relative',
    },
    passwordInput: {
        flexGrow: 1,
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '16px',
        paddingRight: '40px',
    },
    toggleButton: {
        position: 'absolute',
        right: '5px',
        top: '50%',
        transform: 'translateY(-50%)',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontSize: '18px',
        padding: '5px',
        zIndex: 10,
    },
    button: {
        padding: '12px',
        backgroundColor: '#007BFF',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        marginTop: '10px',
    },
    errorMessage: {
        color: 'red',
        textAlign: 'center',
        marginTop: '15px',
    },
    successMessage: {
        color: 'green',
        textAlign: 'center',
        marginTop: '15px',
    },
    link: {
        textAlign: 'center',
        marginTop: '10px',
        color: '#007BFF',
        cursor: 'pointer',
        textDecoration: 'underline',
    },
    resetInfo: {
        fontSize: '0.9em',
        color: '#666',
        textAlign: 'center',
        marginBottom: '15px',
    }
};

export default Login;