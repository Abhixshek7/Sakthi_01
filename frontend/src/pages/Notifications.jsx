import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Box, Paper, Typography, Avatar, IconButton, Divider, Button } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import Loader from '../components/Loader';

const SIDEBAR_WIDTH = 240;
const SIDEBAR_MINI = 64;
const cardBg = '#fff';
const blue = '#2563eb';
const fontFamily = 'Poppins, sans-serif';

const NotificationItem = ({ notification }) => {
  const { details, date, user, avatar } = notification;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, px: 1 }}>
      <Avatar src={avatar} alt={user} sx={{ width: 40, height: 40, bgcolor: '#e0e7ff', color: blue, fontWeight: 700, fontFamily }} />
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontWeight: 600, fontFamily, fontSize: 16, color: '#222', mb: 0.5 }}>{details}</Typography>
        <Typography sx={{ fontFamily, fontSize: 13, color: '#888' }}>{date}</Typography>
      </Box>
    </Box>
  );
};

export default function Notifications() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsData, setNotificationsData] = useState(null);
  const [showAllNotifications, setShowAllNotifications] = useState(false);

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
          {visibleNotifications.map((n, idx) => (
            <React.Fragment key={idx}>
              <NotificationItem notification={n} />
              {idx < visibleNotifications.length - 1 && <Divider sx={{ borderColor: '#e5e7eb' }} />}
            </React.Fragment>
          ))}
          {hasMore && !showAllNotifications && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button variant="outlined" onClick={() => setShowAllNotifications(true)} sx={{ fontFamily, color: blue, borderColor: blue, fontWeight: 600 }}>
                Show More
              </Button>
            </Box>
          )}
          {showAllNotifications && hasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button variant="outlined" onClick={() => setShowAllNotifications(false)} sx={{ fontFamily, color: blue, borderColor: blue, fontWeight: 600 }}>
                Show Less
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
} 