// src/SignUp.jsx

import { useState } from 'react'; // 👈 REMOVED useEffect
import { supabase } from './supabaseClient'; 
import { Link, useNavigate } from 'react-router-dom';

// Component for user sign-up
function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  
  const navigate = useNavigate();

  // --- NAVIGATION GUARD LOGIC REMOVED ---
  // The logic is now in AuthGuard.jsx
  
  const handleSignUp = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    try {
      const { count: userCount, error: userCheckError } = await supabase
        .from('profiles')
        .select('username', { count: 'exact', head: true })
        .eq('username', username);

      if (userCheckError) {
        throw new Error(`Error checking for username: ${userCheckError.message}`);
      }

      if (userCount > 0) {
        throw new Error('This username is already taken. Please choose another.');
      }

      const { count: adminCount, error: adminError } = await supabase
        .from('profiles')
        .select('role', { count: 'exact', head: true })
        .eq('role', 'admin');

      if (adminError) {
        throw new Error(`Error checking for admin status: ${adminError.message}`);
      }

      const role = (adminCount === 0) ? 'admin' : 'user'; 

      if (adminCount > 0 && role === 'admin') {
          throw new Error('A severe application error occurred during sign-up. Please try again or contact support.');
      }
      

      const { data: userData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            role: role,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('User already registered')) {
            setError('Account creation failed. An account with this email may already exist.');
        } else if (signUpError.message.includes('Database error saving new user')) {
            setError('Account creation failed: Database error saving new user. Please check your username.');
        } else {
            setError('Account creation failed. Please try again.');
        }
        return; 
      }
      
      if (userData.user && !userData.user.identities) {
        setMessage(`Registration successful! A confirmation link has been sent to **${email}**. Please confirm your email before attempting to log in.`);
        
        setTimeout(() => {
            navigate('/login');
        }, 3000);

        setEmail('');
        setPassword('');
        setUsername('');
      } 

    } catch (err) {
      console.error(err);
      const genericError = err.message.includes('username is already taken') ? 
          'Account creation failed. Please check your details and try again.' : 
          (err.message || 'An unexpected error occurred during sign-up.');
          
      setError(genericError);
    } finally {
      setIsLoading(false);
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Create an Account</h2>
      <form onSubmit={handleSignUp} style={styles.form}>
        
        <label htmlFor="username" style={styles.label}>Username</label>
        <input
          id="username"
          type="text"
          placeholder="Enter a unique username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={styles.standardInput}
          disabled={isLoading}
        />

        <label htmlFor="email" style={styles.label}>Email</label>
        <input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.standardInput}
          disabled={isLoading}
        />

        <label htmlFor="password" style={styles.label}>Password</label>
        <div style={styles.passwordContainer}> 
          <input
            id="password"
            type={showPassword ? 'text' : 'password'} 
            placeholder="Must be at least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={styles.passwordInput}
            disabled={isLoading}
          />
          <button 
            type="button" 
            onClick={togglePasswordVisibility} 
            style={styles.toggleButton}
            disabled={isLoading}
          >
            {showPassword ? '👁️' : '🔒'} 
          </button>
        </div>

        <button type="submit" disabled={isLoading} style={styles.button}>
          {isLoading ? 'Signing Up...' : 'Sign Up'}
        </button>

      </form>

      {error && <p style={styles.errorMessage}>❌ {error}</p>}
      {message && <p style={styles.successMessage}>✅ {message}</p>}

      <p style={styles.footer}>
        Already have an account? <Link to="/login" style={styles.link}>Log In</Link>
      </p>
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
    standardInput: { 
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
        backgroundColor: '#4CAF50',
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
    footer: {
        textAlign: 'center',
        marginTop: '20px',
        fontSize: '14px',
    },
    link: { 
        color: '#007BFF',
        cursor: 'pointer',
        textDecoration: 'underline',
    }
};

export default SignUp;