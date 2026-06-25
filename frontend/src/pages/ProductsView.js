/**
 * ProductsView.js — Product Performance page
 *
 * This page shows:
 *   - A bar chart of top 10 products by revenue
 *   - A table with product name, category, units sold, and revenue
 *   - A date range filter
 *
 * The data fetching is already wired up.
 * Your job: implement the UI.
 */

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '../components/Navbar';
import { getProducts } from '../utils/api';

// Format currency helper
function formatCurrency(value) {
  if (!value) return '$0';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000)    return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(2)}`;
}

export default function ProductsView() {
  const [startDate, setStartDate] = useState('2022-01-01');
  const [endDate,   setEndDate]   = useState('2022-12-31');
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts(startDate, endDate);
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="page">

        <div className="filter-bar">
          <label>From</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <label>To</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <button className="btn-apply" onClick={loadData}>Apply</button>
        </div>

        {error && (
          <div style={{ color: '#C62828', padding: 16, background: '#FFEBEE', borderRadius: 8, marginBottom: 16 }}>
            Error: {error}
          </div>
        )}

        {loading && <div className="loading">Loading products data…</div>}

        {!loading && !error && (
          <div className="grid-2">

            {/*
              STEP 1 — Top products bar chart
              products is: [{ product_id, name, category, units_sold, revenue }]
              Use a horizontal BarChart (layout="vertical").
              XAxis type="number", YAxis type="category" dataKey="name"
              Hint: truncate long product names to 20 chars
            */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>Top 10 Products by Revenue</div>
              {/* TODO: add your bar chart here
              <div className="loading" style={{ height: 300 }}>
                Implement the products bar chart
              </div> */}
              <ResponsiveContainer width="100%" height={340}>
  <BarChart
    data={[...products]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)}
    layout="vertical"
    margin={{ left: 80, right: 40, top: 20, bottom: 20 }}
  >
    <defs>
      <linearGradient id="revenueGradient" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="var(--blue)" stopOpacity={0.4} />
        <stop offset="100%" stopColor="var(--blue)" stopOpacity={1} />
      </linearGradient>
    </defs>
    <YAxis
      type="category"
      dataKey="name"
      width={160}
      tickFormatter={value =>
        value.length > 22 ? value.substring(0, 22) + '…' : value
      }
      tick={{ fontSize: 13 }}
    />
    <XAxis
      type="number"
      tick={{ fontSize: 12 }}
      tickFormatter={value => formatCurrency(value)}
    />
    <Tooltip
      formatter={(value, key) => [
        formatCurrency(value),
        key === "revenue" ? "Revenue" : key
      ]}
      contentStyle={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        fontSize: 13
      }}
    />
    <Bar
      dataKey="revenue"
      fill="url(#revenueGradient)"
      radius={[6, 6, 6, 6]}
      label={{
        position: 'right',
        formatter: value => formatCurrency(value),
        fill: 'var(--text-primary)',
        fontSize: 12
      }}
    />
  </BarChart>
</ResponsiveContainer>
            </div>

            {/*
              STEP 2 — Products table
              Show all products in a table: Name | Category | Units Sold | Revenue
              Hint: use an HTML table or build with divs.
              Format revenue with the formatCurrency helper above.
            */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>Product Details</div>
              {/* TODO: add your table here
              <div className="loading" style={{ height: 300 }}>
                Implement the products table
              </div> */}
              <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
  <thead>
    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
      <th style={{ padding: '8px 4px' }}>Product Name</th>
      <th style={{ padding: '8px 4px' }}>Category</th>
      <th style={{ padding: '8px 4px' }}>Units Sold</th>
      <th style={{ padding: '8px 4px' }}>Revenue</th>
    </tr>
  </thead>
  <tbody>
    {products.map((p) => (
      <tr key={p.product_id} style={{ borderBottom: '1px solid var(--border)' }}>
        <td style={{ padding: '8px 4px', fontWeight: 600 }}>{p.name}</td>
        <td style={{ padding: '8px 4px' }}>{p.category}</td>
        <td style={{ padding: '8px 4px' }}>{p.category}</td>
        <td style={{ padding: '8px 4px' }}>{p.units_sold}</td>
        <td style={{ padding: '8px 4px', fontWeight: 600 }}>
          {formatCurrency(p.revenue)}
        </td>
      </tr>
    ))}
  </tbody>
</table> 
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
