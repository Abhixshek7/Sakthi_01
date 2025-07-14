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
    <Box sx={{ display: "flex" }}>
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
        <Grid container spacing={3}>
          {/* Statistics and Transactions */}
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} mb={1}>Statistics</Typography>
                    <Box sx={{ width: 300, height: 180 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            fill="#8884d8"
                            paddingAngle={3}
                          >
                            {pieData.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                  <Box sx={{ ml: 4 }}>
                    {legendData.map((item, idx) => (
                      <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ width: 12, height: 12, bgcolor: item.color, borderRadius: '50%', mr: 1 }} />
                        <Typography fontSize={15} fontWeight={500}>{item.name}</Typography>
                        <Typography fontSize={15} fontWeight={600} sx={{ ml: 1 }}>{item.value.toLocaleString()}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
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
              </CardContent>
            </Card>
          </Grid>

          {/* Balance and Top Products */}
          <Grid item xs={12} md={3}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography fontSize={16} color="text.secondary">Balance</Typography>
                <Typography variant="h4" fontWeight={600} color="#2d6c8c">₹5,502.45</Typography>
                <Chip label={"+ 12,5%"} color="success" size="small" sx={{ mt: 1, fontWeight: 600 }} />
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography fontSize={16} color="text.secondary">Balance</Typography>
                <Typography variant="h4" fontWeight={600} color="#2d6c8c">₹5,502.45</Typography>
                <Chip label={"+ 12,5%"} color="success" size="small" sx={{ mt: 1, fontWeight: 600 }} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography fontWeight={600} mb={2}>Top Products</Typography>
                <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Demand</TableCell>
                        <TableCell>Sales</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topProducts.map((prod, idx) => (
                        <TableRow key={prod.name}>
                          <TableCell>{`0${idx + 1}`}</TableCell>
                          <TableCell>{prod.name}</TableCell>
                          <TableCell>
                            <LinearProgress variant="determinate" value={prod.demand} sx={{ height: 8, borderRadius: 5, bgcolor: '#f0f0f0', '& .MuiLinearProgress-bar': { bgcolor: prod.color } }} />
                          </TableCell>
                          <TableCell>
                            <Typography fontWeight={600} color={prod.color}>{prod.demand}%</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
          {/* Total Cash Balance Cards */}
          <Grid item xs={12} md={3}>
            <Grid container spacing={2}>
              {[1, 2, 3, 4].map((i) => (
                <Grid item xs={6} key={i}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography fontSize={15} color="text.secondary">Total Cash Balance</Typography>
                      <Typography variant="h5" fontWeight={600}>15,2020</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
} 