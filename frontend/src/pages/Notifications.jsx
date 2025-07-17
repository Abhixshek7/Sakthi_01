import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Box, Paper, Typography, Button, IconButton, InputBase } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const SIDEBAR_WIDTH = 240;
const SIDEBAR_MINI = 64;

export default function Notifications() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [notificationsData, setNotificationsData] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'notifications', 'main'), (docSnap) => {
      setNotificationsData(docSnap.data());
    });
    return () => unsub();
  }, []);

  if (!notificationsData) return <div>Loading...</div>;

  const filteredNotifications = (notificationsData.notifications || []).filter(n =>
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