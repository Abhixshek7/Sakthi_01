import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import { Box, Card, CardContent, Typography, Grid, Divider, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, LinearProgress } from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const pieData = [
  { name: "Online shopping", value: 1132.5, color: "#a99cff" },
  { name: "Car services", value: 1090.7, color: "#7c8aff" },
  { name: "Entertainments", value: 2302, color: "#b6b6f7" },
  { name: "Shopping", value: 2007.3, color: "#a3e0ff" },
];

const legendData = [
  { name: "Online shopping", value: 1132.5, color: "#a99cff" },
  { name: "Car services", value: 1090.7, color: "#7c8aff" },
  { name: "Entertainments", value: 2302, color: "#b6b6f7" },
  { name: "Shopping", value: 2007.3, color: "#a3e0ff" },
];

const transactions = [
  { name: "Netflix Standard Plan", amount: 1200, date: "25 April at 09:30 am" },
  { name: "Online Shopping", amount: 11232, date: "25 April at 09:30 am" },
  { name: "Wedding Photography", amount: 45200, date: "25 April at 09:30 am" },
  { name: "Hotstar Premium plan", amount: 799, date: "25 April at 09:30 am" },
];

const topProducts = [
  { name: "Basmati Rice", demand: 45, color: "#7c8aff" },
  { name: "Wheat", demand: 29, color: "#a3e0ff" },
  { name: "Bathroom Essentials", demand: 18, color: "#b6b6f7" },
  { name: "Snacks", demand: 25, color: "#ffa76d" },
];

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <Box
        sx={{
          flex: 1,
          ml: sidebarOpen ? '240px' : 0,
          transition: 'margin-left 0.3s',
          p: 3,
          bgcolor: '#eaf7f7',
          minHeight: '100vh',
        }}
      >
        {/* Top Row: Statistics and Transactions */}
        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          {/* Statistics Card */}
          <Paper sx={{ flex: 2, borderRadius: 3, p: 3, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Typography fontWeight={600} fontSize={18} mb={2}>Statistics</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ width: 180, height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={3}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ position: 'absolute', top: 90, left: 90, textAlign: 'center', width: 60 }}>
                  <Typography fontWeight={700} fontSize={22}>6870</Typography>
                  <Typography fontSize={13} color="#888">Total</Typography>
                </Box>
              </Box>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {legendData.map((item, idx) => (
                  <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, bgcolor: item.color, borderRadius: '50%' }} />
                    <Typography fontSize={15} fontWeight={500}>{item.name}</Typography>
                    <Typography fontSize={15} fontWeight={600} sx={{ ml: 1 }}>{item.value.toLocaleString()}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
          {/* Transactions Card */}
          <Paper sx={{ flex: 1, borderRadius: 3, p: 3, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography fontWeight={600}>See all</Typography>
            </Box>
            {transactions.map((tx, idx) => (
              <Box key={tx.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography fontWeight={500}>{tx.name}</Typography>
                  <Typography fontSize={12} color="text.secondary">{tx.date}</Typography>
                </Box>
                <Typography fontWeight={600} color="#222">₹ {tx.amount.toLocaleString()}</Typography>
              </Box>
            ))}
          </Paper>
        </Box>
        {/* Second Row: Balance and Top Products */}
        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          {/* Balance Cards */}
          <Paper sx={{ flex: 1, borderRadius: 3, p: 3, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 1 }}>
            <Typography fontSize={16} color="text.secondary">Balance</Typography>
            <Typography variant="h4" fontWeight={600} color="#2d6c8c">₹5,502.45</Typography>
            <Chip label={"+ 12,5%"} color="success" size="small" sx={{ fontWeight: 600 }} />
          </Paper>
          {/* Top Products Card */}
          <Paper sx={{ flex: 2, borderRadius: 3, p: 3, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography fontWeight={600} fontSize={18} mb={2}>Top Products</Typography>
            <Box>
              {topProducts.map((prod, idx) => (
                <Box key={prod.name} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography fontWeight={500} sx={{ width: 30 }}>{`0${idx + 1}`}</Typography>
                  <Typography fontWeight={500} sx={{ width: 120 }}>{prod.name}</Typography>
                  <Box sx={{ flex: 1, mx: 2 }}>
                    <Box sx={{ width: `${prod.demand}%`, height: 8, bgcolor: prod.color, borderRadius: 4 }} />
                  </Box>
                  <Typography fontWeight={600}>{prod.demand}%</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
          {/* Balance Card 2 */}
          <Paper sx={{ flex: 1, borderRadius: 3, p: 3, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 1 }}>
            <Typography fontSize={16} color="text.secondary">Balance</Typography>
            <Typography variant="h4" fontWeight={600} color="#2d6c8c">₹5,502.45</Typography>
            <Chip label={"+ 12,5%"} color="success" size="small" sx={{ fontWeight: 600 }} />
          </Paper>
        </Box>
        {/* Third Row: Cash Balance Cards */}
        <Box sx={{ display: 'flex', gap: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Paper key={i} sx={{ flex: 1, borderRadius: 3, p: 3, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Typography fontSize={15} color="text.secondary">Total Cash Balance</Typography>
              <Typography variant="h5" fontWeight={600}>15,2020</Typography>
            </Paper>
          ))}
        </Box>
      </Box>
    </Box>
  );
} 