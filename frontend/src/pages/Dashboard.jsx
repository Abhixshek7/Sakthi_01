import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { Box, Paper, Typography, Chip, MenuItem, Select } from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { doc, onSnapshot } from "firebase/firestore";
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

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [period, setPeriod] = useState('Days');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "dashboard", "main"), (docSnap) => {
      setDashboard(docSnap.data());
    });
    return () => unsub();
  }, []);

  if (!dashboard) return <Loader/>;

  // Calculate sidebar width
  const sidebarWidth = sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_MINI;

  return (
    <Box sx={{ display: 'flex', width: '100vw', minHeight: '100vh', bgcolor: mainBg, fontFamily }}>
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
          overflowX: 'hidden',
        }}
      >
        <Box sx={{ maxWidth: 1400, mx: 'auto', width: '100%' }}>
          {/* Main content area */}
          <Box sx={{
            display: 'flex',
            gap: { xs: 2, md: 3 },
            alignItems: 'flex-start',
            position: 'relative',
            width: '100%',
            flexWrap: { xs: 'wrap', md: 'nowrap' },
            minHeight: 0,
          }}>
            {/* Left: Main cards */}
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
              {/* Statistics Card */}
              <Paper sx={{
                borderRadius: 3,
                p: 0,
                bgcolor: cardBg,
                border: `2px solid ${blueBorder}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                position: 'relative',
                width: '100%',
                minWidth: 320,
                mx: 'auto',
                mt: 1,
                overflow: 'visible',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: { xs: 2, md: 4 }, pt: 3, pb: 2, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography fontWeight={600} fontSize={18} sx={{ fontFamily, color: '#333' }}>Statistics</Typography>
                    <Typography fontWeight={700} fontSize={20} sx={{ fontFamily, color: blue }}>₹{dashboard.balance ? dashboard.balance.toLocaleString() : 0}</Typography>
                  </Box>
                  <Select
                    value={period}
                    onChange={e => setPeriod(e.target.value)}
                    size="small"
                    sx={{ bgcolor: '#f4f8fb', borderRadius: 2, fontWeight: 500, fontSize: 14, minWidth: 80, height: 36, fontFamily, border: 'none' }}
                    disableUnderline
                  >
                    <MenuItem value="Days">Days</MenuItem>
                    <MenuItem value="Weeks">Weeks</MenuItem>
                    <MenuItem value="Months">Months</MenuItem>
                  </Select>
                </Box>
                <Box sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', md: 'center' },
                  px: { xs: 2, md: 4 },
                  pt: 0,
                  pb: 0,
                  gap: { xs: 2, md: 0 },
                  width: '100%',
                  minHeight: 0,
                  minWidth: 0,
                }}>
                  {/* Pie chart */}
                  <Box sx={{ width: { xs: '100%', md: 280 }, height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 200, position: 'relative', flexShrink: 0, minHeight: 0 }}>
                    <ResponsiveContainer width={240} height={240}>
                      <PieChart>
                        <Pie
                          data={dashboard.pieData || []}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          fill="#8884d8"
                          paddingAngle={3}
                        >
                          {(dashboard.pieData || []).map((entry, idx) => (
                            <Cell key={entry.name + idx} fill={['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][idx % 6]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  {/* Legend - scrollable if too many items, always contained */}
                  <Box sx={{
                    flex: 1,
                    minWidth: 0,
                    maxHeight: 220,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    pl: { xs: 0, md: 4 },
                    boxSizing: 'border-box',
                    '&::-webkit-scrollbar': {
                      width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: '#f1f1f1',
                      borderRadius: '3px',
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
                        <Box sx={{ width: 12, height: 12, bgcolor: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][idx % 6], borderRadius: '50%', flexShrink: 0 }} />
                        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                          <Typography fontSize={13} fontWeight={500} sx={{ fontFamily, color: '#333', lineHeight: 1.2 }}>{item.name}</Typography>
                          <Typography fontSize={13} fontWeight={600} sx={{ fontFamily, color: '#333', lineHeight: 1.2 }}>{item.value?.toLocaleString()}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
                {/* Blue stats bar */}
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, mb: 0, width: '100%' }}>
                  <Box sx={{ bgcolor: blueBar, color: '#fff', borderRadius: 2, px: 4, py: 1, fontWeight: 600, fontSize: 18, fontFamily, display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', md: 'auto' }, justifyContent: 'center' }}>
                    784.68 <Box sx={{ width: 24, height: 6, bgcolor: '#fff', borderRadius: 1, mx: 1, display: 'inline-block' }} /> 364.65
                  </Box>
                </Box>
              </Paper>

              {/* Recent Transactions Box */}
              <Paper elevation={2} sx={{ width: '100%', borderRadius: 3, p: 3, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 220, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography fontWeight={600} fontSize={16}>Recent Transactions</Typography>
                  <Box />
                </Box>
                <Box sx={{ flex: 1, height: '100%', overflowY: 'auto', scrollBehavior: 'smooth', pr: 1 }}>
                  {(dashboard.transactions && dashboard.transactions.length > 0) ? (
                    dashboard.transactions.map((tx, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#555', fontSize: 14 }}>
                            {tx.name[0]}
                          </Box>
                          <Box>
                            <Typography fontWeight={500} fontSize={12}>{tx.name}</Typography>
                            <Typography fontSize={10} color="#888">{tx.date && tx.date.toDate ? tx.date.toDate().toLocaleString() : String(tx.date)}</Typography>
                          </Box>
                        </Box>
                        <Typography fontWeight={600} fontSize={12} color={tx.positive ? '#22c55e' : '#ef4444'}>
                          {tx.positive ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography fontSize={13} color="#888">No recent transactions.</Typography>
                  )}
                </Box>
              </Paper>
              {/* Balances and Top Products */}
                             <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
  {/* Left: Balance cards stacked vertically */}
  <Box sx={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, width: 'fit-content'}}>
    {/* Balance Card 1 */}
    <Paper sx={{ borderRadius: 3, p: 3, bgcolor: cardBg, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 1, height: 'fit-content' }}>
      <Typography fontSize={14} color="#666" sx={{ fontFamily }}>Balance</Typography>
      <Typography variant="h4" fontWeight={600} color={blue} sx={{ fontFamily }}>₹{dashboard.balance ? dashboard.balance.toLocaleString() : 0}</Typography>
      <Chip label={dashboard.balanceChangePercent ? `↑ ${dashboard.balanceChangePercent}%` : '↑ 0%'} sx={{ bgcolor: '#e6f9ed', color: '#16a34a', fontWeight: 600, fontSize: 12, height: 24, alignSelf: 'flex-start' }} />
    </Paper>
    {/* Balance Card 2 */}
    <Paper sx={{ borderRadius: 3, p: 3, bgcolor: cardBg, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 1, height: 'fit-content' }}>
      <Typography fontSize={14} color="#666" sx={{ fontFamily }}>Balance</Typography>
      <Typography variant="h4" fontWeight={600} color={blue} sx={{ fontFamily }}>₹{dashboard.balance ? dashboard.balance.toLocaleString() : 0}</Typography>
      <Chip label={dashboard.balanceChangePercent ? `↑ ${dashboard.balanceChangePercent}%` : '↑ 0%'} sx={{ bgcolor: '#e6f9ed', color: '#16a34a', fontWeight: 600, fontSize: 12, height: 24, alignSelf: 'flex-start' }} />
    </Paper>
  </Box>
  {/* Top Products Card */}
  <Paper sx={{ flex: 2, borderRadius: 3, p: 3, bgcolor: cardBg, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
            {/* Right: See all card */}
            <Paper sx={{ width: 270, maxWidth: 270, borderRadius: 3, p: 3, bgcolor: cardBg, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', position: 'relative', top: 0, ml: { xs: 0, md: 3 }, flexShrink: 0, boxSizing: 'border-box', height: 'fit-content', alignSelf: 'flex-start', minWidth: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography fontWeight={600} sx={{ fontFamily, color: '#333', fontSize: 16 }}>See all</Typography>
              </Box>
      
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #f0f0f0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: blue, fontSize: 14 }}>
                      <span role="img" aria-label="plan">📅</span>
                    </Box>
                    <Box>
                      <Typography fontWeight={500} fontSize={13} sx={{ fontFamily, color: '#333' }}>Netflix Standard Plan</Typography>
                      <Typography fontSize={11} color="#888" sx={{ fontFamily }}>25 April at 09:30 am</Typography>
                    </Box>
                  </Box>
                  <Typography fontWeight={600} fontSize={13} sx={{ fontFamily, color: '#333' }}>₹ 1200</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #f0f0f0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: '#d1fadf', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#16a34a', fontSize: 14 }}>
                      <span role="img" aria-label="shopping">🛒</span>
                    </Box>
                    <Box>
                      <Typography fontWeight={500} fontSize={13} sx={{ fontFamily, color: '#333' }}>Online Shopping</Typography>
                      <Typography fontSize={11} color="#888" sx={{ fontFamily }}>25 April at 09:30 am</Typography>
                    </Box>
                  </Box>
                  <Typography fontWeight={600} fontSize={13} sx={{ fontFamily, color: '#333' }}>₹ 11,232</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #f0f0f0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: '#ffe4e6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#be123c', fontSize: 14 }}>
                      <span role="img" aria-label="wedding">💒</span>
                    </Box>
                    <Box>
                      <Typography fontWeight={500} fontSize={13} sx={{ fontFamily, color: '#333' }}>Wedding Photography</Typography>
                      <Typography fontSize={11} color="#888" sx={{ fontFamily }}>25 April at 08:30 am</Typography>
                    </Box>
                  </Box>
                  <Typography fontWeight={600} fontSize={13} sx={{ fontFamily, color: '#333' }}>₹ 45,200</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: blue, fontSize: 14 }}>
                      <span role="img" aria-label="hotstar">📺</span>
                    </Box>
                    <Box>
                      <Typography fontWeight={500} fontSize={13} sx={{ fontFamily, color: '#333' }}>Hotstar Premium plan</Typography>
                      <Typography fontSize={11} color="#888" sx={{ fontFamily }}>25 April at 09:30 am</Typography>
                    </Box>
                  </Box>
                  <Typography fontWeight={600} fontSize={13} sx={{ fontFamily, color: '#333' }}>₹ 799</Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
} 