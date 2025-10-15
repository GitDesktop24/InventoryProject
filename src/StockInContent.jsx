// src/StockInContent.jsx

import React, { useState } from 'react';
import { supabase } from './supabaseClient';

const StockInContent = ({ onImportSuccess }) => {
    const [formData, setFormData] = useState({
        brand: '',
        description: '',
        quantity: 0,
        price: 0.00,
        date_of_import: new Date().toISOString().substring(0, 10),
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setLoading(true);

        const newQuantity = parseInt(formData.quantity);
        const newPrice = parseFloat(formData.price);
        const importDate = formData.date_of_import;
        
        if (newQuantity <= 0 || isNaN(newPrice) || newPrice <= 0) {
            setMessage({ type: 'error', text: 'Quantity and Price must be greater than zero.' });
            setLoading(false);
            return;
        }

        try {
            // 1. Search for existing item with matching Brand, Description, and Price
            const { data: existingItems, error: searchError } = await supabase
                .from('inventory')
                .select('id, quantity')
                .eq('brand', formData.brand)
                .eq('description', formData.description)
                .eq('price', newPrice) // Price is now part of the matching criteria
                .limit(1);

            if (searchError) throw searchError;

            if (existingItems && existingItems.length > 0) {
                // --- 2. UPDATE LOGIC (Merge if item exists) ---
                const existingItem = existingItems[0];
                const updatedQuantity = existingItem.quantity + newQuantity;

                const { error: updateError } = await supabase
                    .from('inventory')
                    .update({ 
                        quantity: updatedQuantity,
                        date_of_import: importDate, // Update date to the current import date
                    })
                    .eq('id', existingItem.id);

                if (updateError) throw updateError;

                setMessage({ type: 'success', text: `Stock merged successfully! New quantity: ${updatedQuantity}` });
            } else {
                // --- 3. INSERT LOGIC (If no match found) ---
                const { error: insertError } = await supabase
                    .from('inventory')
                    .insert([{
                        brand: formData.brand,
                        description: formData.description,
                        quantity: newQuantity,
                        price: newPrice,
                        date_of_import: importDate,
                    }]);
                
                if (insertError) throw insertError;

                setMessage({ type: 'success', text: 'New stock recorded successfully!' });
            }

            // Reset form fields
            setFormData({
                brand: '',
                description: '',
                quantity: 0,
                price: 0.00,
                date_of_import: new Date().toISOString().substring(0, 10),
            });
            
            // Redirect to Dashboard
            if (onImportSuccess) {
                onImportSuccess(); 
            }

        } catch (error) {
            console.error("Stock In Error:", error);
            setMessage({ type: 'error', text: `An unexpected error occurred: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.getContainerStyle()}>
            <h1 style={styles.header}>Stock In (Import)</h1>
            <form onSubmit={handleSubmit} style={styles.form}>
                
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Brand</label>
                    <input type="text" name="brand" value={formData.brand} onChange={handleChange} required style={styles.input} disabled={loading} />
                </div>

                <div style={styles.inputGroup}>
                    <label style={styles.label}>Description</label>
                    <input type="text" name="description" value={formData.description} onChange={handleChange} required style={styles.input} disabled={loading} />
                </div>

                <div style={styles.inputGroup}>
                    <label style={styles.label}>Quantity</label>
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required min="1" style={styles.input} disabled={loading} />
                </div>

                <div style={styles.inputGroup}>
                    <label style={styles.label}>Price (per unit)</label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0.01" step="0.01" style={styles.input} disabled={loading} />
                </div>

                <div style={styles.inputGroup}>
                    <label style={styles.label}>Date of Import</label>
                    <input type="date" name="date_of_import" value={formData.date_of_import} onChange={handleChange} required style={styles.input} disabled={loading} />
                </div>

                <button type="submit" disabled={loading} style={styles.button}>
                    {loading ? 'Submitting...' : 'Record Stock Import'}
                </button>
            </form>

            {message.text && (
                <p style={{ ...styles.message, ...(message.type === 'error' ? styles.error : styles.success) }}>
                    {message.text}
                </p>
            )}
        </div>
    );
};

// Styles (UNCHANGED)
const styles = {
    getContainerStyle: () => ({
        width: '100%', 
        padding: '15px 10px', 
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        
        '@media (min-width: 600px)': {
             maxWidth: '600px',
             margin: '0 auto',
             padding: '20px', 
        }
    }),
    header: {
        color: '#343a40',
        marginBottom: '30px',
        textAlign: 'center',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
    },
    label: {
        fontWeight: 'bold',
        color: '#555',
        marginBottom: '5px',
    },
    input: {
        padding: '10px',
        border: '1px solid #ced4da',
        borderRadius: '5px',
        fontSize: '1em',
        width: '100%',
        boxSizing: 'border-box',
    },
    button: {
        padding: '12px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '1.1em',
        marginTop: '20px',
        transition: 'background-color 0.3s',
    },
    message: {
        padding: '10px',
        borderRadius: '5px',
        textAlign: 'center',
        marginTop: '20px',
        fontWeight: 'bold',
    },
    error: {
        backgroundColor: '#f8d7da',
        color: '#721c24',
        border: '1px solid #f5c6cb',
    },
    success: {
        backgroundColor: '#d4edda',
        color: '#155724',
        border: '1px solid #c3e6cb',
    }
};

export default StockInContent;