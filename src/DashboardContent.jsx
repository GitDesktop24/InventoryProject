// src/DashboardContent.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

const DashboardContent = () => {
    const [inventory, setInventory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null); 
    const [editFormData, setEditFormData] = useState({}); 

    // --- DATA FETCHING AND REALTIME ---

    // Extracted fetch function using useCallback for stability
    const fetchData = useCallback(async () => {
        const { data, error } = await supabase
            .from('inventory')
            .select('id, brand, description, quantity, price, date_of_import');

        if (error) {
            console.error("Error fetching inventory:", error);
            alert("Failed to load inventory data.");
        } else {
            setInventory(data);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        setLoading(true);

        const inventorySubscription = supabase
            .channel('inventory-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, payload => {
                fetchData(); 
            })
            .subscribe();

        fetchData();
        
        return () => {
            supabase.removeChannel(inventorySubscription);
        };
    }, [fetchData]);
    
    // --- EDITING LOGIC ---
    
    const handleEditClick = (item) => {
        setEditingId(item.id);
        setEditFormData({
            brand: item.brand,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            date_of_import: item.date_of_import,
        });
    };

    // Update form state during editing
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    // *** SAVE FUNCTION ***
    const handleSaveEdit = async (id) => {
        setLoading(true);
        
        if (!editFormData.brand || !editFormData.description || isNaN(parseInt(editFormData.quantity)) || isNaN(parseFloat(editFormData.price))) {
             alert("Please ensure all fields are correctly filled.");
             setLoading(false);
             return;
        }

        const { error } = await supabase
            .from('inventory')
            .update({
                brand: editFormData.brand,
                description: editFormData.description,
                quantity: parseInt(editFormData.quantity), 
                price: parseFloat(editFormData.price),     
                date_of_import: editFormData.date_of_import,
            })
            .eq('id', id);

        if (error) {
            console.error("Update error:", error);
            alert(`Failed to save changes: ${error.message}. Check RLS policies.`);
        } else {
            setEditingId(null); 
            // GUARANTEED REFRESH
            await fetchData(); 
        }
        setLoading(false);
    };

    // Delete item from Supabase
    const handleDeleteClick = async (id) => {
        if (!window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
            return;
        }

        setLoading(true);
        const { error } = await supabase
            .from('inventory')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Delete error:", error);
            alert(`Failed to delete item: ${error.message}. Check RLS policies.`);
        } else {
            // GUARANTEED REFRESH
            await fetchData(); 
        }
        setLoading(false);
    };


    // --- FILTERING AND RENDERING --- 
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
            return <tr><td colSpan="6" style={styles.loadingCell}>Loading inventory...</td></tr>;
        }
        if (filteredInventory.length === 0) {
            return <tr><td colSpan="6" style={styles.loadingCell}>No inventory items found.</td></tr>;
        }

        return filteredInventory.map((item, index) => (
            <tr key={item.id || index} style={styles.tableRow}>
                {editingId === item.id ? (
                    <>
                        {/* FIX: Added id attribute to inputs to resolve console warning */}
                        <td style={styles.tableCell}><input id="edit-brand" type="text" name="brand" value={editFormData.brand} onChange={handleEditChange} style={styles.editInput} /></td>
                        <td style={styles.tableCell}><input id="edit-description" type="text" name="description" value={editFormData.description} onChange={handleEditChange} style={styles.editInput} /></td>
                        <td style={styles.tableCell}><input id="edit-quantity" type="number" name="quantity" value={editFormData.quantity} onChange={handleEditChange} style={styles.editInput} /></td>
                        <td style={styles.tableCell}>₱<input id="edit-price" type="number" name="price" value={editFormData.price} onChange={handleEditChange} step="0.01" style={styles.editInput} /></td>
                        <td style={styles.tableCell}><input id="edit-date" type="date" name="date_of_import" value={editFormData.date_of_import} onChange={handleEditChange} style={styles.editInput} /></td>
                        <td style={styles.actionCellStyle}>
                            <button onClick={() => handleSaveEdit(item.id)} style={{...styles.actionButton, backgroundColor: '#28a745'}}>Save</button>
                            <button onClick={() => setEditingId(null)} style={styles.actionButton}>Cancel</button>
                        </td>
                    </>
                ) : (
                    <>
                        <td style={styles.tableCell}>{item.brand}</td>
                        <td style={styles.tableCell}>{item.description}</td>
                        <td style={styles.tableCell}>{item.quantity}</td>
                        <td style={styles.tableCell}>₱{parseFloat(item.price).toFixed(2)}</td>
                        <td style={styles.tableCell}>{new Date(item.date_of_import).toLocaleDateString()}</td>
                        <td style={styles.actionCellStyle}>
                            <button onClick={() => handleEditClick(item)} style={{...styles.actionButton, backgroundColor: '#007bff'}}>Edit</button>
                            <button onClick={() => handleDeleteClick(item.id)} style={{...styles.actionButton, backgroundColor: '#dc3545'}}>Delete</button>
                        </td>
                    </>
                )}
            </tr>
        ));
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Inventory Dashboard</h1>
            
            <div style={styles.searchWrapper}> 
                <input
                    type="text"
                    placeholder="Search by Brand, or Description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                />
            </div>

            <div style={styles.tableWrapper}>
                <table style={styles.getInventoryTableStyle()}>
                    <thead>
                        <tr style={styles.tableHeaderRow}>
                            <th style={styles.tableHeader}>Brand</th>
                            <th style={styles.tableHeader}>Description</th>
                            <th style={styles.tableHeader}>Quantity</th>
                            <th style={styles.tableHeader}>Price</th>
                            <th style={styles.tableHeader}>Date of Import</th>
                            <th style={styles.actionHeaderStyle}>Actions</th> 
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
    actionHeaderStyle: {
        padding: '12px 10px',
        borderBottom: '2px solid #dee2e6',
        color: '#495057',
        textAlign: 'center',
        width: '1%',
        whiteSpace: 'nowrap',
    },
    tableRow: {
        borderBottom: '1px solid #dee2e6',
    },
    tableCell: {
        padding: '12px 15px',
        color: '#333',
    },
    actionCellStyle: {
        padding: '10px 5px',
        color: '#333',
        textAlign: 'center',
        whiteSpace: 'nowrap',
    },
    editInput: {
        width: '100%',
        padding: '5px',
        border: '1px solid #ccc',
        borderRadius: '3px',
        boxSizing: 'border-box',
    },
    actionButton: {
        padding: '6px 10px',
        marginRight: '5px',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        cursor: 'pointer',
        fontSize: '0.85em',
    },
    loadingCell: {
        textAlign: 'center',
        padding: '20px',
        color: '#6c757d',
    }
};

export default DashboardContent;