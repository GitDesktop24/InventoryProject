// src/AdminPage.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';       
import DashboardContent from './DashboardContent';
import StockInContent from './StockInContent';
import SalesReportContent from './SalesReportContent';
import ProfileDropdown from './ProfileDropdown';

import './AdminStyles.css'; 

function AdminPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState({ username: '', email: '' });
    const [activeSection, setActiveSection] = useState('Dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
    const [dashboardKey, setDashboardKey] = useState(0); 

    // --- SESSION GUARD & INITIAL DATA FETCH --- (UNCHANGED)
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
                .select('username, role')
                .eq('id', session.user.id)
                .single();
            
            if (profileError || !profileData || profileData.role !== 'admin') {
                console.error("Profile or role check failed:", profileError);
                await supabase.auth.signOut();
                navigate('/login', { replace: true });
                return;
            }

            setProfile({ 
                username: profileData.username, 
                email: session.user.email 
            });
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

    // --- Function to switch view and force dashboard refresh ---
    const handleImportSuccess = () => {
        setActiveSection('Dashboard');
        setDashboardKey(prevKey => prevKey + 1); 
    };

    // --- PROFILE / LOGOUT LOGIC ---
    const handleSaveUsername = async (newUsername) => {
        if (!user || newUsername === profile.username) return;

        const { count, error: countError } = await supabase
            .from('profiles')
            .select('username', { count: 'exact', head: true })
            .eq('username', newUsername);
        
        if (countError || count > 0) {
            alert('Username already taken or failed to check. Please choose a different one.');
            return;
        }

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
    
    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    // --- RENDER CONTENT BASED ON ACTIVE SECTION ---
    const renderContent = () => {
        switch (activeSection) {
            case 'Dashboard':
                return <DashboardContent key={dashboardKey} />; 
            case 'Stock In':
                return <StockInContent onImportSuccess={handleImportSuccess} />; 
            case 'Sales Report':
                return <SalesReportContent />;
            default:
                return <DashboardContent key={dashboardKey} />;
        }
    };

    // --- UI/STYLE LOGIC ---
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    if (loading) {
        return <div style={styles.loading}>Loading Admin Dashboard...</div>;
    }

    return (
        <div className="app-container">
            {/* 1. SIDEBAR */}
            <Sidebar 
                activeSection={activeSection} 
                setActiveSection={(section) => {
                    setActiveSection(section);
                    if (window.innerWidth < 768) {
                        setIsSidebarOpen(false);
                    }
                }} 
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
            />

            {/* 2. MAIN CONTENT AREA */}
            <div style={styles.getMainContentStyle(isSidebarOpen)}>
                
                {/* 2a. TOP BAR */}
                <div className="top-bar">
                    <button onClick={toggleSidebar} className="burger-button">
                        {isSidebarOpen ? '✕' : '☰'}
                    </button>
                    
                    <h1 className="page-title">{activeSection}</h1>
                    <ProfileDropdown 
                        profile={profile} 
                        handleSaveUsername={handleSaveUsername} 
                        handleSignOut={handleSignOut} 
                    />
                </div>
                
                {/* 2b. Active Section Content */}
                <div className="content-area-wrapper">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}

const SIDEBAR_WIDTH = '250px';

const styles = {
    // ONLY handles the dynamic margin-left transition for desktop
    getMainContentStyle: (isOpen) => ({
        flexGrow: 1,
        minHeight: '100vh',
        padding: '20px', 
        marginLeft: isOpen ? SIDEBAR_WIDTH : '0', 
        transition: 'margin-left 0.3s ease', 
    }),
    loading: {
        textAlign: 'center',
        padding: '50px',
        fontSize: '1.2em',
        color: '#999',
    }
};

export default AdminPage;