import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Stack,
  Link,
  Paper,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { auth, provider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import Loader from '../components/Loader';
import { useTheme } from '@mui/material/styles';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const allowedEmails = [
    "abhixshek20@gmail.com",
    "sharveshsr9@gmail.com",
    "sharvesheve@gmail.com",
    "aswinarun3103@gmail.com"
    // Add more emails as needed
  ];

  // Placeholder handlers
  const handleEmailLogin = (e) => {
    e.preventDefault();
    alert("Email login not implemented yet!");
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if the user's email is allowed
      if (!allowedEmails.includes(user.email)) {
        alert("Access denied: Your email is not authorized.");
        await auth.signOut(); // Optional: sign out unauthorized users
        return;
      }

      alert(`Welcome, ${user.displayName || user.email}!`);
      navigate("/dashboard"); // Redirect to dashboard
    } catch (error) {
      console.error("Google sign-in error:", error);
      alert("Google sign-in failed. Please try again.");
    }
  };

  // Set a medium width for form elements
  const fieldWidth = 400;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: isDark ? '#10151a' : '#eaf7f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper sx={{ p: 4, borderRadius: 4, bgcolor: isDark ? '#181f23' : '#fff', boxShadow: isDark ? theme.palette.glow : 3, minWidth: 350 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: isDark ? theme.palette.primary.main : '#2563eb', fontFamily: 'Poppins, sans-serif', mb: 2 }}>Login</Typography>
          <Typography
            variant="body1"
            align="center"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Enter your credential to access your account.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            sx={{
              textTransform: "none",
              bgcolor: "#fff",
              color: "#222",
              borderColor: "#ddd",
              fontWeight: 500,
              fontSize: 16,
              mb: 2,
              width: fieldWidth,
              mx: "auto",
              display: "flex",
              "&:hover": { bgcolor: "#f5f5f5", borderColor: "#bbb" },
            }}
          >
            Login with Google
          </Button>
          <Divider sx={{ my: 2, width: fieldWidth, mx: "auto" }}>
            <Typography color="text.secondary" fontSize={14}>
              Or
            </Typography>
          </Divider>
          <form onSubmit={handleEmailLogin}>
            <Stack spacing={2} alignItems="center">
              <TextField
                label="Email address"
                type="email"
                placeholder="email@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                InputProps={{
                  sx: { bgcolor: "#fafbfc" },
                }}
                sx={{ width: fieldWidth }}
              />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: fieldWidth,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Password
                </Typography>
              
              </Box>
              
              <TextField
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                InputProps={{
                  sx: { bgcolor: "#fafbfc" },
                }}
                sx={{ width: fieldWidth }}
              />
                <Link href="#" underline="hover" variant="body2" align="right" sx={{ fontWeight: 500 }}>
                  Forgot Password?
                </Link>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  mt: 1,
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: 16,
                  bgcolor: "#2d6c8c",
                  borderRadius: 1.5,
                  py: 1.2,
                  width: fieldWidth,
                  mx: "auto",
                  display: "block",
                  "&:hover": { bgcolor: "#21506a" },
                }}
              >
                Login
              </Button>
            </Stack>
          </form>
        </Paper>
    </Box>
  );
}