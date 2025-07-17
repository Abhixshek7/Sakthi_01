import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Box, Paper, Typography, Button, IconButton, InputBase, Tabs, Tab } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
// import * as XLSX from 'xlsx';

const SIDEBAR_WIDTH = 240;
const SIDEBAR_MINI = 64;

const financialData = [
  { month: 'Jan', income: 12000, expense: 1100 },
  { month: 'Feb', income: 15000, expense: 1300 },
  { month: 'Mar', income: 17000, expense: 1400 },
  { month: 'Apr', income: 20000, expense: 1600 },
  { month: 'May', income: 22000, expense: 1800 },
  { month: 'Jun', income: 18000, expense: 1700 },
  { month: 'Jul', income: 25000, expense: 2100 },
  { month: 'Aug', income: 3000, expense: 2200 },
  { month: 'Sep', income: 35000, expense: 2500 },
  { month: 'Oct', income: 40000, expense: 2700 },
  { month: 'Nov', income: 32000, expense: 2300 },
  { month: 'Dec', income: 42000, expense: 3100 },
];

const transactions = [
  { name: 'Isabella Moore', date: '24 May 2023', amount: -210.52, avatar: '', positive: false },
  { name: 'Jane Carter', date: '23 May 2023', amount: 452.55, avatar: '', positive: true },
  { name: 'Mia Andersen', date: '22 May 2023', amount: 914.28, avatar: '', positive: true },
  { name: 'Emma Johnson', date: '21 May 2023', amount: -20.00, avatar: '', positive: false },
  { name: 'Matteo Rossi', date: '20 May 2023', amount: -220.00, avatar: '', positive: false },
  { name: 'Kevin Smith', date: '19 May 2023', amount: 15.85, avatar: '', positive: true },
  { name: 'Oliver Dupont', date: '17 May 2023', amount: -22.42, avatar: '', positive: false },
];

const orders = [
  { id: '02131', product: 'Kanly Kitadakate (Green)', customer: 'Leslie Alexander', price: 21.78, date: '04/17/23', payment: 'Paid', status: 'Shipping' },
  { id: '02131', product: 'Kanly Kitadakate (Green)', customer: 'Leslie Alexander', price: 21.78, date: '04/17/23', payment: 'Unpaid', status: 'Cancelled' },
  { id: '02131', product: 'Kanly Kitadakate (Green)', customer: 'Leslie Alexander', price: 21.78, date: '04/17/23', payment: 'Paid', status: 'Shipping' },
  { id: '02131', product: 'Story Honora (Cream)', customer: 'Leslie Alexander', price: 21.78, date: '04/17/23', payment: 'Unpaid', status: 'Cancelled' },
];

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

  // Filtered orders for search
  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(search.toLowerCase()) ||
    order.product.toLowerCase().includes(search.toLowerCase()) ||
    order.customer.toLowerCase().includes(search.toLowerCase())
  );

  // Download orders as Excel
  const handleDownload = () => {
    const ws = XLSX.utils.json_to_sheet(filteredOrders);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    XLSX.writeFile(wb, 'orders.xlsx');
  };

  // Placeholder for New Order
  const handleNewOrder = () => {
    alert('New Order functionality coming soon!');
  };

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
              <Button size="small" sx={{ color: '#555', textTransform: 'none', fontWeight: 500 }}>Monthly View</Button>
            </Box>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={financialData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} iconType="plainline" />
                <Area type="monotone" dataKey="income" name="Income" stroke="#3b82f6" fill="#dbeafe" strokeWidth={2} dot={{ r: 4, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }} />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" fill="#fee2e2" strokeWidth={2} dot={{ r: 4, stroke: '#ef4444', strokeWidth: 2, fill: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', height: 220, width: '20.7%' }}>
            <Paper elevation={2} sx={{ width: '100%', borderRadius: 3, p: 3, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography fontWeight={600} fontSize={16}>Recent Transactions</Typography>
                <Button size="small" sx={{ color: '#3b82f6', textTransform: 'none', fontWeight: 500 }}>View all</Button>
              </Box>
              <Box sx={{ flex: 1, height: '100%', overflowY: 'auto', scrollBehavior: 'smooth', pr: 1 }}>
                {transactions.map((tx, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#555', fontSize: 14 }}>
                        {tx.name[0]}
                      </Box>
                      <Box>
                        <Typography fontWeight={500} fontSize={12}>{tx.name}</Typography>
                        <Typography fontSize={10} color="#888">{tx.date}</Typography>
                      </Box>
                    </Box>
                    <Typography fontWeight={600} fontSize={12} color={tx.positive ? '#22c55e' : '#ef4444'}>
                      {tx.positive ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
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
                  <th style={{ padding: '10px 8px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, idx) => (
                  <tr key={idx} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '10px 8px' }}><input type="checkbox" /></td>
                    <td style={{ padding: '10px 8px', color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}>{order.id}<br /><span style={{ color: '#6b7280', fontWeight: 400, fontSize: 13 }}>{order.product}</span></td>
                    <td style={{ padding: '10px 8px' }}>{order.customer}</td>
                    <td style={{ padding: '10px 8px' }}>${order.price.toFixed(2)}</td>
                    <td style={{ padding: '10px 8px' }}>{order.date}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ background: badgeColor('payment', order.payment), color: badgeTextColor('payment', order.payment), padding: '2px 10px', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>{order.payment}</span>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ background: badgeColor('status', order.status), color: badgeTextColor('status', order.status), padding: '2px 10px', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>{order.status}</span>
                    </td>
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