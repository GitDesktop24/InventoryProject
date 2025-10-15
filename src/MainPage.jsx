// src/MainPage.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';
import UserDashboardContent from './UserDashboardContent'; 
import UserDropdown from './UserDropdown';             

// NOTE: Assumes AdminStyles.css is linked in main App.jsx

function MainPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState({ username: '', email: '' });

    // --- SESSION GUARD & INITIAL DATA FETCH ---
    useEffect(() => {
        const checkAuthAndFetchProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                navigate('/login', { replace: true });
                return;
            }
            
            setUser(session.user);

            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('username') 
                .eq('id', session.user.id)
                .single();
            
            if (profileError || !profileData) {
                console.error("Profile fetch error:", profileError);
                setProfile({ username: 'User', email: session.user.email }); 
            } else {
                 setProfile({ 
                    username: profileData.username, 
                    email: session.user.email 
                });
            }

            setLoading(false);
        };

        checkAuthAndFetchProfile();
        
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                navigate('/login', { replace: true });
            }
        });

        return () => {
             authListener.subscription.unsubscribe();
        };
    }, [navigate]);

    // --- USERNAME EDIT LOGIC ---
    const handleSaveUsername = async (newUsername) => {
        if (!user || newUsername === profile.username) return;

        // 1. Check if the new username is already taken
        const { count, error: countError } = await supabase
            .from('profiles')
            .select('username', { count: 'exact', head: true })
            .eq('username', newUsername);
        
        if (countError || count > 0) {
            alert('Username already taken or failed to check. Please choose a different one.');
            return;
        }

        // 2. Update username in profiles table
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ username: newUsername })
            .eq('id', user.id);

        if (updateError) {
            console.error("Username update error:", updateError);
            alert('Failed to update username.');
        } else {
            setProfile(prev => ({ ...prev, username: newUsername }));
            alert('Username updated successfully!');
        }
    };
    
    // --- LOGOUT FUNCTION ---
    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    if (loading) {
        return <div style={styles.loading}>Loading User Page...</div>;
    }

    return (
        // Use standard structure for full responsiveness
        <div className="app-container" style={styles.mainPageContainer}> 
            
            {/* TOP BAR: Styled using .top-bar class for fixed/responsive header */}
            <div className="top-bar" style={styles.topBarOverride}> 
                <h1 className="page-title" style={styles.pageTitleOverride}>Dashboard</h1>
                <UserDropdown 
                    user={user}
                    profile={profile} 
                    setProfile={setProfile}
                    handleSaveUsername={handleSaveUsername} 
                    handleSignOut={handleSignOut} 
                />
            </div>

            {/* CONTENT AREA: Uses the responsive padding wrapper */}
            <div className="content-area-wrapper" style={styles.contentWrapper}>
                <UserDashboardContent />
            </div>
            
        </div>
    );
}

const styles = {
    // FIX 1: Ensure full vertical space is used and set column layout
    mainPageContainer: {
        flexDirection: 'column', 
        minHeight: '100vh',
        width: '100%',
        marginLeft: 0, // No sidebar, no margin
        padding: 0,
    },
    // FIX 2: Override the top bar alignment for the simple layout
    topBarOverride: {
        maxWidth: '1200px', 
        width: 'auto', 
        margin: '20px auto', // Center the top bar on desktop
        // Crucial: Use standard desktop padding, let .top-bar handle mobile
        padding: '15px 20px', 
    },
    // FIX 3: Ensure the title has proper spacing in the top bar
    pageTitleOverride: {
        flexGrow: 1, 
        fontSize: '1.8em',
    },
    // FIX 4: Center the content area on desktop
    contentWrapper: {
        maxWidth: '1200px', 
        margin: '0 auto', 
        flexGrow: 1,
        width: '100%',
    },
    loading: {
        textAlign: 'center',
        padding: '50px',
        fontSize: '1.2em',
        color: '#999',
    }
};

export default MainPage;