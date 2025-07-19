import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Box, Paper, Typography, Button, IconButton, InputBase, Tabs, Tab, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import Loader from '../components/Loader';

const SIDEBAR_WIDTH = 240;
const SIDEBAR_MINI = 64;

// Add helper functions at the top
function badgeColor(type, value) {
  if (type === 'payment') return value === 'Paid' ? '#d1fadf' : '#fff7cc';
  if (type === 'status') return value === 'Shipping' ? '#e0e7ff' : '#ffe4e6';
  return '';
}
function badgeTextColor(type, value) {
  if (type === 'payment') return value === 'Paid' ? '#15803d' : '#b45309';
  if (type === 'status') return value === 'Shipping' ? '#3730a3' : '#be123c';
  return '';
}

export default function Sales() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [sales, setSales] = useState(null);
  const [overviewMode, setOverviewMode] = useState('revenue'); // 'revenue', 'expense', or 'quantity'
  const [productFilter, setProductFilter] = useState('All');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'sales', 'main'), (docSnap) => {
      setSales(docSnap.data());
    });
    return () => unsub();
  }, []);

  if (!sales) return <Loader />;

  // Get unique product names for filter
  const productNames = ['All', ...Array.from(new Set((sales.orders || []).map(order => order.product).filter(Boolean)))];

  // Filtered orders for search
  const filteredOrders = (sales.orders || []).filter(order =>
    String(order.id || '').toLowerCase().includes(search.toLowerCase()) ||
    String(order.product || '').toLowerCase().includes(search.toLowerCase()) ||
    String(order.customer || '').toLowerCase().includes(search.toLowerCase())
  );

  // Download orders as Excel
  const handleDownload = () => {
    // ... keep as is, but use filteredOrders ...
  };

  // Placeholder for New Order
  const handleNewOrder = () => {
    alert('New Order functionality coming soon!');
  };

  // Filtered financialData for quantity sold
  let filteredFinancialData = sales.financialData || [];
  if (overviewMode === 'quantity' && productFilter !== 'All') {
    // For each month, sum predicted_quantity_sold for the selected product
    filteredFinancialData = filteredFinancialData.map(monthData => {
      // Find all orders for this month and product
      const monthOrders = (sales.orders || []).filter(order => {
        const orderMonth = order.date && order.date.toDate ? order.date.toDate().toLocaleString('en-US', { month: 'short' }) : String(order.date).slice(5, 7);
        return order.product === productFilter && monthData.month && monthData.month.startsWith(orderMonth);
      });
      const quantity = monthOrders.reduce((sum, order) => sum + (order.predicted_quantity_sold || 0), 0);
      return { ...monthData, quantity };
    });
  }

  const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // Ensure all 12 months are present in the graph
  filteredFinancialData = monthOrder.map(month => {
    const found = (sales.financialData || []).find(fd => fd.month === month);
    return found || { month, revenue: 0, expense: 0, quantity: 0 };
  });

  filteredFinancialData = [...filteredFinancialData].sort(
    (a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
  );

  return (
    <Box sx={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', bgcolor: '#eaf6fa' }}>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <Box
        sx={{
          flex: 1,
          ml: sidebarOpen ? `${SIDEBAR_WIDTH}px` : `${SIDEBAR_MINI}px`,
          transition: 'margin-left 0.3s',
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Top Section */}
        <Box sx={{ display: 'flex', gap: 3, mt: 4, mb: 3, height: 270 }}>
          {/* Financial Overview */}
          <Paper elevation={2} sx={{ flex: 1, borderRadius: 3, p: 3, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography fontWeight={600} fontSize={18}>Financial Overview</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {overviewMode === 'quantity' && (
                  <FormControl size="small" sx={{ minWidth: 160, mr: 2 }}>
                    <InputLabel id="product-filter-label">Product</InputLabel>
                    <Select
                      labelId="product-filter-label"
                      value={productFilter}
                      label="Product"
                      onChange={e => setProductFilter(e.target.value)}
                    >
                      {productNames.map(name => (
                        <MenuItem key={name} value={name}>{name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                <Button
                  size="small"
                  sx={{ color: overviewMode === 'revenue' ? '#fff' : '#555', background: overviewMode === 'revenue' ? '#2563eb' : 'transparent', textTransform: 'none', fontWeight: 500, mr: 1 }}
                  onClick={() => setOverviewMode('revenue')}
                  variant={overviewMode === 'revenue' ? 'contained' : 'outlined'}
                >
                  Revenue
                </Button>
                <Button
                  size="small"
                  sx={{ color: overviewMode === 'expense' ? '#fff' : '#555', background: overviewMode === 'expense' ? '#2563eb' : 'transparent', textTransform: 'none', fontWeight: 500, mr: 1 }}
                  onClick={() => setOverviewMode('expense')}
                  variant={overviewMode === 'expense' ? 'contained' : 'outlined'}
                >
                  Expense
                </Button>
                <Button
                  size="small"
                  sx={{ color: overviewMode === 'quantity' ? '#fff' : '#555', background: overviewMode === 'quantity' ? '#2563eb' : 'transparent', textTransform: 'none', fontWeight: 500 }}
                  onClick={() => setOverviewMode('quantity')}
                  variant={overviewMode === 'quantity' ? 'contained' : 'outlined'}
                >
                  Quantity Sold
                </Button>
              </Box>
            </Box>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={filteredFinancialData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} iconType="plainline" />
                {overviewMode === 'revenue' && (
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#22c55e" fill="#bbf7d0" strokeWidth={2} dot={{ r: 4, stroke: '#22c55e', strokeWidth: 2, fill: '#fff' }} />
                )}
                {overviewMode === 'expense' && (
                  <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" fill="#fee2e2" strokeWidth={2} dot={{ r: 4, stroke: '#ef4444', strokeWidth: 2, fill: '#fff' }} />
                )}
                {overviewMode === 'quantity' && (
                  <Area type="monotone" dataKey="quantity" name="Quantity Sold" stroke="#3b82f6" fill="#dbeafe" strokeWidth={2} dot={{ r: 4, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
          
        </Box>
        {/* Orders Table Section */}
        <Paper elevation={2} sx={{ flex: 1, borderRadius: 3, p: 3, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Table Controls and Tabs removed from here, now below transactions */}
          {/* Table */}
          <Box sx={{ overflow: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
              <thead>
                <tr style={{ color: '#6b7280', textAlign: 'left', background: '#f9fafb' }}>
                  <th style={{ padding: '10px 8px' }}><input type="checkbox" /></th>
                  <th style={{ padding: '10px 8px' }}>Orders</th>
                  <th style={{ padding: '10px 8px' }}>Customer</th>
                  <th style={{ padding: '10px 8px' }}>Price</th>
                  <th style={{ padding: '10px 8px' }}>Date</th>
                  <th style={{ padding: '10px 8px' }}>Payment</th>
                  <th style={{ padding: '10px 8px' }}>Status</th>
                  <th style={{ padding: '10px 8px' }}>Predicted Quantity Sold</th>
                  <th style={{ padding: '10px 8px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, idx) => (
                  <tr key={order.id || idx} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '10px 8px' }}><input type="checkbox" /></td>
                    <td style={{ padding: '10px 8px', color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}>{order.id}<br /><span style={{ color: '#6b7280', fontWeight: 400, fontSize: 13 }}>{order.product}</span></td>
                    <td style={{ padding: '10px 8px' }}>{order.customer}</td>
                    <td style={{ padding: '10px 8px' }}>${order.price.toFixed(2)}</td>
                    <td style={{ padding: '10px 8px' }}>{order.date && order.date.toDate ? order.date.toDate().toLocaleString() : String(order.date)}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ background: badgeColor('payment', order.payment), color: badgeTextColor('payment', order.payment), padding: '2px 10px', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>{order.payment}</span>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ background: badgeColor('status', order.status), color: badgeTextColor('status', order.status), padding: '2px 10px', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>{order.status}</span>
                    </td>
                    <td style={{ padding: '10px 8px' }}>{order.predicted_quantity_sold !== undefined ? order.predicted_quantity_sold : '-'}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <span style={{ color: '#9ca3af', fontSize: 20, cursor: 'pointer' }}>⋯</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
} 