import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Box, Paper, Typography, Avatar, IconButton, Divider } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import Loader from '../components/Loader';

const SIDEBAR_WIDTH = 240;
const SIDEBAR_MINI = 64;

const NotificationItem = ({ notification }) => {
  const { details, date, user, avatar } = notification;

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, py: 2 }}>
      <Avatar src={avatar} alt={user} sx={{ width: 40, height: 40 }} />
      <Box>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {details}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {date}
        </Typography>
      </Box>
    </Box>
  );
};

export default function Notifications() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsData, setNotificationsData] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'notifications', 'main'), (docSnap) => {
      setNotificationsData(docSnap.data());
    });
    return () => unsub();
  }, []);

  if (!notificationsData) return <Loader />;

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
          elevation={0}
          sx={{
            maxWidth: 1100,
            mx: 'auto',
            p: { xs: 2, sm: 3, md: 4 },
            bgcolor: '#fff',
            borderRadius: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
            Notifications
          </Typography>

          {/* Regular Notifications */}
          {(notificationsData.notifications || []).map((n, idx) => (
            <React.Fragment key={idx}>
              <NotificationItem notification={n} />
              {idx < notificationsData.notifications.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Paper>
      </Box>
    </Box>
  );
} 