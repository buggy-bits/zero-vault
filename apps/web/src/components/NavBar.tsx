import { Link, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  IconButton,
  Tooltip,
  Typography,
  Divider,
} from "@mui/material";
import {
  Lock,
  Logout,
  NoteAdd,
  Share,
  Inbox,
  Upload,
  Folder,
  Settings,
  Shield,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { ROUTES } from "../constants";

const navItems = [
  { path: ROUTES.CREATE, label: "Create Note", icon: <NoteAdd /> },
  { path: ROUTES.SHARE, label: "Share Note", icon: <Share /> },
  { path: ROUTES.INBOX, label: "Inbox", icon: <Inbox /> },
  { path: ROUTES.UPLOAD, label: "Upload", icon: <Upload /> },
  { path: ROUTES.FILES, label: "My Files", icon: <Folder /> },
];

export default function Navbar() {
  const location = useLocation();
  const { lockVault, logout, user } = useAuth();

  const handleLock = () => {
    lockVault();
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, md: 3 } }}>
        {/* Logo Section */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Link
            to="/"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {/* <Shield sx={{ color: "primary.main", fontSize: 28 }} /> */}
            <img src="z_logo.svg" alt="" width={32} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "text.primary",
                letterSpacing: "-0.02em",
                marginRight: 4,
              }}
            >
              ZeroVault
            </Typography>
          </Link>

          {/* Navigation Links */}
          <Divider
            orientation="vertical"
            flexItem
            sx={{ mx: 2, display: { xs: "none", md: "block" } }}
          />

          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 0.5 }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  component={Link}
                  to={item.path}
                  startIcon={item.icon}
                  size="small"
                  sx={{
                    color: isActive ? "primary.main" : "text.secondary",
                    bgcolor: isActive ? "action.selected" : "transparent",
                    fontWeight: isActive ? 600 : 500,
                    px: 2,
                    py: 1,
                    "&:hover": {
                      bgcolor: isActive ? "action.selected" : "action.hover",
                      color: isActive ? "primary.main" : "text.primary",
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>
        </Box>

        {/* Right Section - User & Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {user?.email && (
            <Box
              sx={{
                display: { xs: "none", sm: "block" },
                color: "text.secondary",
                fontSize: "0.875rem",
                mr: 1,
                px: 2,
                py: 0.5,
                bgcolor: "action.hover",
                borderRadius: 1,
              }}
            >
              {user.email}
            </Box>
          )}

          <Tooltip title="Settings">
            <IconButton
              component={Link}
              to={ROUTES.SETTINGS}
              size="small"
              sx={{
                color:
                  location.pathname === ROUTES.SETTINGS
                    ? "primary.main"
                    : "text.secondary",
                bgcolor:
                  location.pathname === ROUTES.SETTINGS
                    ? "action.selected"
                    : "transparent",
              }}
            >
              <Settings fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Lock Vault">
            <IconButton
              onClick={handleLock}
              size="small"
              sx={{
                color: "warning.main",
                "&:hover": { bgcolor: "rgba(217, 119, 6, 0.08)" },
              }}
            >
              <Lock fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Sign Out">
            <IconButton
              onClick={handleLogout}
              size="small"
              sx={{
                color: "error.main",
                "&:hover": { bgcolor: "rgba(220, 38, 38, 0.08)" },
              }}
            >
              <Logout fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
