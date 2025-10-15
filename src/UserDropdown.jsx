// src/UserDropdown.jsx

import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

// Component to handle the modal popup for logout confirmation (reused style pattern)
const LogoutConfirmationModal = ({ onConfirm, onCancel }) => (
    <div style={modalStyles.backdrop}>
        <div style={modalStyles.modal}>
            <h3 style={modalStyles.header}>Confirm Logout</h3>
            <p>Are you sure you want to log out?</p>
            <div style={modalStyles.actions}>
                <button onClick={onCancel} style={modalStyles.cancelButton}>Cancel</button>
                <button onClick={onConfirm} style={modalStyles.confirmButton}>Confirm</button>
            </div>
        </div>
    </div>
);

const UserDropdown = ({ user, profile, setProfile, handleSaveUsername, handleSignOut }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [editingUsername, setEditingUsername] = useState(false);
    const [currentUsername, setCurrentUsername] = useState(profile.username);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const startEdit = () => {
        setEditingUsername(true);
        setCurrentUsername(profile.username);
    };

    const saveAndClose = () => {
        handleSaveUsername(currentUsername); // Pass new username up to MainPage
        setEditingUsername(false);
    };
    
    const startLogout = () => {
        setIsModalOpen(true);
        setIsOpen(false); 
    };

    return (
        <div style={styles.dropdownContainer}>
            <button onClick={toggleDropdown} style={styles.dropdownToggle}>
                {profile.username || 'User'}
                <span style={styles.dropdownIcon}>{isOpen ? '▲' : '▼'}</span>
            </button>
            
            {isOpen && (
                <div style={styles.dropdownMenu}>
                    <div style={styles.menuHeader}>
                        <strong style={{color: '#333'}}>Account Details</strong>
                    </div>
                    
                    {/* Username Edit Section */}
                    <div style={styles.menuItem}>
                        <strong>Username:</strong>
                        {editingUsername ? (
                            <input
                                type="text"
                                value={currentUsername}
                                onChange={(e) => setCurrentUsername(e.target.value)}
                                onBlur={saveAndClose}
                                style={styles.input}
                                autoFocus
                            />
                        ) : (
                            <span style={styles.value}>{profile.username}</span>
                        )}
                        <button onClick={startEdit} style={styles.editButton}>
                            {editingUsername ? '💾' : '✏️'}
                        </button>
                    </div>

                    {/* Email (Read-only) */}
                    <div style={styles.menuItem}>
                        <strong>Email:</strong>
                        <span style={styles.value}>{profile.email}</span>
                    </div>

                    <div style={styles.menuDivider}></div>
                    
                    {/* Logout Button */}
                    <button onClick={startLogout} style={styles.logoutButton}>
                        Log Out
                    </button>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            {isModalOpen && (
                <LogoutConfirmationModal 
                    onConfirm={() => {
                        handleSignOut(); 
                        setIsModalOpen(false);
                    }} 
                    onCancel={() => setIsModalOpen(false)} 
                />
            )}
        </div>
    );
};

const styles = {
    dropdownContainer: {
        position: 'relative',
        zIndex: 900,
        marginRight: '10px',
    },
    dropdownToggle: {
        padding: '8px 15px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #ced4da',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '1em',
        transition: 'background-color 0.2s',
    },
    dropdownIcon: {
        fontSize: '0.6em',
    },
    dropdownMenu: {
        position: 'absolute',
        top: '100%',
        right: 0,
        width: '250px',
        backgroundColor: '#ffffff',
        border: '1px solid #ced4da',
        borderRadius: '5px',
        boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
        padding: '10px 0',
        marginTop: '5px',
        display: 'flex',
        flexDirection: 'column',
    },
    menuHeader: {
        padding: '10px 15px',
        marginBottom: '5px',
        borderBottom: '1px solid #eee',
    },
    menuItem: {
        padding: '10px 15px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.9em',
        gap: '5px',
    },
    menuDivider: {
        height: '1px',
        backgroundColor: '#eee',
        margin: '5px 0',
    },
    input: {
        padding: '3px',
        border: '1px solid #ccc',
        borderRadius: '3px',
        width: '100px',
    },
    value: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '120px',
        fontWeight: 'normal',
    },
    editButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.9em',
    },
    logoutButton: {
        width: 'calc(100% - 30px)',
        margin: '0 15px 5px 15px',
        padding: '8px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
};

const modalStyles = {
    backdrop: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '10px',
        width: '300px',
        textAlign: 'center',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
    },
    header: {
        color: '#333',
        marginBottom: '15px',
    },
    actions: {
        marginTop: '20px',
        display: 'flex',
        justifyContent: 'space-around',
    },
    cancelButton: {
        padding: '10px 15px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        backgroundColor: '#f8f9fa',
        cursor: 'pointer',
    },
    confirmButton: {
        padding: '10px 15px',
        border: 'none',
        borderRadius: '5px',
        backgroundColor: '#dc3545',
        color: 'white',
        cursor: 'pointer',
    }
};

export default UserDropdown;