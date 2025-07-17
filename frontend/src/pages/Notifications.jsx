import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Box, Paper, Typography, Button, IconButton, InputBase } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';

const SIDEBAR_WIDTH = 240;
const SIDEBAR_MINI = 64;

const weeklySalesData = [
  { week: 'W1', sales: 120, settlements: 80 },
  { week: 'W2', sales: 150, settlements: 100 },
  { week: 'W3', sales: 170, settlements: 120 },
  { week: 'W4', sales: 200, settlements: 140 },
];

const notifications = [
  { type: 'Cancelled', item: 'Order #1234', date: '2024-06-01', details: 'Customer cancelled order.' },
  { type: 'Returned', item: 'Order #1220', date: '2024-05-29', details: 'Item returned by customer.' },
  { type: 'Settlement', item: 'May 2024', date: '2024-05-31', details: 'Monthly settlement completed.' },
  { type: 'Cancelled', item: 'Order #1210', date: '2024-05-25', details: 'Customer cancelled order.' },
  { type: 'Returned', item: 'Order #1205', date: '2024-05-22', details: 'Item returned by customer.' },
];

const allNotifications = [
  ...notifications,
  { type: 'Settlement', item: 'April 2024', date: '2024-04-30', details: 'Monthly settlement completed.' },
  { type: 'Cancelled', item: 'Order #1190', date: '2024-04-15', details: 'Customer cancelled order.' },
  { type: 'Returned', item: 'Order #1185', date: '2024-04-10', details: 'Item returned by customer.' },
];

export default function Notifications() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState('');

  const filteredNotifications = allNotifications.filter(n =>
    n.type.toLowerCase().includes(search.toLowerCase()) ||
    n.item.toLowerCase().includes(search.toLowerCase()) ||
    n.details.toLowerCase().includes(search.toLowerCase())
  );

  // Download as CSV (simple)
  const handleDownload = () => {
    const csv = [
      ['Type', 'Item', 'Date', 'Details'],
      ...filteredNotifications.map(n => [n.type, n.item, n.date, n.details])
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notifications.csv';
    a.click();
    URL.revokeObjectURL(url);
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
        
        {/* <Box sx={{ display: 'flex', gap: 2, mt: 4, mb: 3, height: 270, width: '100%', minWidth: 0, overflowX: 'hidden' }}> */}
    
          {/* <Paper elevation={2} sx={{ width: '74%', minWidth: 0, borderRadius: 3, p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography fontWeight={600} fontSize={18}>Weekly Sales & Monthly Settlements</Typography>
            </Box>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklySalesData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="sales" name="Sales" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="settlements" name="Settlements" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper> */}
          {/* Recent Notifications */}
          {/* <Box sx={{ display: 'flex', flexDirection: 'column', height: 270, width: '26%', minWidth: 0 }}>
            <Paper elevation={2} sx={{ width: '100%', borderRadius: 3, p: 3, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography fontWeight={600} fontSize={16}>Recent Notifications</Typography>
              </Box>
              <Box sx={{ flex: 1, maxHeight: 200, overflowY: 'auto', scrollBehavior: 'smooth', pr: 1 }}>
                {notifications.map((n, idx) => (
                  <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', mb: 1, p: 1, bgcolor: n.type === 'Cancelled' ? '#fee2e2' : n.type === 'Returned' ? '#fef9c3' : '#dbeafe', borderRadius: 2 }}>
                    <Typography fontWeight={600} fontSize={13}>{n.type}: {n.item}</Typography>
                    <Typography fontSize={11} color="#888">{n.date}</Typography>
                    <Typography fontSize={12}>{n.details}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        </Box> */}
        {/* All Notifications Table Section */}
        <Paper elevation={2} sx={{ flex: 1, borderRadius: 3, p: 3, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%', height:'100%' }}>
          <Box sx={{ overflow: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15, tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ color: '#6b7280', textAlign: 'left', background: '#f9fafb' }}>
                  <th style={{ padding: '10px 8px' }}>Type</th>
                  <th style={{ padding: '10px 8px' }}>Item</th>
                  <th style={{ padding: '10px 8px' }}>Date</th>
                  <th style={{ padding: '10px 8px' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotifications.map((n, idx) => (
                  <tr key={idx} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 600, wordBreak: 'break-word' }}>{n.type}</td>
                    <td style={{ padding: '10px 8px', wordBreak: 'break-word' }}>{n.item}</td>
                    <td style={{ padding: '10px 8px', wordBreak: 'break-word' }}>{n.date}</td>
                    <td style={{ padding: '10px 8px', wordBreak: 'break-word' }}>{n.details}</td>
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