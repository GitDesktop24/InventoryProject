// src/AuthGuard.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

/**
 * A guard component to prevent logged-in users from accessing 
 * authentication routes (like /login and /signup).
 * * If a session is found, it immediately redirects the user to their dashboard.
 * If no session is found, it renders the child component (Login/SignUp).
 */
function AuthGuard({ children }) {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkSessionAndRedirect = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                // User is logged in. Fetch role to determine redirection path.
                const userId = session.user.id;
                const { data: profileData, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', userId)
                    .single();
                
                if (profileData && profileData.role === 'admin') {
                    // Redirect to admin page and replace history entry
                    navigate('/admin', { replace: true }); 
                } else {
                    // Redirect to main page and replace history entry
                    navigate('/main', { replace: true });
                }
            } else {
                // User is NOT logged in. Allow rendering of child component (Login/SignUp).
                setIsAuthenticated(false);
                setIsLoading(false);
            }
        };

        checkSessionAndRedirect();
    }, [navigate, children]);

    // Show a blank screen while checking authentication status
    if (isLoading) {
        return <div style={{ textAlign: 'center', padding: '50px' }}>Checking session...</div>;
    }

    // If not authenticated, render the child component (Login or SignUp)
    return children;
}

export default AuthGuard;