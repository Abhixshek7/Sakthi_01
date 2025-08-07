import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Notifications from "./pages/Notifications";
import Admin from "./pages/Admin";
import { UserProvider } from "./context/UserContext";
import { SidebarProvider } from "./context/SidebarContext";
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

// Notification Context
export const NotificationContext = createContext();

function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [latestNotification, setLatestNotification] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Listen for notifications
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'notifications', 'main'), (docSnap) => {
      const data = docSnap.data();
      const notifs = data && data.notifications ? data.notifications : [];
      setNotifications(notifs);
      // Show popup for the latest notification if new
      if (notifs.length > 0 && (!latestNotification || notifs[notifs.length-1].date !== latestNotification.date)) {
        setLatestNotification(notifs[notifs.length-1]);
        setSnackbarOpen(true);
        setUnreadCount(c => c + 1);
      }
    });
    return () => unsub();
    // eslint-disable-next-line
  }, []);

  // Mark all as read when visiting /notifications
  useEffect(() => {
    if (location.pathname === '/notifications') {
      setUnreadCount(0);
    }
  }, [location.pathname]);

  const handleSnackbarClose = useCallback(() => {
    setSnackbarOpen(false);
  }, []);

  const handleSnackbarClick = useCallback(() => {
    setSnackbarOpen(false);
    navigate('/notifications');
  }, [navigate]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount }}>
      {children}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          sx={{ fontFamily: 'Poppins, sans-serif', background: '#2563eb', cursor: 'pointer' }}
          onClick={handleSnackbarClick}
        >
          {latestNotification?.details || 'New notification'}
        </MuiAlert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

function App() {
  return (
    <UserProvider>
      <SidebarProvider>
        <Router>
          <NotificationProvider>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </NotificationProvider>
        </Router>
      </SidebarProvider>
    </UserProvider>
  );
}

export default App;