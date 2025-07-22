import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { Box, Paper, Typography, Chip, MenuItem, Select, Button, Divider } from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";
import Loader from "../components/Loader";

const mainBg = '#eaf7f7';
const cardBg = '#fff';
const blue = '#2563eb';
const blueBorder = '#2563eb';
const blueBar = '#2563eb';
const fontFamily = 'Poppins, sans-serif';
const SIDEBAR_WIDTH = 240;
const SIDEBAR_MINI = 64;

const colorPalette = [
  '#8B5CF6', // purple
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#6366F1', // indigo
  '#F472B6', // pink
  '#FBBF24', // amber
  '#34D399', // emerald
  '#60A5FA', // light blue
  '#F87171', // light red
  '#A78BFA', // light purple
];

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [period, setPeriod] = useState('Days');

  // For notification sound, add a hidden audio element and play on notification (Snackbar) open
  const audioRef = React.useRef(null);
  useEffect(() => {
    // Play sound when a notification is shown (Snackbar or similar)
    // This assumes you use a Snackbar for notifications elsewhere in your app
    // If you want to trigger sound on a specific event, call audioRef.current.play();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "dashboard", "main"), (docSnap) => {
      setDashboard(docSnap.data());
    });
    return () => unsub();
  }, []);

  if (!dashboard) return <Loader/>;

  // Calculate sidebar width
  const sidebarWidth = sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_MINI;

  const phone_numbers = ["+917305282230", "+918760275445","+916353406625"]; // Add as many as you want
  const apiKey = "B2LzFxsBt5mOSbsmEFSdxHziveSmOe4L";
  const handleCheckAndNotify = () => {
    if (!dashboard || !dashboard.pieData) return;
    dashboard.pieData.forEach(item => {
      if (item.quantity !== undefined && item.quantity < 20) {
        phone_numbers.forEach(phone_number => {
          fetch(`/sms/send?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone_number,
              message: `Alert: Stock for '${item.name}' is low (${item.quantity} units left). Please restock soon!`
            })
          });
        });
      }
    });
    alert("Low stock WhatsApp notifications sent (if any items were below 20).");
  };

  // Add this handler for sending low stock notifications
  const handleSendLowStockNotifications = async () => {
    if (!dashboard || !dashboard.pieData) return;
    const lowStockItems = dashboard.pieData.filter(item => item.quantity !== undefined && item.quantity < 20);
    if (lowStockItems.length === 0) {
      // Optionally show a banner for no low stock
      // setBannerNotification({ details: 'No low stock items to notify.', date: new Date().toLocaleString() });
      // setBannerOpen(true);
      return;
    }
    const notificationsRef = doc(db, 'notifications', 'main');
    const now = new Date();
    for (const item of lowStockItems) {
      await updateDoc(notificationsRef, {
        notifications: arrayUnion({
          details: `Stock for '${item.name}' is low (${item.quantity} units left). Please restock soon!`,
          date: now.toLocaleString(),
          user: 'System',
          avatar: '',
        })
      });
    }
    // setBannerNotification({ details: 'Low stock notifications sent!', date: now.toLocaleString() });
    // setBannerOpen(true);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: mainBg, fontFamily, overflowX: 'hidden' }}>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <Box
        sx={{
          flex: 1,
          ml: sidebarOpen ? `${SIDEBAR_WIDTH}px` : `${SIDEBAR_MINI}px`,
          transition: 'margin-left 0.3s',
          p: { xs: 1, sm: 2, md: 4 },
          bgcolor: mainBg,
          minHeight: '100vh',
          fontFamily,
          boxSizing: 'border-box',
          width: '100%',
          overflowX: 'hidden',
        }}
      >
        <Box sx={{ maxWidth: 1400, mx: 'auto', width: '100%', display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ flex: 1 }} />
          <audio ref={audioRef} src="https://actions.google.com/sounds/v1/alarms/beep_short.ogg" preload="auto" style={{ display: 'none' }} />
        </Box>
          {/* Main content area */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 2, md: 5 },
              alignItems: 'stretch',
              width: '100%',
              minHeight: 0,
              pb: 4,
            }}
          >
            {/* Statistics Card */}
            <Paper
              elevation={3}
              sx={{
                flex: 1,
                minWidth: 0,
                borderRadius: 4,
                p: 4,
                bgcolor: cardBg,
                boxShadow: '0 4px 24px rgba(37,99,235,0.10)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: 400,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', px: { xs: 2, md: 4 }, pt: 3, pb: 2, minWidth: 0 }}>
                <Typography variant="h5" fontWeight={700} sx={{ fontFamily, color: blue, textAlign: 'center', width: '100%', letterSpacing: 0.5 }}>Statistics</Typography>
                {/* Select filter removed */}
              </Box>
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'center', // Center horizontally
                alignItems: 'center', // Center vertically
                px: { xs: 2, md: 4 },
                pt: 0,
                pb: 0,
                gap: { xs: 2, md: 0 },
                width: '100%',
                minHeight: 0,
                minWidth: 0,
              }}>
                {/* Pie chart */}
                <Box sx={{ width: { xs: '100%', md: 300 }, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 220, position: 'relative', flexShrink: 0, minHeight: 0, background: 'transparent' }}>
                  <ResponsiveContainer width={240} height={280}>
                    <PieChart>
                      <Pie
                        data={dashboard.pieData || []}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={85}
                        outerRadius={120}
                        fill="#8884d8"
                        paddingAngle={2}
                        label={false}
                        isAnimationActive={true}
                        animationDuration={1200}
                        animationEasing="ease-out"
                      >
                        {(dashboard.pieData || []).map((entry, idx) => (
                          <Cell key={entry.name + idx} fill={colorPalette[idx % colorPalette.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name, props) => [`₹${Math.round(value).toLocaleString()}`, props.payload.name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                {/* Legend - centered and no horizontal scroll */}
                <Box sx={{
                  flex: 1,
                  minWidth: 0,
                  maxHeight: 220,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start', // Left-align legend content
                  gap: 1.5,
                  pl: 0,
                  boxSizing: 'border-box',
                  '& > div:hover': {
                    bgcolor: '#f3f6fd',
                    borderRadius: 2,
                    cursor: 'pointer',
                  },
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#c1c1c1',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: '#a8a8a8',
                  },
                }}>
                  {(dashboard.pieData || []).map((item, idx) => (
                    <Box key={item.name + idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, minWidth: 0 }}>
                      <Box sx={{ width: 16, height: 16, bgcolor: colorPalette[idx % colorPalette.length], borderRadius: '50%', flexShrink: 0, mr: 1 }} />
                      <Typography fontSize={15} fontWeight={600} sx={{ fontFamily, color: '#333', lineHeight: 1.2, minWidth: 120 }}>{item.name}</Typography>
                      <Typography fontSize={17} fontWeight={700} sx={{ fontFamily, color: blue, lineHeight: 1.2, minWidth: 60, ml: 2 }}>{`₹${Math.round(item.value).toLocaleString()}`}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
              {/* WhatsApp and Notifications Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, width: '100%' }}>
                <Button
                  variant="contained"
                  color="inherit"
                  size="small"
                  onClick={handleCheckAndNotify}
                  sx={{
                    fontWeight: 600,
                    fontSize: 14,
                    px: 2.5,
                    py: 0.8,
                    borderRadius: 2,
                    letterSpacing: 0.5,
                    minWidth: 120,
                    boxShadow: '0 2px 8px rgba(37,99,235,0.08)',
                    backgroundColor: '#25D366',
                    color: '#fff',
                    '&:hover': { backgroundColor: '#1ebe57' }
                  }}
                >
                  Whatsapp
                </Button>
                <Button
                  variant="contained"
                  color="info"
                  size="small"
                  onClick={handleSendLowStockNotifications}
                  sx={{ fontWeight: 600, fontSize: 14, px: 2.5, py: 0.8, borderRadius: 2, letterSpacing: 0.5, minWidth: 120, boxShadow: '0 2px 8px rgba(37,99,235,0.08)' }}
                >
                  Notifications
                </Button>
              </Box>
            </Paper>
            {/* Recent Transactions Box */}
            <Paper
              elevation={3}
              sx={{
                flex: 1,
                minWidth: 0,
                borderRadius: 4,
                p: 4,
                bgcolor: cardBg,
                boxShadow: '0 4px 24px rgba(37,99,235,0.10)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden',
                height: 400,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',  }}>
                <Typography variant="h5" fontWeight={700} sx={{ color: blue, fontFamily, letterSpacing: 0.5 }}>Recent Transactions</Typography>
                <Box />
              </Box>
              <Box sx={{ flex: 1, height: '100%', overflowY: 'auto', scrollBehavior: 'smooth', pr: 1 }}>
                {(dashboard.transactions && dashboard.transactions.length > 0) ? (
                  dashboard.transactions.map((tx, idx) => (
                    <React.Fragment key={idx}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: blue, fontSize: 16, boxShadow: '0 2px 8px rgba(37,99,235,0.08)' }}>
                            {tx.name[0]}
                          </Box>
                          <Box>
                            <Typography fontWeight={600} fontSize={17} sx={{ fontFamily }}>{tx.name}</Typography>
                            <Typography fontSize={11} color="#888" sx={{ fontFamily }}>{tx.date && tx.date.toDate ? tx.date.toDate().toLocaleString() : String(tx.date)}</Typography>
                          </Box>
                        </Box>
                        <Typography fontWeight={700} fontSize={17} color={tx.positive ? '#22c55e' : blue} sx={{ fontFamily }}>
                          {tx.positive ? '+' : ''}₹{new Intl.NumberFormat('en-IN').format(Math.round(Math.abs(tx.amount)))}
                        </Typography>
                      </Box>
                      {idx < dashboard.transactions.length - 1 && <Divider sx={{ my: 1, borderColor: '#e5e7eb' }} />}
                    </React.Fragment>
                  ))
                ) : (
                  <Typography fontSize={13} color="#888" sx={{ fontFamily }}>No recent transactions.</Typography>
                )}
              </Box>
            </Paper>
          </Box>
          {/* Balances and Top Products */}
                             <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
  {/* Left: Balance cards stacked vertically */}
  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, width: 'fit-content'}}>
    {/* Balance Card 1 */}
    <Paper sx={{ borderRadius: 4, p: 4, bgcolor: cardBg, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 1, height: 'fit-content', boxShadow: '0 4px 24px rgba(37,99,235,0.10)' }}>
      <Typography fontSize={14} color="#666" sx={{ fontFamily }}>Balance</Typography>
      <Typography variant="h4" fontWeight={600} color={blue} sx={{ fontFamily }}>₹{dashboard.balance ? new Intl.NumberFormat('en-IN').format(Math.round(dashboard.balance)) : 0}</Typography>
    </Paper>
    {/* Balance Card 2 */}
    <Paper sx={{ borderRadius: 4, p: 4, bgcolor: cardBg, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 1, height: 'fit-content', boxShadow: '0 4px 24px rgba(37,99,235,0.10)' }}>
      <Typography fontSize={14} color="#666" sx={{ fontFamily }}>Profit</Typography>
      <Typography variant="h4" fontWeight={600} color={blue} sx={{ fontFamily }}>₹{dashboard.balance ? new Intl.NumberFormat('en-IN').format(Math.round(dashboard.balance * 0.25)) : 0}</Typography>
      <Chip label={`↑ ${dashboard.balance ? Math.round((0.25) * 100) : 0}%`} sx={{ bgcolor: '#e6f9ed', color: '#16a34a', fontWeight: 600, fontSize: 12, height: 24, alignSelf: 'flex-start' }} />
    </Paper>
  </Box>
  {/* Top Products Card */}
  <Paper sx={{ flex: 2, borderRadius: 4, p: 4, bgcolor: cardBg, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2, boxShadow: '0 4px 24px rgba(37,99,235,0.10)' }}>
    <Typography fontWeight={600} fontSize={16} mb={2} sx={{ fontFamily, color: '#333' }}>Top Products</Typography>
    <Box sx={{ maxHeight: 220, overflowY: 'auto', pr: 1 }}>
      {(dashboard.topProducts || []).map((prod, idx) => (
        <Box key={prod.name + idx} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Typography fontWeight={500} sx={{ width: 30, fontSize: 13, color: '#666', fontFamily }}>{`0${idx + 1}`}</Typography>
          <Typography fontWeight={500} sx={{ width: 120, fontSize: 13, color: '#333', fontFamily }}>{prod.name}</Typography>
          <Box sx={{ flex: 1, mx: 2 }}>
            <Box sx={{ width: `${prod.demand}%`, height: 6, bgcolor: prod.color, borderRadius: 3 }} />
          </Box>
          <Typography fontWeight={600} sx={{ width: 60, fontSize: 13, color: prod.color, fontFamily }}>{prod.demand}%</Typography>
        </Box>
      ))}
    </Box>
  </Paper>
</Box>
              {/* Cash Balance Cards */}
              {/* <Box sx={{ display: 'flex', gap: 3, width: '100%', flexWrap: { xs: 'wrap', md: 'nowrap' }, minWidth: 0 }}>
                {[1, 2, 3, 4].map((i) => (
                  <Paper key={i} sx={{ flex: 1, borderRadius: 3, p: 3, bgcolor: cardBg, boxShadow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 200, mb: { xs: 2, md: 0 } }}>
                    <Box sx={{ mb: 1 }}>
                      <img src="/icons/cash-balance.svg" alt="Cash Balance" width={36} height={36} style={{ opacity: 0.7 }} />
                    </Box>
                    <Typography fontSize={15} color="text.secondary" sx={{ fontFamily }}>Total Cash Balance</Typography>
                    <Typography variant="h5" fontWeight={600} sx={{ fontFamily }}>15,2020</Typography>
                  </Paper>
                ))}
              </Box> */}
            </Box>
          </Box>
        
      
  );
} 