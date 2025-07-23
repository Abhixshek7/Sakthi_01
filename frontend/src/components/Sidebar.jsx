import React, { useContext } from "react";
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText, Divider, Avatar, IconButton } from "@mui/material";
import { House, ShoppingCart, Bell, Gear, Question, SignOut } from "phosphor-react";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { UserContext } from "../context/UserContext";

const SIDEBAR_WIDTH = 240;
const SIDEBAR_MINI = 64;

const navItems = [
  { label: "Dashboard", icon: House, to: "/dashboard" },
  { label: "Sales", icon: ShoppingCart, to: "/sales" },
  { label: "Notifications", icon: Bell, to: "/notifications" },
  { label: "Settings", icon: Gear, to: "/settings" },
  { label: "Help", icon: Question, to: "/help" },
];
const bottomItems = [
  { label: "Log out", icon: SignOut, action: "logout" },
];

const Sidebar = ({ open, setOpen }) => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <Box sx={{
      width: open ? SIDEBAR_WIDTH : SIDEBAR_MINI,
      bgcolor: '#fff',
      color: '#222',
      boxShadow: '0 2px 8px rgba(37,99,235,0.08)',
      position: 'fixed',
      height: '100vh',
      zIndex: 1200,
      transition: 'width 0.3s',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #e5e7eb',
    }}>
      {/* User Info */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'flex-start' : 'center',
          mb: 3,
          mt: 2,
          px: open ? 2 : 0,
          minHeight: 56,
          transition: 'all 0.3s',
        }}
      >
        <Avatar src={user?.photoURL} sx={{ bgcolor: "#c8e6c9", mr: open ? 2 : 0, width: 40, height: 40, transition: 'margin 0.3s' }} />
        {open && (
          <Typography fontWeight={600} fontSize={18} color="#111" noWrap>
            {user?.displayName || user?.email || "User"}
          </Typography>
        )}
      </Box>
      <List sx={{ width: '100%' }}>
        {navItems.map(({ label, icon: Icon, to }) => (
          <ListItem
            key={label}
            button
            component={Link}
            to={to}
            sx={{
              justifyContent: open ? 'flex-start' : 'center',
              px: open ? 2 : 0,
              width: '100%',
              minHeight: 48,
              my: 0.5,
              transition: 'all 0.3s',
              bgcolor: 'transparent', // Ensure no background by default
              '&:hover': {
                bgcolor: '#f5f5f5',
                '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                  color: '#111',
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: '#111', minWidth: 0, justifyContent: 'center', display: 'flex' }}>
              <Icon size={28} weight="regular" />
            </ListItemIcon>
            {open && <ListItemText primary={label} primaryTypographyProps={{ color: '#111' }} />}
          </ListItem>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ my: 2, width: open ? '100%' : 40, mx: open ? 0 : 'auto' }} />
      <List sx={{ width: '100%' }}>
        {bottomItems.map(({ label, icon: Icon, to, action }) => (
          <ListItem
            key={label}
            button
            component={to ? Link : 'button'}
            to={to}
            onClick={action === 'logout' ? handleLogout : undefined}
            sx={{
              justifyContent: open ? 'flex-start' : 'center',
              px: open ? 2 : 0,
              width: '100%',
              minHeight: 48,
              my: 0.5,
              transition: 'all 0.3s',
              bgcolor: 'transparent', // Remove gray background
              '&:hover': {
                bgcolor: '#f5f5f5',
              },
              // Remove border and outline for button (Log out)
              ...(action === 'logout' && {
                border: 'none',
                outline: 'none',
                boxShadow: 'none',
                '&:focus': {
                  outline: 'none',
                  border: 'none',
                },
                '&:active': {
                  outline: 'none',
                  border: 'none',
                },
              }),
            }}
          >
            <ListItemIcon sx={{ color: '#111 !important', minWidth: 0, justifyContent: 'center', display: 'flex' }}>
              <Icon size={28} weight="regular" />
            </ListItemIcon>
            {open && <ListItemText primary={label} primaryTypographyProps={{ color: '#111', sx: { color: '#111 !important' } }} />}
          </ListItem>
        ))}
      </List>
      {/* Sidebar open/close button at the bottom */}
      <Box sx={{ width: '100%', display: 'flex', justifyContent: open ? 'flex-end' : 'center', alignItems: 'center', mb: 2, px: open ? 2 : 0 }}>
        <IconButton
          onClick={() => setOpen(!open)}
          sx={{
            bgcolor: '#fff',
            
            borderRadius: '50%',
            width: 48,
            height: 48,
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s',
          }}
        >
          {open ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Box>
    </Box>
  );
};

export default Sidebar; 