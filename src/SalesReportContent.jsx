// src/SalesReportContent.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const SalesReportContent = () => {
    const [reportType, setReportType] = useState('Weekly');
    const [trendData, setTrendData] = useState([]);
    const [loading, setLoading] = useState(false);

    // --- Core Logic: Fetch and Aggregate Sales Data --- (UNCHANGED)
    useEffect(() => {
        fetchProductTrends(reportType);
    }, [reportType]);

    const fetchProductTrends = async (period) => {
        setLoading(true);
        setTrendData([]);

        const today = new Date();
        let startDate;
        if (period === 'Weekly') {
            startDate = new Date(today.setDate(today.getDate() - 7)).toISOString();
        } else { // Monthly
            startDate = new Date(today.setDate(today.getDate() - 30)).toISOString();
        }

        const { data: sales, error } = await supabase
            .from('sales') 
            .select(`
                quantity_sold, 
                sale_date,
                product_id,
                inventory (description)
            `)
            .gte('sale_date', startDate)
            .limit(1000);

        if (error) {
            console.error("Sales report error:", error);
            setLoading(false);
            return;
        }

        const aggregation = sales.reduce((acc, sale) => {
            const description = sale.inventory ? sale.inventory.description : 'Unknown Product';
            const quantity = sale.quantity_sold;
            
            if (!acc[description]) {
                acc[description] = 0;
            }
            acc[description] += quantity;
            return acc;
        }, {});

        const sortedTrend = Object.entries(aggregation)
            .map(([description, totalQuantity]) => ({
                description,
                totalQuantity,
            }))
            .sort((a, b) => b.totalQuantity - a.totalQuantity);

        setTrendData(sortedTrend);
        setLoading(false);
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Sales Report & Product Trends</h1>
            
            <div style={styles.buttonGroup}>
                <button 
                    onClick={() => setReportType('Weekly')} 
                    style={{...styles.reportButton, ...(reportType === 'Weekly' ? styles.activeButton : {})}}
                    disabled={loading}
                >
                    Weekly Report
                </button>
                <button 
                    onClick={() => setReportType('Monthly')} 
                    style={{...styles.reportButton, ...(reportType === 'Monthly' ? styles.activeButton : {})}}
                    disabled={loading}
                >
                    Monthly Report
                </button>
            </div>
            
            <h2 style={styles.trendHeader}>Product Trend Identifier ({reportType})</h2>

            {loading ? (
                <p style={styles.loading}>Generating report...</p>
            ) : (
                // UPDATED: Table Wrapper for horizontal scrolling
                <div style={styles.tableWrapper}>
                    <table style={styles.getReportTableStyle()}> {/* 👈 DYNAMIC STYLE */}
                        <thead>
                            <tr style={styles.tableHeaderRow}>
                                <th style={styles.tableHeader}>Rank</th>
                                <th style={styles.tableHeader}>Product Description</th>
                                <th style={{...styles.tableHeader, textAlign: 'right'}}>Total Units Sold</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trendData.length > 0 ? (
                                trendData.map((item, index) => (
                                    <tr key={index} style={styles.tableRow}>
                                        <td style={styles.tableCell}>#{index + 1}</td>
                                        <td style={styles.tableCell}>{item.description}</td>
                                        <td style={{...styles.tableCell, textAlign: 'right'}}>{item.totalQuantity}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="3" style={styles.loadingCell}>No sales data found for this period.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
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
        overflowX: 'hidden', // Ensure this container doesn't create extra scrollbar
    },
    header: {
        color: '#343a40',
        marginBottom: '30px',
        textAlign: 'center',
    },
    // Ensure button group adapts to mobile
    buttonGroup: {
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        marginBottom: '30px',
        
        [`@media (max-width: 400px)`]: {
            flexDirection: 'column',
            gap: '5px',
        },
    },
    reportButton: {
        padding: '10px 20px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        backgroundColor: '#f8f9fa',
        cursor: 'pointer',
        transition: 'all 0.3s',
        
        [`@media (max-width: 400px)`]: {
            width: '100%',
        },
    },
    activeButton: {
        backgroundColor: '#17a2b8',
        color: 'white',
        borderColor: '#17a2b8',
    },
    trendHeader: {
        textAlign: 'center',
        color: '#28a745',
        marginBottom: '20px',
    },
    loading: {
        textAlign: 'center',
        padding: '20px',
        color: '#6c757d',
    },
    // NEW/UPDATED Styles for responsive table
    tableWrapper: {
        overflowX: 'auto', // Allows horizontal scrolling
        WebkitOverflowScrolling: 'touch',
        width: '100%',
    },
    getReportTableStyle: () => ({
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
        
        [`@media (max-width: ${MOBILE_BREAKPOINT})`]: { 
            minWidth: '550px', // Smaller min-width needed as there are fewer columns
        },
        [`@media (min-width: ${MOBILE_BREAKPOINT})`]: {
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

export default SalesReportContent;