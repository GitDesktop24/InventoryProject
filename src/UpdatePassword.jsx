// src/UpdatePassword.jsx

import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; 
import { useNavigate } from 'react-router-dom';

function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // On mount, check if a user is logged in via the reset flow session
  useEffect(() => {
    // Supabase automatically detects the password reset token in the URL
    // and sets a temporary session for the user, allowing them to update the password.
    // No manual token parsing is typically needed.
  }, []);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setLoading(false);
        return;
    }

    // This function updates the user's password in the current session.
    // The session is established when the user clicks the reset link in the email.
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        password: password
    });

    if (updateError) {
        setError(updateError.message || 'Failed to update password.');
    } else {
        setMessage('Password updated successfully! Redirecting to login...');
        
        // Clear password fields
        setPassword('');
        setConfirmPassword('');

        // Redirect to login page
        setTimeout(() => {
            navigate('/login');
        }, 3000);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Set New Password</h2>
      
      {error && <p style={styles.errorMessage}>❌ {error}</p>}
      {message && <p style={styles.successMessage}>✅ {message}</p>}

      <form onSubmit={handlePasswordUpdate} style={styles.form}>
        <label htmlFor="new-password" style={styles.label}>New Password</label>
        <input
          id="new-password"
          type="password"
          placeholder="Enter new password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={styles.input}
          disabled={loading}
        />

        <label htmlFor="confirm-password" style={styles.label}>Confirm New Password</label>
        <input
          id="confirm-password"
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          style={styles.input}
          disabled={loading}
        />

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}

// Basic styles (reused/simplified from Login.jsx)
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
    }
};

export default UpdatePassword;