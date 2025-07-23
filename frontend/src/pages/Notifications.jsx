import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Box, Paper, Typography, Avatar, IconButton, Divider, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Snackbar, SnackbarContent, Checkbox } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Loader from '../components/Loader';

const SIDEBAR_WIDTH = 240;
const SIDEBAR_MINI = 64;
const cardBg = '#fff';
const blue = '#2563eb';
const fontFamily = 'Poppins, sans-serif';

const NotificationItem = ({ notification, checked, onCheck, onDelete }) => {
  const { details, date, user, avatar } = notification;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, px: 1 }}>
      <Checkbox checked={checked} onChange={onCheck} sx={{ color: blue }} />
      <Avatar src={avatar} alt={user} sx={{ width: 40, height: 40, bgcolor: '#e0e7ff', color: blue, fontWeight: 700, fontFamily }} />
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontWeight: 600, fontFamily, fontSize: 16, color: '#222', mb: 0.5 }}>{details}</Typography>
        <Typography sx={{ fontFamily, fontSize: 13, color: '#888' }}>{date}</Typography>
      </Box>
      <IconButton onClick={onDelete} sx={{ color: '#ef4444' }} aria-label="Delete notification">
        <DeleteIcon />
      </IconButton>
    </Box>
  );
};

export default function Notifications() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsData, setNotificationsData] = useState(null);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [undoOpen, setUndoOpen] = useState(false);
  const [lastNotifications, setLastNotifications] = useState([]);
  const [selected, setSelected] = useState([]);
  const [undoMessage, setUndoMessage] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'notifications', 'main'), (docSnap) => {
      setNotificationsData(docSnap.data());
    });
    return () => unsub();
  }, []);

  if (!notificationsData) return <Loader />;

  // Sort notifications latest first
  const notifications = (notificationsData.notifications || []).slice().reverse();
  const visibleNotifications = showAllNotifications ? notifications : notifications.slice(0, 15);
  const hasMore = notifications.length > 15;

  // --- Handlers and helpers below ---
  const handleCheck = idx => {
    setSelected(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;
    const notificationsRef = doc(db, 'notifications', 'main');
    setLastNotifications(notificationsData.notifications || []);
    setUndoMessage('Selected notifications deleted');
    const newNotifications = (notificationsData.notifications || []).filter((_, idx) => !selected.includes(notifications.length - 1 - idx));
    await updateDoc(notificationsRef, { notifications: newNotifications });
    setSelected([]);
    setUndoOpen(true);
  };

  const handleDeleteOne = async (idx) => {
    const notificationsRef = doc(db, 'notifications', 'main');
    setLastNotifications(notificationsData.notifications || []);
    setUndoMessage('Notification deleted');
    const newNotifications = (notificationsData.notifications || []).filter((_, i) => i !== (notifications.length - 1 - idx));
    await updateDoc(notificationsRef, { notifications: newNotifications });
    setSelected(selected.filter(sel => sel !== idx));
    setUndoOpen(true);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(visibleNotifications.map((_, idx) => idx));
    } else {
      setSelected([]);
    }
  };

  const allSelected = selected.length === visibleNotifications.length && visibleNotifications.length > 0;

  const handleClearAll = async () => {
    setConfirmOpen(false);
    const notificationsRef = doc(db, 'notifications', 'main');
    setLastNotifications(notificationsData.notifications || []);
    await updateDoc(notificationsRef, { notifications: [] });
    setUndoOpen(true);
  };

  const handleUndo = async () => {
    setUndoOpen(false);
    const notificationsRef = doc(db, 'notifications', 'main');
    await updateDoc(notificationsRef, { notifications: lastNotifications });
  };

  // --- Render ---
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#eaf7f7' }}>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <Box
        component="main"
        sx={{
          flex: 1,
          ml: sidebarOpen ? `${SIDEBAR_WIDTH}px` : `${SIDEBAR_MINI}px`,
          transition: 'margin-left 0.3s',
          p: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Paper
          elevation={3}
          sx={{
            maxWidth: 1100,
            mx: 'auto',
            p: { xs: 3, sm: 4, md: 5 },
            bgcolor: cardBg,
            borderRadius: 4,
            boxShadow: '0 4px 24px rgba(37,99,235,0.10)',
            minHeight: 500,
          }}
        >
          <Typography variant="h5" fontWeight={700} sx={{ mb: 3, color: blue, fontFamily, letterSpacing: 0.5 }}>
            Notifications
          </Typography>

          {/* Regular Notifications */}
          {visibleNotifications.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, py: 6 }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 60, color: blue, mb: 2 }} />
              <Typography sx={{ fontFamily, color: blue, fontWeight: 700, fontSize: 22, mb: 1, textAlign: 'center' }}>
                You are up to date with stock
              </Typography>
              <Typography sx={{ fontFamily, color: '#666', fontSize: 16, textAlign: 'center' }}>
                Please check again later!
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Checkbox
                    checked={allSelected}
                    indeterminate={selected.length > 0 && selected.length < visibleNotifications.length}
                    onChange={handleSelectAll}
                    sx={{ color: blue }}
                  />
                  <Typography sx={{ fontFamily, fontWeight: 600, fontSize: 15, color: blue }}>
                    Select All
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="error"
                  disabled={selected.length === 0}
                  onClick={handleDeleteSelected}
                  sx={{
                    bgcolor: selected.length === 0 ? '#e0e7ff' : '#ef4444',
                    color: selected.length === 0 ? '#888' : '#fff',
                    fontFamily,
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    fontSize: 15,
                    boxShadow: '0 2px 8px rgba(37,99,235,0.08)',
                    mr: 2,
                    '&:hover': { bgcolor: selected.length === 0 ? '#e0e7ff' : '#b91c1c' }
                  }}
                >
                  Delete Selected
                </Button>
              </Box>
              {visibleNotifications.map((n, idx) => (
                <React.Fragment key={idx}>
                  <NotificationItem
                    notification={n}
                    checked={selected.includes(idx)}
                    onCheck={() => handleCheck(idx)}
                    onDelete={() => handleDeleteOne(idx)}
                  />
                  {idx < visibleNotifications.length - 1 && <Divider sx={{ borderColor: '#e5e7eb' }} />}
                </React.Fragment>
              ))}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 2 }}>
                {hasMore && !showAllNotifications && (
                  <Button variant="outlined" onClick={() => setShowAllNotifications(true)} sx={{ fontFamily, color: blue, borderColor: blue, fontWeight: 600 }}>
                    Show More
                  </Button>
                )}
                {showAllNotifications && hasMore && (
                  <Button variant="outlined" onClick={() => setShowAllNotifications(false)} sx={{ fontFamily, color: blue, borderColor: blue, fontWeight: 600 }}>
                    Show Less
                  </Button>
                )}
                <Button
                  variant="contained"
                  onClick={() => setConfirmOpen(true)}
                  sx={{
                    bgcolor: blue,
                    color: '#fff',
                    fontFamily,
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    fontSize: 15,
                    boxShadow: '0 2px 8px rgba(37,99,235,0.08)',
                    '&:hover': { bgcolor: '#1749b1' }
                  }}
                >
                  Clear All
                </Button>
              </Box>
              <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}
                PaperProps={{
                  sx: {
                    borderRadius: 4,
                    boxShadow: '0 4px 24px rgba(37,99,235,0.10)',
                    p: 1,
                    minWidth: 350,
                    fontFamily,
                  }
                }}
              >
                <DialogTitle sx={{ color: blue, fontFamily, fontWeight: 700, textAlign: 'center', fontSize: 22, pb: 0 }}>
                  Clear All Notifications?
                </DialogTitle>
                <DialogContent>
                  <DialogContentText sx={{ fontFamily, color: '#555', textAlign: 'center', fontSize: 16, mt: 1 }}>
                    Are you sure you want to clear all notifications? This action cannot be undone.
                  </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button onClick={() => setConfirmOpen(false)} sx={{ color: blue, fontFamily, fontWeight: 600, fontSize: 15 }}>
                    Cancel
                  </Button>
                  <Button onClick={handleClearAll}
                    variant="contained"
                    sx={{
                      bgcolor: blue,
                      color: '#fff',
                      fontFamily,
                      fontWeight: 700,
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      fontSize: 15,
                      boxShadow: '0 2px 8px rgba(37,99,235,0.08)',
                      '&:hover': { bgcolor: '#1749b1' }
                    }}
                  >
                    Clear All
                  </Button>
                </DialogActions>
              </Dialog>
              <Snackbar
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                open={undoOpen}
                autoHideDuration={4000}
                onClose={() => setUndoOpen(false)}
              >
                <SnackbarContent
                  sx={{
                    bgcolor: blue,
                    color: '#fff',
                    borderRadius: 2,
                    fontWeight: 600,
                    fontFamily,
                    boxShadow: '0 4px 24px rgba(37,99,235,0.10)',
                    minWidth: 260,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  message={undoMessage || "All notifications cleared"}
                  action={
                    <Button onClick={handleUndo} sx={{ color: '#fff', fontWeight: 700, ml: 2 }}>
                      UNDO
                    </Button>
                  }
                />
              </Snackbar>
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
} 