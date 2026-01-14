import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { API_ENDPOINTS } from "../constants";
import { LoadingButton } from "../components/common/LoadingButton";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { CloudDone, CloudOff, Google, Settings, Person } from "@mui/icons-material";
import { Box, Paper, Typography, Divider, Chip, CircularProgress } from "@mui/material";

export default function SettingsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [driveConnected, setDriveConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    checkDriveStatus();
    
    // Check for success redirect
    if (searchParams.get("drive") === "connected") {
      toast.success("Google Drive connected successfully!");
      // Clean URL
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams]);

  async function checkDriveStatus() {
    try {
      const res = await api.get(API_ENDPOINTS.OAUTH.STATUS);
      setDriveConnected(res.data.isConnected);
    } catch (error) {
      console.error("Failed to check drive status");
    } finally {
      setLoading(false);
    }
  }

  function handleConnectDrive() {
    setConnecting(true);
    // Redirect to backend OAuth start
    // Using window.location.origin is fine, but backend handles the redirect to Google
    // The backend URL is where we need to go.
    // Assuming backend is proxying or we need full URL.
    // If using dev server proxy, relative path works.
    window.location.href = `${window.location.origin.replace(':5173', ':3000')}${API_ENDPOINTS.OAUTH.GOOGLE_START}`;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 800, mx: "auto" }}>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            color: "text.primary",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Settings sx={{ color: "primary.main" }} />
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Manage your account and integrations.
        </Typography>
      </Box>

      {/* Account Information */}
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 3, md: 4 }, 
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <Person sx={{ color: "primary.main" }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Account Information
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Email Address
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {user?.email}
          </Typography>
        </Box>
      </Paper>

      {/* Integrations */}
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 3, md: 4 }, 
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Integrations
        </Typography>

        <Box 
          sx={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
            p: 2,
            bgcolor: "background.default",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 1,
                fontWeight: 600,
              }}
            >
              <Google fontSize="small" sx={{ color: "#4285f4" }} /> 
              Google Drive
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Connect your Google Drive to store encrypted files.
            </Typography>
          </Box>

          <Box>
            {loading ? (
              <CircularProgress size={24} />
            ) : driveConnected ? (
              <Chip 
                icon={<CloudDone />} 
                label="Connected" 
                color="success" 
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
            ) : (
              <LoadingButton
                variant="contained"
                startIcon={<CloudOff />}
                onClick={handleConnectDrive}
                loading={connecting}
                sx={{ 
                  bgcolor: "#4285f4", 
                  "&:hover": { bgcolor: "#3367d6" },
                  fontWeight: 500,
                }}
              >
                Connect Drive
              </LoadingButton>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
