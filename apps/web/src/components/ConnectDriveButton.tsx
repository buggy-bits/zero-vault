import { API_ENDPOINTS } from "../constants";
import api from "../services/api";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@mui/material";
import { CloudQueue } from "@mui/icons-material";

function ConnectDriveButton() {
  const [connecting, setConnecting] = useState(false);

  async function connect() {
    setConnecting(true);
    try {
      const res = await api.get(API_ENDPOINTS.OAUTH.GOOGLE_START);
      window.location.href = res.data.url;
    } catch {
      toast.error("Failed to initiate Google Drive connection");
      setConnecting(false);
    }
  }

  return (
    <Button 
      variant="contained"
      onClick={connect}
      disabled={connecting}
      startIcon={<CloudQueue />}
      sx={{
        bgcolor: "#4285f4",
        color: "white",
        "&:hover": {
          bgcolor: "#3367d6",
        },
      }}
    >
      {connecting ? "Connecting..." : "Connect Google Drive"}
    </Button>
  );
}

export default ConnectDriveButton;
