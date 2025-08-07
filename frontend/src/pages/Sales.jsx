import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Box, Paper, Typography, Button, IconButton, InputBase, Tabs, Tab, Select, FormControl, InputLabel, Popover, TextField, Slider } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import Loader from '../components/Loader';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import { useSidebar } from '../context/SidebarContext';

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
  const { sidebarOpen } = useSidebar();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [sales, setSales] = useState(null);
  const [overviewMode, setOverviewMode] = useState('revenue'); // 'revenue', 'expense', or 'quantity'
  const [productFilter, setProductFilter] = useState('All');
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [filterPrice, setFilterPrice] = useState([0, 1000000]);
  const [filterItem, setFilterItem] = useState('All');
  const [filterPayment, setFilterPayment] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' for latest first, 'asc' for oldest first
  const [filterMinQty, setFilterMinQty] = useState('');
  const [filterMaxQty, setFilterMaxQty] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [actionRow, setActionRow] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editPayment, setEditPayment] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteOrder, setDeleteOrder] = useState(null);
  const [undoSnackbarOpen, setUndoSnackbarOpen] = useState(false);
  const [lastDeletedOrder, setLastDeletedOrder] = useState(null);
  const [lastDeletedIndex, setLastDeletedIndex] = useState(null);
  // Filtered orders for search and filters
  const filteredOrders = (sales && sales.orders ? sales.orders : []).filter(order => {
    const matchesSearch =
      String(order.id || '').toLowerCase().includes(search.toLowerCase()) ||
      String(order.product || '').toLowerCase().includes(search.toLowerCase()) ||
      String(order.customer || '').toLowerCase().includes(search.toLowerCase());
    const matchesPrice = order.price >= filterPrice[0] && order.price <= filterPrice[1];
    const matchesItem = filterItem === 'All' || order.product === filterItem;
    const matchesPayment = filterPayment === 'All' || order.payment === filterPayment;
    const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
    const matchesCustomer = !filterCustomer || (order.customer && order.customer.toLowerCase().includes(filterCustomer.toLowerCase()));
    const qty = order.predicted_quantity_sold ?? 0;
    const matchesMinQty = filterMinQty === '' || qty >= Number(filterMinQty);
    const matchesMaxQty = filterMaxQty === '' || qty <= Number(filterMaxQty);
    return matchesSearch && matchesPrice && matchesItem && matchesPayment && matchesStatus && matchesCustomer && matchesMinQty && matchesMaxQty;
  })
  .sort((a, b) => {
    const dateA = a.date && a.date.toDate ? a.date.toDate() : new Date(a.date);
    const dateB = b.date && b.date.toDate ? b.date.toDate() : new Date(b.date);
    if (sortOrder === 'desc') return dateB - dateA;
    return dateA - dateB;
  });
  const [selectedOrders, setSelectedOrders] = useState([]);
  const isAllSelected = filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length;
  const isIndeterminate = selectedOrders.length > 0 && selectedOrders.length < filteredOrders.length;

  const handleActionClick = (event, row) => {
    setActionAnchorEl(event.currentTarget);
    setActionRow(row);
  };
  const handleActionClose = () => {
    setActionAnchorEl(null);
    setActionRow(null);
  };
  const handleViewDetails = () => {
    setViewOrder(actionRow);
    setViewDialogOpen(true);
    handleActionClose();
  };
  const handleEdit = () => {
    setEditOrder(actionRow);
    setEditStatus(actionRow?.status || '');
    setEditPayment(actionRow?.payment || '');
    setEditDialogOpen(true);
    handleActionClose();
  };
  const handleDelete = () => {
    setDeleteOrder(actionRow);
    setDeleteDialogOpen(true);
    handleActionClose();
  };
  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditOrder(null);
  };
  const handleEditSave = () => {
    // Update the order in local state (for demo)
    if (editOrder) {
      setSales(prev => ({
        ...prev,
        orders: prev.orders.map(order =>
          order.id === editOrder.id ? { ...order, status: editStatus, payment: editPayment } : order
        )
      }));
    }
    setEditDialogOpen(false);
    setEditOrder(null);
  };
  const handleViewDialogClose = () => {
    setViewDialogOpen(false);
    setViewOrder(null);
  };
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setDeleteOrder(null);
  };
  const handleDeleteConfirm = () => {
    if (deleteOrder) {
      setSales(prev => {
        const idx = prev.orders.findIndex(order => order.id === deleteOrder.id);
        setLastDeletedOrder(deleteOrder);
        setLastDeletedIndex(idx);
        return {
          ...prev,
          orders: prev.orders.filter(order => order.id !== deleteOrder.id)
        };
      });
      setUndoSnackbarOpen(true);
    }
    setDeleteDialogOpen(false);
    setDeleteOrder(null);
  };
  const handleUndo = () => {
    if (lastDeletedOrder !== null && lastDeletedIndex !== null) {
      setSales(prev => {
        const newOrders = [...prev.orders];
        newOrders.splice(lastDeletedIndex, 0, lastDeletedOrder);
        return { ...prev, orders: newOrders };
      });
    }
    setUndoSnackbarOpen(false);
    setLastDeletedOrder(null);
    setLastDeletedIndex(null);
  };
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setUndoSnackbarOpen(false);
    setLastDeletedOrder(null);
    setLastDeletedIndex(null);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrders(filteredOrders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };
  const handleSelectOne = (id) => (e) => {
    if (e.target.checked) {
      setSelectedOrders(prev => [...prev, id]);
    } else {
      setSelectedOrders(prev => prev.filter(selectedId => selectedId !== id));
    }
  };
  // Bulk delete
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeletedOrders, setBulkDeletedOrders] = useState([]);
  const [bulkUndoSnackbarOpen, setBulkUndoSnackbarOpen] = useState(false);
  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true);
  };
  const handleBulkDeleteConfirm = () => {
    const toDelete = filteredOrders.filter(order => selectedOrders.includes(order.id));
    setBulkDeletedOrders(toDelete);
    setSales(prev => ({
      ...prev,
      orders: prev.orders.filter(order => !selectedOrders.includes(order.id))
    }));
    setSelectedOrders([]);
    setBulkDeleteDialogOpen(false);
    setBulkUndoSnackbarOpen(true);
  };
  const handleBulkDeleteDialogClose = () => {
    setBulkDeleteDialogOpen(false);
  };
  const handleBulkUndo = () => {
    setSales(prev => ({
      ...prev,
      orders: [...prev.orders, ...bulkDeletedOrders]
    }));
    setBulkDeletedOrders([]);
    setBulkUndoSnackbarOpen(false);
  };
  const handleBulkSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setBulkUndoSnackbarOpen(false);
    setBulkDeletedOrders([]);
  };

  // Download filtered orders as CSV
  const handleDownloadCSV = () => {
    if (!filteredOrders.length) return;
    const headers = [
      'Order ID', 'Product', 'Customer', 'Price', 'Date', 'Payment', 'Status', 'Predicted Quantity Sold'
    ];
    const rows = filteredOrders.map(order => [
      order.id,
      order.product,
      order.customer,
      order.price,
      order.date && order.date.toDate ? order.date.toDate().toLocaleString() : String(order.date),
      order.payment,
      order.status,
      order.predicted_quantity_sold !== undefined ? order.predicted_quantity_sold : ''
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales_orders.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download filtered orders as PDF (with alignment)
  const handleDownloadPDF = () => {
    if (!filteredOrders.length) return;
    const headers = [
      'Order ID', 'Product', 'Customer', 'Price', 'Date', 'Payment', 'Status', 'Predicted Quantity Sold'
    ];
    const rows = filteredOrders.map(order => [
      order.id,
      order.product,
      order.customer,
      order.price,
      order.date && order.date.toDate ? order.date.toDate().toLocaleString() : String(order.date),
      order.payment,
      order.status,
      order.predicted_quantity_sold !== undefined ? order.predicted_quantity_sold : ''
    ]);
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    autoTable(pdf, {
      head: [headers],
      body: rows,
      startY: 40,
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      margin: { left: 30, right: 30 },
      tableWidth: 'auto',
    });
    pdf.save('sales_orders.pdf');
  };

  // Download menu state
  const [downloadAnchor, setDownloadAnchor] = useState(null);
  const handleDownloadMenuOpen = (e) => setDownloadAnchor(e.currentTarget);
  const handleDownloadMenuClose = () => setDownloadAnchor(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'sales', 'main'), (docSnap) => {
      setSales(docSnap.data());
    });
    return () => unsub();
  }, []);

  if (!sales) return <Loader />;

  // Get unique product names for filter
  const productNames = ['All', ...Array.from(new Set((sales.orders || []).map(order => order.product).filter(Boolean)))];

  // Get min/max price for slider
  const prices = (sales.orders || []).map(order => order.price || 0);
  const minPrice = Math.min(...prices, 0);
  const maxPrice = Math.max(...prices, 1000);

  // Get unique payment and status values
  const paymentOptions = ['All', ...Array.from(new Set((sales.orders || []).map(order => order.payment).filter(Boolean)))];
  const statusOptions = ['All', ...Array.from(new Set((sales.orders || []).map(order => order.status).filter(Boolean)))];

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

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: isDark ? '#10151a' : '#eaf6fa' }}>
      <Sidebar />
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
          px: 4, // Add equal horizontal padding
        }}
      >
        {/* Top Section */}
        <Box sx={{ display: 'flex', gap: 3, mt: 3, mb: 3, height: 320 }}>
          {/* Financial Overview */}
          <Paper elevation={2} sx={{ flex: 1, borderRadius: 3, p: 3, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', bgcolor: isDark ? '#181f23' : '#fff', boxShadow: isDark ? theme.palette.glow : 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography fontWeight={600} fontSize={18} sx={{ fontFamily: 'Poppins, sans-serif', color: isDark ? '#f3f6fd' : '#2563eb' }}>Financial Overview</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {overviewMode === 'quantity' && (
                  <FormControl size="small" sx={{ minWidth: 160, mr: 2 }}>
                    <InputLabel id="product-filter-label" sx={{ color: isDark ? '#f3f6fd' : '#555' }}>Product</InputLabel>
                    <Select
                      labelId="product-filter-label"
                      value={productFilter}
                      label="Product"
                      onChange={e => setProductFilter(e.target.value)}
                      sx={{ color: isDark ? '#f3f6fd' : '#555', bgcolor: isDark ? '#181f23' : '#fff', borderRadius: 2 }}
                    >
                      {productNames.map(name => (
                        <MenuItem key={name} value={name} sx={{ color: isDark ? '#f3f6fd' : '#555' }}>{name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                <Button
                  size="small"
                  sx={{ color: overviewMode === 'revenue' ? '#fff' : '#555', background: overviewMode === 'revenue' ? '#2563eb' : 'transparent', textTransform: 'none', fontWeight: 500, mr: 1, borderRadius: 2, '&:hover': { background: alpha('#2563eb', 0.1) } }}
                  onClick={() => setOverviewMode('revenue')}
                  variant={overviewMode === 'revenue' ? 'contained' : 'outlined'}
                >
                  Revenue
                </Button>
                <Button
                  size="small"
                  sx={{ color: overviewMode === 'expense' ? '#fff' : '#555', background: overviewMode === 'expense' ? '#2563eb' : 'transparent', textTransform: 'none', fontWeight: 500, mr: 1, borderRadius: 2, '&:hover': { background: alpha('#2563eb', 0.1) } }}
                  onClick={() => setOverviewMode('expense')}
                  variant={overviewMode === 'expense' ? 'contained' : 'outlined'}
                >
                  Expense
                </Button>
                <Button
                  size="small"
                  sx={{ color: overviewMode === 'quantity' ? '#fff' : '#555', background: overviewMode === 'quantity' ? '#2563eb' : 'transparent', textTransform: 'none', fontWeight: 500, borderRadius: 2, '&:hover': { background: alpha('#2563eb', 0.1) } }}
                  onClick={() => setOverviewMode('quantity')}
                  variant={overviewMode === 'quantity' ? 'contained' : 'outlined'}
                >
                  Quantity Sold
                </Button>
              </Box>
            </Box>
            <div id="financial-overview-chart">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={filteredFinancialData} margin={{ top: 10, right: 20, left: 40, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} dy={10} />
                  <YAxis axisLine={false} tickLine={false} domain={["dataMin", "auto"]} />
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
            </div>
          </Paper>
          
        </Box>
        {/* Orders Table Section */}
        <Paper elevation={2} sx={{ flex: 1, borderRadius: 3, p: 3, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: isDark ? '#181f23' : '#fff', boxShadow: isDark ? theme.palette.glow : 3,mb: 1.5}}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography fontWeight={600} fontSize={18} sx={{ fontFamily: 'Poppins, sans-serif', color: isDark ? '#f3f6fd' : '#2563eb' }}>Sales Transactions</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleDownloadMenuOpen}
              sx={{ fontFamily: 'Poppins, sans-serif', textTransform: 'none', borderRadius: 2, color: isDark ? theme.palette.primary.main : '#2563eb', borderColor: isDark ? theme.palette.primary.main : '#2563eb', '&:hover': { background: alpha('#2563eb', 0.08) } }}
            >
              Download
            </Button>
            <Menu
              anchorEl={downloadAnchor}
              open={Boolean(downloadAnchor)}
              onClose={handleDownloadMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              PaperProps={{
                sx: {
                  fontFamily: 'Poppins, sans-serif',
                  borderRadius: 2,
                  minWidth: 140,
                  boxShadow: 3,
                  mt: 1,
                  p: 0,
                  bgcolor: isDark ? '#181f23' : '#fff',
                  border: '1px solid',
                  borderColor: isDark ? theme.palette.divider : '#e0e0e0',
                }
              }}
              MenuListProps={{
                sx: {
                  p: 0,
                }
              }}
            >
              <MenuItem
                onClick={() => { handleDownloadCSV(); handleDownloadMenuClose(); }}
                sx={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: 15,
                  py: 1.2,
                  px: 2,
                  borderRadius: 2,
                  gap: 1.5,
                  '&:hover': {
                    backgroundColor: alpha('#2563eb', 0.08),
                  },
                  color: isDark ? '#f3f6fd' : '#555',
                  bgcolor: isDark ? '#181f23' : '#fff',
                }}
              >
                <FileDownloadIcon fontSize="small" sx={{ mr: 1, color: '#2563eb' }} /> CSV
              </MenuItem>
              <MenuItem
                onClick={() => { handleDownloadPDF(); handleDownloadMenuClose(); }}
                sx={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: 15,
                  py: 1.2,
                  px: 2,
                  borderRadius: 2,
                  gap: 1.5,
                  '&:hover': {
                    backgroundColor: alpha('#be123c', 0.08),
                  },
                  color: isDark ? '#f3f6fd' : '#555',
                  bgcolor: isDark ? '#181f23' : '#fff',
                }}
              >
                <PictureAsPdfIcon fontSize="small" sx={{ mr: 1, color: '#be123c' }} /> PDF
              </MenuItem>
            </Menu>
            <Button
              variant="outlined"
              size="small"
              sx={{ fontFamily: 'Poppins, sans-serif', textTransform: 'none', borderRadius: 2, bgcolor: '#fff' }}
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            >
              Sort by: {sortOrder === 'desc' ? 'Latest ⬇' : 'Oldest ⬆'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={e => setFilterAnchor(e.currentTarget)}
              sx={{ fontFamily: 'Poppins, sans-serif', textTransform: 'none', borderRadius: 2, color: isDark ? theme.palette.primary.main : '#2563eb', borderColor: isDark ? theme.palette.primary.main : '#2563eb', '&:hover': { background: alpha('#2563eb', 0.08) } }}
            >
              Filters
            </Button>
            <Popover
              open={Boolean(filterAnchor)}
              anchorEl={filterAnchor}
              onClose={() => setFilterAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              PaperProps={{
                sx: {
                  p: 3,
                  width: 340,
                  bgcolor: isDark ? '#181f23' : '#f9fafb',
                  borderRadius: 3,
                  boxShadow: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  border: '1px solid',
                  borderColor: isDark ? theme.palette.divider : '#e0e0e0',
                }
              }}
            >
              <Typography fontWeight={700} fontSize={18} mb={1} color="#222" sx={{ fontFamily: 'Poppins, sans-serif', color: isDark ? '#f3f6fd' : '#222' }}>Filter Orders</Typography>
                {/* Customer Name Filter */}
                <TextField
                  size="small"
                  label="Customer Name"
                  value={filterCustomer}
                  onChange={e => setFilterCustomer(e.target.value)}
                  sx={{ mb: 2, bgcolor: '#fff', borderRadius: 2, fontFamily: 'Poppins, sans-serif', color: isDark ? '#f3f6fd' : '#555' }}
                />
                {/* Predicted Quantity Sold Filter */}
                <Box mb={1}>
                  <Typography variant="body2" fontWeight={600} color="#2563eb" mb={0.5} sx={{ fontFamily: 'Poppins, sans-serif', color: isDark ? '#f3f6fd' : '#2563eb' }}>Predicted Quantity Sold</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                    <TextField
                      size="small"
                      type="number"
                      label="Min"
                      value={filterMinQty}
                      onChange={e => setFilterMinQty(e.target.value)}
                      sx={{ flex: 1, bgcolor: '#fff', borderRadius: 2, fontFamily: 'Poppins, sans-serif', color: isDark ? '#f3f6fd' : '#555' }}
                    />
                    <TextField
                      size="small"
                      type="number"
                      label="Max"
                      value={filterMaxQty}
                      onChange={e => setFilterMaxQty(e.target.value)}
                      sx={{ flex: 1, bgcolor: '#fff', borderRadius: 2, fontFamily: 'Poppins, sans-serif', color: isDark ? '#f3f6fd' : '#555' }}
                    />
                  </Box>
                </Box>
                <Box mb={1}>
                  <Typography variant="body2" fontWeight={600} color="#2563eb" mb={0.5} sx={{ fontFamily: 'Poppins, sans-serif', color: isDark ? '#f3f6fd' : '#2563eb' }}>Price Range (₹)</Typography>
                  <Slider
                    value={filterPrice}
                    min={minPrice}
                    max={maxPrice}
                    onChange={(_, v) => setFilterPrice(v)}
                    valueLabelDisplay="auto"
                    sx={{ color: '#2563eb', mb: 1 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                    <TextField
                      size="small"
                      type="number"
                      label="Min"
                      value={filterPrice[0]}
                      onChange={e => setFilterPrice([Number(e.target.value), filterPrice[1]])}
                      sx={{ flex: 1, bgcolor: '#fff', borderRadius: 2, fontFamily: 'Poppins, sans-serif', color: isDark ? '#f3f6fd' : '#555' }}
                      inputProps={{ min: minPrice, max: filterPrice[1] }}
                    />
                    <TextField
                      size="small"
                      type="number"
                      label="Max"
                      value={filterPrice[1]}
                      onChange={e => setFilterPrice([filterPrice[0], Number(e.target.value)])}
                      sx={{ flex: 1, bgcolor: '#fff', borderRadius: 2, fontFamily: 'Poppins, sans-serif', color: isDark ? '#f3f6fd' : '#555' }}
                      inputProps={{ min: filterPrice[0], max: maxPrice }}
                    />
                  </Box>
                </Box>
                <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                  <InputLabel sx={{ color: isDark ? '#f3f6fd' : '#555' }}>Item Name</InputLabel>
                  <Select
                    value={filterItem}
                    label="Item Name"
                    onChange={e => setFilterItem(e.target.value)}
                    sx={{ bgcolor: '#fff', borderRadius: 2, color: isDark ? '#f3f6fd' : '#555' }}
                  >
                    <MenuItem value="All" sx={{ color: isDark ? '#f3f6fd' : '#555' }}>All</MenuItem>
                    {productNames.slice(1).map(name => (
                      <MenuItem key={name} value={name} sx={{ color: isDark ? '#f3f6fd' : '#555' }}>{name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                  <InputLabel sx={{ color: isDark ? '#f3f6fd' : '#555' }}>Payment</InputLabel>
                  <Select
                    value={filterPayment}
                    label="Payment"
                    onChange={e => setFilterPayment(e.target.value)}
                    sx={{ bgcolor: '#fff', borderRadius: 2, color: isDark ? '#f3f6fd' : '#555' }}
                  >
                    {paymentOptions.map(option => (
                      <MenuItem key={option} value={option} sx={{ color: isDark ? '#f3f6fd' : '#555' }}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                  <InputLabel sx={{ color: isDark ? '#f3f6fd' : '#555' }}>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={e => setFilterStatus(e.target.value)}
                    sx={{ bgcolor: '#fff', borderRadius: 2, color: isDark ? '#f3f6fd' : '#555' }}
                  >
                    {statusOptions.map(option => (
                      <MenuItem key={option} value={option} sx={{ color: isDark ? '#f3f6fd' : '#555' }}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  color="secondary"
                  sx={{ mt: 1, borderRadius: 2, textTransform: 'none', fontWeight: 500, fontFamily: 'Poppins, sans-serif', color: isDark ? theme.palette.primary.main : '#2563eb', borderColor: isDark ? theme.palette.primary.main : '#2563eb', '&:hover': { background: alpha('#2563eb', 0.08) } }}
                  onClick={() => {
                    setFilterPrice([minPrice, maxPrice]);
                    setFilterItem('All');
                    setFilterPayment('All');
                    setFilterStatus('All');
                    setFilterMinQty('');
                    setFilterMaxQty('');
                    setFilterCustomer('');
                  }}
                >
                  Clear Filters
                </Button>
            </Popover>
          </Box>
        </Box>
          {/* Table */}
          <Box sx={{ overflow: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
              <thead>
                <tr style={{ color: '#6b7280', textAlign: 'left', background: '#f9fafb' }}>
                  <th style={{ padding: '10px 8px' }}></th>
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
                    <td style={{ padding: '10px 8px' }}></td>
                    <td style={{ padding: '10px 8px', color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}>{order.id}<br /><span style={{ color: '#6b7280', fontWeight: 400, fontSize: 13 }}>{order.product}</span></td>
                    <td style={{ padding: '10px 8px' }}>{order.customer}</td>
                    <td style={{ padding: '10px 8px' }}>₹{order.price.toFixed(2)}</td>
                    <td style={{ padding: '10px 8px' }}>{order.date && order.date.toDate ? order.date.toDate().toLocaleString() : String(order.date)}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ background: badgeColor('payment', order.payment), color: badgeTextColor('payment', order.payment), padding: '2px 10px', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>{order.payment}</span>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ background: badgeColor('status', order.status), color: badgeTextColor('status', order.status), padding: '2px 10px', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>{order.status}</span>
                    </td>
                    <td style={{ padding: '10px 8px' }}>{order.predicted_quantity_sold !== undefined ? order.predicted_quantity_sold : '-'}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <IconButton size="small" onClick={e => handleActionClick(e, order)}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                      <Menu
                        anchorEl={actionAnchorEl}
                        open={Boolean(actionAnchorEl) && actionRow?.id === order.id}
                        onClose={handleActionClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        PaperProps={{
                          sx: {
                            bgcolor: isDark ? '#181f23' : '#f9fafb',
                            border: '1px solid',
                            borderColor: isDark ? theme.palette.divider : '#e0e0e0',
                            boxShadow: 3,
                          }
                        }}
                      >
                        <MenuItem onClick={handleViewDetails} sx={{ color: isDark ? '#f3f6fd' : '#555' }}>View Details</MenuItem>
                        <MenuItem onClick={handleEdit} sx={{ color: isDark ? '#f3f6fd' : '#555' }}>Edit</MenuItem>
                        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>Delete/Cancel</MenuItem>
                      </Menu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Paper>
      </Box>
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditDialogClose} PaperProps={{ sx: { bgcolor: '#f9fafb', borderRadius: 3, fontFamily: 'Poppins, sans-serif' } }}>
        <DialogTitle sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 22 }}>Edit Order</DialogTitle>
        <DialogContent sx={{ minWidth: 340, fontFamily: 'Poppins, sans-serif', p: 3 }}>
          <FormControl fullWidth size="small" sx={{ mt: 2, mb: 3, fontFamily: 'Poppins, sans-serif' }} variant="outlined">
            <InputLabel sx={{ fontFamily: 'Poppins, sans-serif', color: isDark ? '#f3f6fd' : '#555' }} shrink>Status</InputLabel>
            <Select
              value={editStatus}
              label="Status"
              onChange={e => setEditStatus(e.target.value)}
              sx={{ bgcolor: '#fff', borderRadius: 2, fontFamily: 'Poppins, sans-serif', color: isDark ? '#f3f6fd' : '#555' }}
            >
              {statusOptions.filter(option => option !== 'All').map(option => (
                <MenuItem key={option} value={option} sx={{ fontFamily: 'Poppins, sans-serif', color: isDark ? '#f3f6fd' : '#555' }}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" sx={{ fontFamily: 'Poppins, sans-serif' }} variant="outlined">
            <InputLabel sx={{ fontFamily: 'Poppins, sans-serif', color: isDark ? '#f3f6fd' : '#555' }} shrink>Payment</InputLabel>
            <Select
              value={editPayment}
              label="Payment"
              onChange={e => setEditPayment(e.target.value)}
              sx={{ bgcolor: '#fff', borderRadius: 2, fontFamily: 'Poppins, sans-serif', color: isDark ? '#f3f6fd' : '#555' }}
            >
              {paymentOptions.filter(option => option !== 'All').map(option => (
                <MenuItem key={option} value={option} sx={{ fontFamily: 'Poppins, sans-serif', color: isDark ? '#f3f6fd' : '#555' }}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleEditDialogClose} color="secondary" sx={{ fontFamily: 'Poppins, sans-serif', borderRadius: 2, textTransform: 'none', color: isDark ? theme.palette.primary.main : '#2563eb', '&:hover': { background: alpha('#2563eb', 0.08) } }}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" sx={{ fontFamily: 'Poppins, sans-serif', borderRadius: 2, textTransform: 'none', background: '#2563eb' }}>Save</Button>
        </DialogActions>
      </Dialog>
      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={handleViewDialogClose} PaperProps={{ sx: { bgcolor: '#f9fafb', borderRadius: 3, fontFamily: 'Poppins, sans-serif' } }}>
        <DialogTitle sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 22 }}>Order Details</DialogTitle>
        <DialogContent sx={{ minWidth: 340, fontFamily: 'Poppins, sans-serif', p: 3 }}>
          {viewOrder && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, fontFamily: 'Poppins, sans-serif' }}>
              <Box><b>ID:</b> {viewOrder.id}</Box>
              <Box><b>Product:</b> {viewOrder.product}</Box>
              <Box><b>Customer:</b> {viewOrder.customer}</Box>
              <Box><b>Price:</b> ₹{viewOrder.price?.toFixed(2)}</Box>
              <Box><b>Date:</b> {viewOrder.date && viewOrder.date.toDate ? viewOrder.date.toDate().toLocaleString() : String(viewOrder.date)}</Box>
              <Box><b>Payment:</b> {viewOrder.payment}</Box>
              <Box><b>Status:</b> {viewOrder.status}</Box>
              <Box><b>Predicted Quantity Sold:</b> {viewOrder.predicted_quantity_sold !== undefined ? viewOrder.predicted_quantity_sold : '-'}</Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleViewDialogClose} color="secondary" sx={{ fontFamily: 'Poppins, sans-serif', borderRadius: 2, textTransform: 'none', color: isDark ? theme.palette.primary.main : '#2563eb', '&:hover': { background: alpha('#2563eb', 0.08) } }}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* Delete/Cancel Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose} PaperProps={{ sx: { bgcolor: '#f9fafb', borderRadius: 3, fontFamily: 'Poppins, sans-serif' } }}>
        <DialogTitle sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 22 }}>Delete/Cancel Order</DialogTitle>
        <DialogContent sx={{ minWidth: 340, fontFamily: 'Poppins, sans-serif', p: 3 }}>
          <DialogContentText sx={{ fontFamily: 'Poppins, sans-serif' }}>
            Are you sure you want to delete/cancel this order?
          </DialogContentText>
          {deleteOrder && (
            <Box sx={{ mt: 2, fontFamily: 'Poppins, sans-serif', color: '#be123c' }}>
              <b>Order ID:</b> {deleteOrder.id}<br/>
              <b>Customer:</b> {deleteOrder.customer}<br/>
              <b>Product:</b> {deleteOrder.product}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteDialogClose} color="secondary" sx={{ fontFamily: 'Poppins, sans-serif', borderRadius: 2, textTransform: 'none', color: isDark ? theme.palette.primary.main : '#2563eb', '&:hover': { background: alpha('#2563eb', 0.08) } }}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" sx={{ fontFamily: 'Poppins, sans-serif', borderRadius: 2, textTransform: 'none', background: '#be123c' }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 