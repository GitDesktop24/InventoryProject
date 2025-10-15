// src/UserDashboardContent.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

const UserDashboardContent = () => {
    const [inventory, setInventory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // --- DATA FETCHING AND REALTIME ---
    const fetchData = useCallback(async () => {
        const { data, error } = await supabase
            .from('inventory')
            // Fetch necessary data but NOT the 'id' since no editing is allowed
            .select('brand, description, quantity, price, date_of_import');

        if (error) {
            console.error("Error fetching inventory:", error);
        } else {
            setInventory(data);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchData();
        
        // No need for a Realtime listener, as end users typically don't need instant updates
        // from admin actions for simple viewing, but if desired, it could be added here.
    }, [fetchData]);

    // --- FILTERING ---
    const filteredInventory = inventory.filter(item => {
        const searchString = searchTerm.toLowerCase();
        return (
            item.brand?.toLowerCase().includes(searchString) ||
            item.description?.toLowerCase().includes(searchString) ||
            item.date_of_import?.toString().includes(searchString)
        );
    });

    // Render Table Rows 
    const renderTableRows = () => {
        if (loading && inventory.length === 0) {
            return <tr><td colSpan="5" style={styles.loadingCell}>Loading inventory...</td></tr>;
        }
        if (filteredInventory.length === 0) {
            return <tr><td colSpan="5" style={styles.loadingCell}>No inventory items found.</td></tr>;
        }

        return filteredInventory.map((item, index) => (
            <tr key={index} style={styles.tableRow}>
                <td style={styles.tableCell}>{item.brand}</td>
                <td style={styles.tableCell}>{item.description}</td>
                <td style={styles.tableCell}>{item.quantity}</td>
                <td style={styles.tableCell}>₱{parseFloat(item.price).toFixed(2)}</td>
                <td style={styles.tableCell}>{new Date(item.date_of_import).toLocaleDateString()}</td>
            </tr>
        ));
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Inventory View</h1>
            
            {/* Search Engine */}
            <div style={styles.searchWrapper}> 
                <input
                    type="text"
                    placeholder="Search by Brand, or Description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                />
            </div>

            {/* Inventory List View */}
            <div style={styles.tableWrapper}>
                <table style={styles.getInventoryTableStyle()}>
                    <thead>
                        <tr style={styles.tableHeaderRow}>
                            <th style={styles.tableHeader}>Brand</th>
                            <th style={styles.tableHeader}>Description</th>
                            <th style={styles.tableHeader}>Quantity</th>
                            <th style={styles.tableHeader}>Price</th>
                            <th style={styles.tableHeader}>Date of Import</th>
                        </tr>
                    </thead>
                    <tbody>
                        {renderTableRows()}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const MOBILE_BREAKPOINT = '768px';

const styles = {
    container: {
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        overflowX: 'hidden', 
    },
    header: {
        color: '#343a40',
        marginBottom: '20px',
    },
    searchWrapper: {
        width: '100%',
        maxWidth: '500px',
        marginBottom: '20px',
    },
    searchInput: {
        width: '100%',
        padding: '10px',
        border: '1px solid #ced4da',
        borderRadius: '5px',
        fontSize: '1em',
    },
    tableWrapper: {
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        width: '100%',
    },
    getInventoryTableStyle: () => ({
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
        
        // Dynamic min-width for mobile scroll (fewer columns means less min-width needed)
        '@media (max-width: 768px)': { 
            minWidth: '550px', 
        },
        '@media (min-width: 769px)': {
            minWidth: '100%',
        },
    }),
    tableHeaderRow: {
        backgroundColor: '#e9ecef',
    },
    tableHeader: {
        padding: '12px 15px',
        borderBottom: '2px solid #dee2e6',
        color: '#495057',
        textAlign: 'left', 
    },
    tableRow: {
        borderBottom: '1px solid #dee2e6',
    },
    tableCell: {
        padding: '12px 15px',
        color: '#333',
    },
    loadingCell: {
        textAlign: 'center',
        padding: '20px',
        color: '#6c757d',
    }
};

export default UserDashboardContent;