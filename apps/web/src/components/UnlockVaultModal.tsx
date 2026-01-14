import { useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff, LockOpen, Shield } from "@mui/icons-material";
import { LoadingButton } from "./common/LoadingButton";
import { useAuth } from "../contexts/AuthContext";

export default function UnlockVaultModal() {
  const { unlockVault, logout, error, user } = useAuth();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) {
      setLocalError("Please enter your password");
      return;
    }

    setLoading(true);
    setLocalError("");

    try {
      await unlockVault(password);
      setPassword("");
    } catch {
      setLocalError("Wrong password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
  }

  const displayError = localError || error;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 3,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
                boxShadow: "0 4px 14px 0 rgba(79, 70, 229, 0.3)",
              }}
            >
              <Shield sx={{ fontSize: 36, color: "white" }} />
            </Box>
            
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "text.primary",
                mb: 1,
              }}
            >
              Vault Locked
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enter your password to unlock your encrypted data
            </Typography>
            {user?.email && (
              <Box sx={{ 
                mt: 2, 
                px: 2, 
                py: 1, 
                bgcolor: "action.hover", 
                borderRadius: 1,
                display: "inline-block",
              }}>
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
            )}
          </Box>

          {displayError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {displayError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleUnlock}>
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOpen sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={loading}
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <LoadingButton
              type="submit"
              fullWidth
              variant="contained"
              loading={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                fontSize: "1rem",
              }}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockOpen />}
            >
              Unlock Vault
            </LoadingButton>

            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                component="span"
                sx={{ 
                  cursor: "pointer", 
                  "&:hover": { 
                    textDecoration: "underline",
                    color: "primary.main",
                  } 
                }}
                onClick={handleLogout}
              >
                Not you? Sign out and switch accounts
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
