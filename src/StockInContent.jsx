// src/StockInContent.jsx

import React, { useState } from 'react';
import { supabase } from './supabaseClient';

const StockInContent = ({ onImportSuccess }) => {
    const [formData, setFormData] = useState({
        brand: '',
        description: '',
        quantity: 0,
        price: 0.00,
        price_per_pack: 0.00, 
        date_of_import: new Date().toISOString().substring(0, 10),
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // FIX 1: Treat empty strings from numeric inputs as '0' in state
        let newValue = value;
        if (name === 'quantity' || name === 'price' || name === 'price_per_pack') {
            // If the user clears the field, store '0' in state, not ""
            newValue = value === '' ? '0' : value; 
        }
        
        setFormData(prev => ({ ...prev, [name]: newValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setLoading(true);

        const newQuantity = parseInt(formData.quantity);
        
        // Helper function to correctly convert input value to a number or JS null.
        const parsePrice = (value) => {
            const parsed = parseFloat(value);
            // Returns JS null if NaN or less than or equal to 0, otherwise returns the number
            return (isNaN(parsed) || parsed <= 0) ? null : parsed;
        };
        
        // Calculate the values to be sent to Supabase
        const dbPrice = parsePrice(formData.price);
        const dbPricePerPack = parsePrice(formData.price_per_pack);
        
        const importDate = formData.date_of_import;
        
        // CRITICAL VALIDATION 
        if (newQuantity <= 0) {
            setMessage({ type: 'error', text: 'Quantity must be greater than zero.' });
            setLoading(false);
            return;
        }
        if (dbPrice === null && dbPricePerPack === null) {
            setMessage({ type: 'error', text: 'You must provide a Price (per unit) or a Price (per pack).' });
            setLoading(false);
            return;
        }
        
        // --- PREPARE PAYLOAD OBJECT ---
        // This ensures no "null" value is passed if the input is meant to be optional, 
        // preventing the stringification bug.
        const preparePayload = (price, pricePerPack) => {
            const payload = {
                brand: formData.brand,
                description: formData.description,
                quantity: newQuantity,
                date_of_import: importDate,
            };

            if (price !== null) {
                payload.price = price;
            }
            if (pricePerPack !== null) {
                payload.price_per_pack = pricePerPack;
            }
            return payload;
        };
        
        try {
            // 2. Search for existing item with matching Brand, Description, and Price (Unit Price)
            let query = supabase
                .from('inventory')
                .select('id, quantity')
                .eq('brand', formData.brand)
                .eq('description', formData.description)
                .limit(1);

            // FIX A: Conditional price check using 'is' for null and 'eq' for numbers
            if (dbPrice === null) {
                // Use 'is' operator for checking NULL values in the database
                query = query.is('price', null); 
            } else {
                // Use 'eq' operator for checking explicit numeric values
                query = query.eq('price', dbPrice);
            }

            const { data: existingItems, error: searchError } = await query;

            if (searchError) throw searchError;

            // Decision: Merge ONLY if an item is found AND a unit price was provided (dbPrice !== null)
            if (existingItems && existingItems.length > 0 && dbPrice !== null) {
                // --- 3. UPDATE LOGIC (Merge) ---
                const existingItem = existingItems[0];
                const updatedQuantity = existingItem.quantity + newQuantity;
                
                // Prepare update payload for only the fields that change
                const updatePayload = {
                    quantity: updatedQuantity,
                    date_of_import: importDate, 
                };

                // Add price_per_pack ONLY if it's explicitly set (dbPricePerPack !== null)
                if (dbPricePerPack !== null) {
                    updatePayload.price_per_pack = dbPricePerPack;
                }

                const { error: updateError } = await supabase
                    .from('inventory')
                    .update(updatePayload) // Use the filtered updatePayload
                    .eq('id', existingItem.id);

                if (updateError) throw updateError;

                setMessage({ type: 'success', text: `Stock merged successfully! New quantity: ${updatedQuantity}` });
            } else {
                // --- 4. INSERT LOGIC (New Item) ---
                
                // Prepare the filtered insert payload
                const insertPayload = preparePayload(dbPrice, dbPricePerPack);
                
                const { error: insertError } = await supabase
                    .from('inventory')
                    .insert([insertPayload]); // Use the filtered insertPayload
                
                if (insertError) throw insertError;

                setMessage({ type: 'success', text: 'New stock recorded successfully!' });
            }

            // Reset form fields
            setFormData({
                brand: '',
                description: '',
                quantity: 0,
                price: 0.00,
                price_per_pack: 0.00, 
                date_of_import: new Date().toISOString().substring(0, 10),
            });
            
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
                    <label style={styles.label}>Price (per unit) - Optional</label>
                    <input 
                        type="number" 
                        name="price" 
                        // FIX 2: If state value is 0 or '0', display empty string 
                        value={formData.price === 0 || formData.price === '0' ? '' : formData.price} 
                        onChange={handleChange} 
                        min="0" 
                        step="0.01" 
                        style={styles.input} 
                        disabled={loading} 
                        placeholder="Leave blank or 0 if N/A"
                    />
                </div>

                <div style={styles.inputGroup}>
                    <label style={styles.label}>Price (per pack) - Optional</label>
                    <input 
                        type="number" 
                        name="price_per_pack" 
                        // FIX 2: If state value is 0 or '0', display empty string
                        value={formData.price_per_pack === 0 || formData.price_per_pack === '0' ? '' : formData.price_per_pack} 
                        onChange={handleChange}
                        min="0" 
                        step="0.01" 
                        style={styles.input} 
                        disabled={loading} 
                        placeholder="Leave blank or 0 if N/A"
                    />
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