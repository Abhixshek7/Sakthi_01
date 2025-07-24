import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { Box, Paper, Typography, Chip, MenuItem, Select, Button, Divider, IconButton } from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, CartesianGrid, XAxis, YAxis, Legend, Label, Sector } from "recharts";
import { doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";
import Loader from "../components/Loader";
import { useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

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
  // All hooks must be at the top, before any return or conditional
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [period, setPeriod] = useState('Days');
  const audioRef = React.useRef(null);
  const navigate = useNavigate();
  const [notificationsData, setNotificationsData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'sales', 'main'), (docSnap) => {
      setSalesData(docSnap.data());
    });
    return () => unsub();
  }, []);
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "dashboard", "main"), (docSnap) => {
      setDashboard(docSnap.data());
    });
    return () => unsub();
  }, []);
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'notifications', 'main'), (docSnap) => {
      setNotificationsData(docSnap.data());
    });
    return () => unsub();
  }, []);

  if (!dashboard) return <Loader/>;

  // Prepare financial data for AreaChart (overall) using salesData
  const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let financialData = (salesData && salesData.financialData) || [];
  financialData = monthOrder.map(month => {
    const found = (salesData && salesData.financialData || []).find(fd => fd.month === month);
    return found || { month, revenue: 0, expense: 0, quantity: 0 };
  });
  // Low stock items
  const lowStockItems = (dashboard.pieData || []).filter(item => item.quantity !== undefined && item.quantity < 20);
  // Recent notifications (latest 5)
  const notifications = (notificationsData && notificationsData.notifications) ? [...notificationsData.notifications].reverse().slice(0, 5) : [];

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

  const totalPieValue = (dashboard.pieData || []).reduce((sum, item) => sum + (item.value || 0), 0);
  const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const {
      cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value, index
    } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const color = colorPalette[index % colorPalette.length];
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={color} fill="none" />
        <circle cx={ex} cy={ey} r={4} fill={color} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} textAnchor={cos >= 0 ? "start" : "end"} fill={color} fontWeight={700} fontSize={18}>{`₹${value.toLocaleString()}`}</text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey + 22} textAnchor={cos >= 0 ? "start" : "end"} fill={color} fontWeight={400} fontSize={14}>{payload.name}</text>
      </g>
    );
  };
  const onPieEnter = (_, index) => setActiveIndex(index);

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
          {/* Main content area: Graph, Notifications, Low Stock */}
          <Box sx={{ maxWidth: 1400, mx: 'auto', width: '100%', display: 'flex', gap: 4, mb: 4, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
            {/* Graph Card (2x width) */}
            <Paper elevation={3} sx={{ flex: 2, minWidth: 0, borderRadius: 4, p: 4, bgcolor: cardBg, boxShadow: '0 4px 24px rgba(37,99,235,0.10)', display: 'flex', flexDirection: 'column', height: 400, justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', mb: 0 }}>
                <Typography variant="h5" fontWeight={700} sx={{ fontFamily, color: '#222', textAlign: 'left', letterSpacing: 0.5 }}>Overall Financial Overview</Typography>
              </Box>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={financialData} margin={{ top: 10, right: 20, left: 40, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    domain={["dataMin", "auto"]}
                  />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} iconType="plainline" />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#22c55e" fill="#bbf7d0" strokeWidth={2} dot={{ r: 4, stroke: '#22c55e', strokeWidth: 2, fill: '#fff' }} />
                  <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" fill="#fee2e2" strokeWidth={2} dot={{ r: 4, stroke: '#ef4444', strokeWidth: 2, fill: '#fff' }} />
                  <Area type="monotone" dataKey="quantity" name="Quantity Sold" stroke="#3b82f6" fill="#dbeafe" strokeWidth={2} dot={{ r: 4, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }} />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
            {/* Recent Notifications Card */}
            <Paper elevation={3} sx={{ flex: 1, minWidth: 0, borderRadius: 4, p: 4, bgcolor: cardBg, boxShadow: '0 4px 24px rgba(37,99,235,0.10)', display: 'flex', flexDirection: 'column', height: 400, justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={700} sx={{ color: '#222', fontFamily, letterSpacing: 0.5, textAlign: 'left' }}>Recent Notifications</Typography>
                <IconButton onClick={() => navigate('/notifications')} sx={{ color: blue }}><ChevronRightIcon /></IconButton>
              </Box>
              <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
                {notifications.length === 0 ? (
                  <Typography fontSize={13} color="#888" sx={{ fontFamily }}>No notifications.</Typography>
                ) : (
                  notifications.map((n, idx) => (
                    <React.Fragment key={idx}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                        <Avatar src={n.avatar} alt={n.user} sx={{ width: 36, height: 36, bgcolor: '#e0e7ff', color: blue, fontWeight: 700, fontFamily }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: 600, fontFamily, fontSize: 15, color: '#222', mb: 0.5 }}>{n.details}</Typography>
                          <Typography sx={{ fontFamily, fontSize: 12, color: '#888' }}>{n.date}</Typography>
                        </Box>
                      </Box>
                      {idx < notifications.length - 1 && <Divider sx={{ borderColor: '#e5e7eb' }} />}
                    </React.Fragment>
                  ))
                )}
              </Box>
              <Button variant="contained" onClick={() => navigate('/notifications')} sx={{ mt: 2, bgcolor: blue, color: '#fff', fontFamily, fontWeight: 700, borderRadius: 2, px: 3, py: 1, fontSize: 15, boxShadow: '0 2px 8px rgba(37,99,235,0.08)', '&:hover': { bgcolor: '#1749b1' } }}>View All</Button>
            </Paper>
            {/* Low Stock Quantity Card */}
            <Paper elevation={3} sx={{ flex: 1, minWidth: 0, borderRadius: 4, p: 4, bgcolor: cardBg, boxShadow: '0 4px 24px rgba(37,99,235,0.10)', display: 'flex', flexDirection: 'column', height: 400, justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6" fontWeight={700} sx={{ color: '#222', fontFamily, letterSpacing: 0.5, textAlign: 'left' }}>Low Stock Items</Typography>
              </Box>
              <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
                {lowStockItems.length === 0 ? (
                  <Typography fontSize={13} color="#888" sx={{ fontFamily }}>No low stock items.</Typography>
                ) : (
                  lowStockItems.map((item, idx) => (
                    <React.Fragment key={item.name + idx}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                        <Box sx={{ width: 16, height: 16, bgcolor: colorPalette[idx % colorPalette.length], borderRadius: '50%', flexShrink: 0, mr: 1 }} />
                        <Typography fontSize={15} fontWeight={600} sx={{ fontFamily, color: '#333', lineHeight: 1.2, minWidth: 120 }}>{item.name}</Typography>
                        <Typography sx={{ bgcolor: '#ffeaea', color: '#ef4444', px: 1.5, py: 0.5, borderRadius: 2, fontWeight: 700, fontSize: 15, ml: 2 }}>{item.quantity} left</Typography>
                      </Box>
                      {idx < lowStockItems.length - 1 && <Divider sx={{ borderColor: '#e5e7eb' }} />}
                    </React.Fragment>
                  ))
                )}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleSendLowStockNotifications}
                  sx={{ mt: 2, bgcolor: blue, color: '#fff', fontFamily, fontWeight: 700, borderRadius: 2, px: 3, py: 1, fontSize: 15, boxShadow: '0 2px 8px rgba(37,99,235,0.08)', '&:hover': { bgcolor: '#1749b1' } }}
                >
                  Send Notification
                </Button>
              </Box>
            </Paper>
          </Box>
        {/* Second row: Pie Chart/Statistics and Recent Transactions */}
        <Box sx={{ maxWidth: 1400, mx: 'auto', width: '100%', display: 'flex', gap: 4, mb: 4, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
          {/* Statistics Card (Pie Chart) */}
          <Paper elevation={3} sx={{ flex: 1, minWidth: 0, borderRadius: 4, p: 4, bgcolor: cardBg, boxShadow: '0 4px 24px rgba(37,99,235,0.10)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 400 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="h5" fontWeight={700} sx={{ fontFamily, color: '#222', textAlign: 'left', letterSpacing: 0.5 }}>Statistics</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'center', alignItems: 'center', px: { xs: 2, md: 4 }, pt: 0, pb: 0, gap: { xs: 2, md: 0 }, width: '100%', minHeight: 0, minWidth: 0 }}>
                {/* Pie chart */}
                <Box sx={{ width: { xs: '100%', md: 300 }, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 220, position: 'relative', flexShrink: 0, minHeight: 0, background: 'transparent' }}>
                  <ResponsiveContainer width={260} height={300}>
                    <PieChart>
                      <Pie
                        data={dashboard.pieData || []}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={100}
                        outerRadius={120}
                        fill="#8884d8"
                        paddingAngle={2}
                        labelLine={false}
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape}
                        onMouseEnter={onPieEnter}
                        isAnimationActive={true}
                        animationDuration={1200}
                        animationEasing="ease-out"
                      >
                        {(dashboard.pieData || []).map((entry, idx) => (
                          <Cell key={entry.name + idx} fill={colorPalette[idx % colorPalette.length]} />
                        ))}
                        {/* Center dark circle and total */}
                        <Label
                          value={`₹${totalPieValue.toLocaleString()}`}
                          position="center"
                          fontSize={24}
                          fontWeight={700}
                          fill="#222"
                          style={{
                            background: '#12263a',
                            borderRadius: '50%',
                            padding: '16px 32px',
                            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))',
                          }}
                        />
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
                  alignItems: 'stretch',
                  gap: 0.5, // tighter vertical gap
                  pl: 0,
                  boxSizing: 'border-box',
                  '& > div:hover': { bgcolor: '#f3f6fd', borderRadius: 2, cursor: 'pointer' },
                  '&::-webkit-scrollbar': { width: '6px' },
                  '&::-webkit-scrollbar-thumb': { background: '#c1c1c1', borderRadius: '3px' },
                  '&::-webkit-scrollbar-thumb:hover': { background: '#a8a8a8' }
                }}>
                  {(dashboard.pieData || []).map((item, idx) => (
                    <Box
                      key={item.name + idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2.5, // more space between dot and label/value
                        mb: 0.5,
                        minWidth: 0,
                        width: '100%',
                        justifyContent: 'flex-start',
                        py: 1, // vertical padding for clarity
                      }}
                    >
                      <Box sx={{ width: 16, height: 16, bgcolor: colorPalette[idx % colorPalette.length], borderRadius: '50%', flexShrink: 0, mr: 1 }} />
                      <Typography
                        fontSize={16}
                        fontWeight={600}
                        sx={{
                          fontFamily,
                          color: '#222',
                          lineHeight: 1.2,
                          minWidth: 140,
                          flex: 1,
                          textAlign: 'left',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.name}
                      </Typography>
                      <Typography
                        fontSize={17}
                        fontWeight={700}
                        sx={{
                          fontFamily,
                          color: blue,
                          lineHeight: 1.2,
                          minWidth: 90,
                          ml: 3, // more space between label and value
                          textAlign: 'right',
                          flexShrink: 0,
                        }}
                      >
                        {`₹${Math.round(item.value).toLocaleString()}`}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              {/* End of Pie Chart and Legend Row */}
            </Box>
          </Paper>
            {/* Recent Transactions Box */}
          <Paper elevation={3} sx={{ flex: 1, minWidth: 0, borderRadius: 4, p: 4, bgcolor: cardBg, boxShadow: '0 4px 24px rgba(37,99,235,0.10)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', height: 400 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#222', fontFamily, letterSpacing: 0.5, textAlign: 'left', mb: 2 }}>
                Recent Transactions
              </Typography>
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
      <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#222', fontWeight: 700, fontSize: 20, textAlign: 'left', mb: 1 }}>Balance</Typography>
      <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: blue, fontWeight: 600, fontSize: 28, textAlign: 'left' }}>₹{dashboard.balance ? new Intl.NumberFormat('en-IN').format(Math.round(dashboard.balance)) : 0}</Typography>
    </Paper>
    {/* Balance Card 2 */}
    <Paper sx={{ borderRadius: 4, p: 4, bgcolor: cardBg, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 1, height: 'fit-content', boxShadow: '0 4px 24px rgba(37,99,235,0.10)' }}>
      <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#222', fontWeight: 700, fontSize: 20, textAlign: 'left', mb: 1 }}>Profit</Typography>
      <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: blue, fontWeight: 600, fontSize: 28, textAlign: 'left' }}>₹{dashboard.balance ? new Intl.NumberFormat('en-IN').format(Math.round(dashboard.balance * 0.25)) : 0}</Typography>
      <Chip label={`↑ ${dashboard.balance ? Math.round((0.25) * 100) : 0}%`} sx={{ bgcolor: '#e6f9ed', color: '#16a34a', fontWeight: 600, fontSize: 12, height: 24, alignSelf: 'flex-start' }} />
    </Paper>
  </Box>
  {/* Top Products Card */}
  <Paper sx={{ flex: 2, borderRadius: 4, p: 4, bgcolor: cardBg, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2, boxShadow: '0 4px 24px rgba(37,99,235,0.10)' }}>
    <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#222', fontWeight: 700, fontSize: 20, textAlign: 'left', mb: 1 }}>Top Products</Typography>
    <Box sx={{ maxHeight: 220, overflowY: 'auto', pr: 1 }}>
      {(dashboard.topProducts || []).map((prod, idx) => (
        <Box key={prod.name + idx} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Typography fontWeight={500} sx={{ width: 30, fontSize: 13, color: '#666', fontFamily }}>{`0${idx + 1}`}</Typography>
          <Typography sx={{ fontFamily, color: '#222', fontWeight: 600, fontSize: 13 }}>{prod.name}</Typography>
          <Box sx={{ flex: 1, mx: 2 }}>
            <Box sx={{ width: `${prod.demand}%`, height: 6, bgcolor: prod.color, borderRadius: 3 }} />
          </Box>
          <Typography fontWeight={600} sx={{ fontFamily, color: blue, fontSize: 13 }}>{prod.demand}%</Typography>
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