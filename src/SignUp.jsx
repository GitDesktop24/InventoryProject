// src/SignUp.jsx

import { useState } from 'react';
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

  // --- LOGIC (UNCHANGED) ---
  
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
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6)', // Darker shadow
        
        // Mesh Texture (Subtle white grid on dark card)
        backgroundImage: `
            repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 10px),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 10px)
        `,
        backgroundSize: '10px 10px', 
    },
    header: {
        textAlign: 'center',
        color: '#ffffff', // White header
        marginBottom: '20px',
        fontSize: '1.8em',
        textShadow: '0 1px 3px rgba(0,0,0,0.4)', 
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
    // Standard Input Field Style (adjusted for dark card)
    standardInput: { 
        padding: '12px', 
        marginBottom: '15px',
        border: '1px solid rgba(255, 255, 255, 0.5)', 
        borderRadius: '8px', 
        fontSize: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Very light transparent background
        color: '#ffffff', // White input text
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
        color: 'rgba(255, 255, 255, 0.9)', // White icon
        padding: '5px',
        zIndex: 10,
    },
    // Submit Button Style (adjusted for dark card contrast)
    button: {
        padding: '14px', 
        backgroundColor: 'rgba(40, 167, 69, 0.9)', // Solid green for contrast
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '1.1em',
        fontWeight: 'bold',
        marginTop: '20px',
        transition: 'background-color 0.3s, transform 0.1s, border-color 0.3s',
        ':hover': {
            backgroundColor: 'rgba(40, 167, 69, 1)', 
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
    footer: {
        textAlign: 'center',
        marginTop: '30px',
        fontSize: '0.9em',
        color: '#e9ecef', // Light footer text
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
    },
    link: { 
        color: '#87ceeb', 
        cursor: 'pointer',
        textDecoration: 'none', 
        fontWeight: '600',
    }
};

export default SignUp;