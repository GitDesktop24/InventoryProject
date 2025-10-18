// src/SalesReportContent.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// --- CONFIGURATION ---
const TOP_N_PRODUCTS = 5; // Display the Top 5 products plus 'Other'
const NUM_MONTHS_REPORT = 6; // Display data for the last 6 months

// Preset colors for the slices
const CHART_COLORS = [
    '#FF6384', // Red/Pink
    '#36A2EB', // Blue
    '#FFCE56', // Yellow
    '#4BC0C0', // Cyan
    '#9966FF', // Purple
    '#FFA07A', // Light Salmon
    '#6B8E23', // Olive Drab
    '#DDA0DD', // Plum
    '#808080', // Gray
    '#98FB98', // Pale Green
    '#F08080', // Light Coral
    '#CCCCCC', // Light Gray (Fallback)
];

// --- DUMMY DATA GENERATION FUNCTION ---
const DUMMY_PRODUCT_NAMES = ['A. Ultra-Fast Glue', 'B. Heavy-Duty Tape', 'C. Standard Stapler', 'D. Premium Notebooks', 'E. Gel Pens (Pack)', 'F. Bulk Paper'];

const generateDummyData = () => {
    const dummySales = [];
    const today = new Date();
    
    for (let i = 0; i < 2000; i++) {
        const date = new Date(today);
        // Distribute sales over the last 6 months
        const monthOffset = Math.floor(Math.random() * NUM_MONTHS_REPORT);
        date.setMonth(today.getMonth() - monthOffset);
        
        let productName;
        if (i < 1500) { 
            productName = DUMMY_PRODUCT_NAMES[Math.floor(Math.random() * 3)]; // Bias top sellers
        } else {
            productName = DUMMY_PRODUCT_NAMES[Math.floor(Math.random() * DUMMY_PRODUCT_NAMES.length)];
        }

        dummySales.push({
            sale_date: date.toISOString(),
            description: productName,
            quantity_sold: Math.floor(Math.random() * 50) + 10,
        });
    }

    return dummySales;
};

// --- UTILITY 1: Aggregate by Month (for Chart 1) ---
const getMonthlySalesAnalysis = (sales) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyAggregation = {};
    
    sales.forEach(sale => {
        const date = new Date(sale.sale_date);
        const year = date.getFullYear();
        const monthIndex = date.getMonth();
        const key = `${monthNames[monthIndex]} ${year}`;

        if (!monthlyAggregation[key]) {
            monthlyAggregation[key] = 0;
        }
        monthlyAggregation[key] += sale.quantity_sold;
    });

    const sortedMonths = Object.entries(monthlyAggregation)
        .map(([label, totalQuantity]) => ({ label, totalQuantity }))
        // Sort by date key to ensure correct order
        .sort((a, b) => new Date(a.label.replace(/(\w{3}) (\d{4})/, '$1 1, $2')) - new Date(b.label.replace(/(\w{3}) (\d{4})/, '$1 1, $2')));

    const grandTotal = sortedMonths.reduce((sum, p) => sum + p.totalQuantity, 0);

    let dataForChart = sortedMonths.map((p, index) => ({
        ...p,
        description: p.label,
        percentage: (p.totalQuantity / grandTotal) * 100,
        color: CHART_COLORS[index % CHART_COLORS.length],
    }));

    return {
        data: dataForChart,
        grandTotal: grandTotal,
    };
};

// --- UTILITY 2: Aggregate by Product (for Chart 2) ---
const getProductShareAnalysis = (sales) => {
    const productAggregation = sales.reduce((acc, sale) => {
        // Use inventory description (assumes it was passed through or joined)
        const description = sale.description || (sale.inventory ? sale.inventory.description : 'Unknown Product');
        if (!acc[description]) {
            acc[description] = 0;
        }
        acc[description] += sale.quantity_sold;
        return acc;
    }, {});
    
    const sortedProducts = Object.entries(productAggregation)
        .map(([description, totalQuantity]) => ({
            description,
            totalQuantity,
        }))
        .sort((a, b) => b.totalQuantity - a.totalQuantity);
    
    const grandTotal = sortedProducts.reduce((sum, p) => sum + p.totalQuantity, 0);

    const topProducts = sortedProducts.slice(0, TOP_N_PRODUCTS);
    const otherProducts = sortedProducts.slice(TOP_N_PRODUCTS);

    let dataForChart = topProducts.map((p, index) => ({
        ...p,
        percentage: (p.totalQuantity / grandTotal) * 100,
        color: CHART_COLORS[index % CHART_COLORS.length],
    }));

    if (otherProducts.length > 0) {
        const otherTotal = otherProducts.reduce((sum, p) => sum + p.totalQuantity, 0);
        dataForChart.push({
            description: `Other (${otherProducts.length} items)`,
            totalQuantity: otherTotal,
            percentage: (otherTotal / grandTotal) * 100,
            color: CHART_COLORS[TOP_N_PRODUCTS] || '#CCCCCC', 
        });
    }

    dataForChart = dataForChart.filter(p => p.percentage > 0.01); 

    return {
        data: dataForChart,
        grandTotal: grandTotal,
    };
};


const SalesReportContent = () => {
    const [monthlySalesAnalysis, setMonthlySalesAnalysis] = useState({ data: [], grandTotal: 0 });
    const [productSalesAnalysis, setProductSalesAnalysis] = useState({ data: [], grandTotal: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [usingDummyData, setUsingDummyData] = useState(false);

    useEffect(() => {
        fetchSalesData();
    }, []);

    const fetchSalesData = async () => {
        setLoading(true);
        setError(null);
        setMonthlySalesAnalysis({ data: [], grandTotal: 0 });
        setProductSalesAnalysis({ data: [], grandTotal: 0 });
        setUsingDummyData(false);
        
        const today = new Date();
        // Look back 6 months for a yearly comparison base
        let startDate = new Date(today.setMonth(today.getMonth() - NUM_MONTHS_REPORT)).toISOString();

        // Fetch sales data
        const { data: sales, error: fetchError } = await supabase
            .from('sales') 
            .select(`
                quantity_sold, 
                sale_date,
                inventory!inner (description)
            `)
            .gte('sale_date', startDate)
            .limit(5000); 

        if (fetchError || !sales || sales.length === 0) {
            console.warn("Using dummy data: Failed to fetch real sales data or data was empty.", fetchError);
            const dummySales = generateDummyData();
            
            const monthlyAnalysis = getMonthlySalesAnalysis(dummySales);
            const productAnalysis = getProductShareAnalysis(dummySales.map(s => ({ 
                ...s, 
                inventory: { description: s.description } 
            }))); // Map dummy data structure to expected structure

            setMonthlySalesAnalysis(monthlyAnalysis);
            setProductSalesAnalysis(productAnalysis);
            setUsingDummyData(true);
            setLoading(false);
            return;
        }
        
        const monthlyAnalysis = getMonthlySalesAnalysis(sales);
        const productAnalysis = getProductShareAnalysis(sales);

        setMonthlySalesAnalysis(monthlyAnalysis);
        setProductSalesAnalysis(productAnalysis);
        setLoading(false);
    };
    
    // --- Responsive SVG Pie Chart Component (Generalized) ---
    const PieChart = ({ data, total, title, centerText }) => {
        const [hoveredSlice, setHoveredSlice] = useState(null);

        // SVG Path utility functions
        const center = 50;
        const radius = 45;
        let cumulativeAngle = 0;

        if (!data || data.length === 0) {
            return <div style={styles.noData}>No data to visualize for this chart.</div>;
        }
        
        const describeArc = (startAngle, endAngle) => {
            const start = polarToCartesian(center, center, radius, endAngle);
            const end = polarToCartesian(center, center, radius, startAngle);

            const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

            const d = [
                "M", start.x, start.y, 
                "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
                "L", center, center,
                "Z"
            ].join(" ");

            return d;       
        }

        const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
            const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
            return {
                x: centerX + (radius * Math.cos(angleInRadians)),
                y: centerY + (radius * Math.sin(angleInRadians))
            };
        }

        const slices = data.map((item, index) => {
            const startAngle = cumulativeAngle;
            const angle = item.percentage * 3.6;
            const endAngle = cumulativeAngle + angle;
            
            const d = describeArc(startAngle, endAngle);
            
            // Calculate label position slightly inside the slice, along the middle angle
            const midAngle = startAngle + angle / 2;
            const labelRadius = radius * 0.7; // 70% of the radius
            const labelPos = polarToCartesian(center, center, labelRadius, midAngle);
            
            // Calculate displacement for hover effect
            const hoverDisplacement = 5; // Pixels to move out
            const hoverPos = polarToCartesian(center, center, hoverDisplacement, midAngle);
            const transform = hoveredSlice === index ? `translate(${hoverPos.x - center}, ${hoverPos.y - center})` : '';

            cumulativeAngle = endAngle;

            return {
                ...item,
                d,
                midAngle,
                labelPos,
                transform,
                index,
            };
        });
        
        return (
            <div style={styles.chartBlock}>
                <h3 style={styles.chartTitle}>{title}</h3>
                
                <div style={styles.chartArea}>
                    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={styles.svgChart}>
                        
                        {/* --- Pie Slices --- */}
                        {slices.map((slice) => (
                            <g 
                                key={slice.description}
                                onMouseEnter={() => setHoveredSlice(slice.index)}
                                onMouseLeave={() => setHoveredSlice(null)}
                                style={{ transform: slice.transform, transition: 'transform 0.2s ease-out', cursor: 'pointer' }}
                            >
                                <path
                                    d={slice.d}
                                    fill={slice.color}
                                    style={styles.sliceTransition}
                                />
                                
                                {/* --- Embedded Labels (Product/Month Name + % Contribution) --- */}
                                {slice.percentage > 4 && (
                                    <>
                                        {/* Label 1: Percentage */}
                                        <text
                                            x={slice.labelPos.x}
                                            y={slice.labelPos.y - 1.5} 
                                            textAnchor="middle"
                                            fontSize="3.5"
                                            fontWeight="bold"
                                            fill="#fff"
                                            style={styles.percentageLabel}
                                        >
                                            {Math.round(slice.percentage)}%
                                        </text>
                                        
                                        {/* Label 2: Description (Month/Product) - Truncate if necessary */}
                                        <text
                                            x={slice.labelPos.x}
                                            y={slice.labelPos.y + 3} 
                                            textAnchor="middle"
                                            fontSize="2.5"
                                            fill="#fff"
                                            style={styles.percentageLabel}
                                        >
                                            {slice.description.substring(0, 15)}
                                        </text>
                                    </>
                                )}
                            </g>
                        ))}
                    </svg>
                </div>

                {/* --- Legend --- */}
                <div style={styles.legendWrapper}>
                    <h4 style={styles.legendTitle}>Breakdown ({total.toLocaleString()} Total Units)</h4>
                    {data.map((item, index) => (
                        <div key={item.description} style={styles.legendItem}>
                            <div style={{...styles.legendColor, backgroundColor: item.color}}></div>
                            <span style={styles.legendText}>
                                **{item.description}**: {Math.round(item.percentage)}% ({item.totalQuantity.toLocaleString()} units)
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };


    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Comprehensive Sales Analysis</h1>

            {usingDummyData && (
                <p style={styles.warningText}>
                    NOTE: Currently displaying simulated sales data ({NUM_MONTHS_REPORT} months). 
                </p>
            )}
            
            {loading ? (
                <p style={styles.loading}>Generating report...</p>
            ) : error ? (
                <p style={styles.error}>{error}</p>
            ) : (
                <div style={styles.contentLayout}>
                    
                    {/* --- CHART 1: MONTHLY SALES COMPARISON --- */}
                    <PieChart 
                        data={monthlySalesAnalysis.data} 
                        total={monthlySalesAnalysis.grandTotal} 
                        title={`Sales Share by Month (Last ${NUM_MONTHS_REPORT} Months)`}
                        centerText={"Total Sales"}
                    />
                    
                    {/* --- CHART 2: PRODUCT TREND / FAST SELLERS --- */}
                    <PieChart 
                        data={productSalesAnalysis.data} 
                        total={productSalesAnalysis.grandTotal} 
                        title={`Top ${TOP_N_PRODUCTS} Product Unit Share`}
                        centerText={"Total Units"}
                    />
                </div>
            )}
        </div>
    );
};

// Styles 
const styles = {
    container: {
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
        width: '100%',
        boxSizing: 'border-box',
    },
    header: {
        color: '#1e3a8a', 
        marginBottom: '20px',
        textAlign: 'center',
        fontSize: '1.8em',
        fontWeight: '700',
    },
    loading: {
        textAlign: 'center',
        padding: '50px',
        color: '#6c757d',
        fontSize: '1.1em',
    },
    error: {
        textAlign: 'center',
        padding: '50px',
        color: '#dc3545',
        fontSize: '1.1em',
        fontWeight: 'bold',
    },
    // --- Layout for Charts (Stacked vertically) ---
    contentLayout: {
        display: 'flex',
        flexDirection: 'column', // Stack vertically
        alignItems: 'center',
        gap: '40px', // Space between charts
        maxWidth: '700px', // Constrain width for better reading
        margin: '0 auto',
    },
    chartBlock: {
        width: '100%',
        boxSizing: 'border-box',
        padding: '20px',
        border: '1px solid #f0f0f0',
        borderRadius: '10px',
    },
    chartTitle: {
        textAlign: 'center',
        fontSize: '1.4em',
        color: '#0056b3',
        marginBottom: '20px',
        fontWeight: '600',
    },
    // --- Chart SVG Area ---
    chartArea: {
        width: '100%',
        maxWidth: '400px', 
        margin: '0 auto', // Center the chart within the block
    },
    svgChart: {
        width: '100%', 
        height: 'auto',
        minHeight: '300px',
        overflow: 'visible',
    },
    sliceTransition: {
        transition: 'stroke-dasharray 0.8s ease-out, transform 0.5s',
    },
    percentageLabel: {
        textShadow: '0 0 2px #000, 0 0 5px rgba(0,0,0,0.8)', // Stronger shadow for better readability on light colors
    },
    // --- Legend Styles (Embedded below chart) ---
    legendWrapper: {
        marginTop: '25px',
        paddingTop: '15px',
        borderTop: '1px dashed #e0e0e0',
    },
    legendTitle: {
        fontSize: '1.1em',
        color: '#495057',
        marginBottom: '10px',
        fontWeight: 'bold',
    },
    legendItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '5px 0',
        fontSize: '0.95em',
        color: '#333',
    },
    legendColor: {
        width: '12px',
        height: '12px',
        borderRadius: '3px',
        marginRight: '10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    legendText: {
        fontWeight: 'normal',
        flexGrow: 1,
    },
    noData: {
        textAlign: 'center',
        padding: '50px',
        color: '#6c757d',
        fontSize: '1.1em',
    },
    warningText: {
        textAlign: 'center',
        color: '#d97706',
        fontSize: '0.9em',
        fontWeight: 'bold',
        marginBottom: '15px',
    }
};

export default SalesReportContent;