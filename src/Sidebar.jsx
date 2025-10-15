// src/Sidebar.jsx

import React from 'react';

const Sidebar = ({ activeSection, setActiveSection, isSidebarOpen, toggleSidebar }) => { 
    
    const sections = ['Dashboard', 'Stock In', 'Sales Report'];

    return (
        <div 
            className="sidebar"
            style={styles.getSidebarStyle(isSidebarOpen)}
        > 
            <div className="sidebar-top-section">
                <h2 style={styles.header}>Admin Panel</h2>
                <button onClick={toggleSidebar} className="sidebar-close-button">
                    ✕
                </button>
            </div>
            
            <nav style={styles.nav}>
                {sections.map(section => (
                    <button
                        key={section}
                        onClick={() => setActiveSection(section)}
                        style={{
                            ...styles.navItem,
                            ...(activeSection === section ? styles.activeNavItem : {})
                        }}
                    >
                        {section}
                    </button>
                ))}
            </nav>
        </div>
    );
};

const SIDEBAR_WIDTH = '250px';

const styles = {
    // Dynamic Sidebar Style function: ONLY handles the sliding transform
    getSidebarStyle: (isOpen) => ({
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
    }),
    header: {
        marginBottom: '0', 
        color: '#ffc107',
        fontSize: '1.5em',
        textAlign: 'center',
    },
    nav: {
        display: 'flex',
        flexDirection: 'column',
    },
    navItem: {
        display: 'block',
        padding: '15px 25px',
        textAlign: 'left',
        background: 'none',
        border: 'none',
        color: '#adb5bd',
        fontSize: '1.1em',
        cursor: 'pointer',
        transition: 'background-color 0.3s, color 0.3s',
        width: '100%',
    },
    activeNavItem: {
        backgroundColor: '#495057',
        color: 'white',
        borderLeft: '4px solid #ffc107',
    }
};

export default Sidebar;