import React, { useState, useContext, useEffect } from "react";
import { Box, Card, CardContent, Typography, Button, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

const allowedAdmins = [
  "abhixshek20@gmail.com",
  "sharveshr9@gmail.com"
  // Add more admin emails as needed
];

export default function Upload() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    if (!allowedAdmins.includes(user.email)) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setPredictions(null);
    setError("");
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setPredictions(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/train-and-predict", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload and predict");
      const data = await res.json();
      setPredictions(data.predictions || []);
    } catch (err) {
      setError("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Box sx={{ p: 4 }}><Typography>Loading...</Typography></Box>;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#eaf7f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <Card sx={{ maxWidth: 500, mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Admin Upload Data for Prediction
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
            {loading ? <CircularProgress size={24} /> : "Upload & Predict"}
          </Button>
          {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
        </CardContent>
      </Card>
      {predictions && (
        <Card sx={{ maxWidth: 700, mb: 4 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Predictions
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Prediction</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {predictions.map((pred, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{pred}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
} 