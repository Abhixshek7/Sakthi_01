import React, { useState, useContext, useEffect } from "react";
import { Box, Card, CardContent, Typography, Button, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { allowedEmails } from "../../allowedEmails";
import { getAuth } from "firebase/auth";
import Loader from '../components/Loader';

export default function Admin() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    if (!allowedEmails.includes(user.email)) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setSuccess(false);
    setError("");
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/admin-upload", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to upload and process file");
      setSuccess(true);
    } catch (err) {
      setError("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Loader />;
  }

  if (!allowedEmails.includes(user.email)) {
    return <Box sx={{ p: 4 }}><Typography>Access Denied</Typography></Box>;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#eaf7f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <Card sx={{ maxWidth: 500, mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Admin Upload Data for Dashboard
          </Typography>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ marginBottom: 16 }}
          />
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!file || loading}
            sx={{ ml: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : "Upload"}
          </Button>
          {success && <Typography color="success.main" sx={{ mt: 2 }}>File uploaded and processed! Dashboard will update shortly.</Typography>}
          {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
        </CardContent>
      </Card>
    </Box>
  );
} 