// src/MainPage.jsx

import React, { useEffect, useState } from 'react'; // 👈 IMPORT useEffect
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

function MainPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // --- SESSION GUARD ---
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                // If no session exists, redirect to login
                navigate('/login', { replace: true });
                return;
            }

            // Authentication passed
            setLoading(false);
        };

        checkAuth();
        
        // Setup listener for auth state changes
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                navigate('/login', { replace: true });
            }
        });

        // Cleanup listener on unmount
        return () => {
             authListener.subscription.unsubscribe();
        };
    }, [navigate]);

    // --- LOGOUT FUNCTION ---
    const handleSignOut = async () => {
        // Clear the session key
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Logout Error:", error.message);
        }
        // Redirect here for fast UX
        navigate('/login', { replace: true });
    };

    if (loading) {
        return <div style={styles.loading}>Loading User Page...</div>;
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>User Main Page (Role: user)</h1>
            <p style={styles.message}>
                Welcome! This is your personalized main page.
            </p>
            <button onClick={handleSignOut} style={styles.button}>
                Log Out
            </button>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: '800px',
        margin: '50px auto',
        padding: '30px',
        border: '1px solid #e0e0e0',
        borderRadius: '10px',
        boxShadow: '0 8px 16px rgba(0,0,0,0.05)',
        backgroundColor: '#f9f9f9',
        textAlign: 'center',
    },
    header: {
        color: '#5cb85c',
        marginBottom: '20px',
    },
    message: {
        fontSize: '1.1em',
        color: '#555',
        marginBottom: '30px',
    },
    button: {
        padding: '10px 20px',
        backgroundColor: '#5cb85c',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
    },
    loading: {
        textAlign: 'center',
        padding: '50px',
        fontSize: '1.2em',
        color: '#999',
    }
};

export default MainPage;