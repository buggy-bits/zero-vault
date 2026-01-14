import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { decryptAESKey } from "../crypto/hybrid";
import { decryptText } from "../crypto/symmetric";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { API_ENDPOINTS } from "../constants";
import { 
  Box, 
  Paper, 
  Typography, 
  CircularProgress, 
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import { ContentCopy, Lock, Description } from "@mui/icons-material";
import toast from "react-hot-toast";

export default function SharedNote() {
  const { shareId } = useParams();
  const { privateKey, vaultStatus } = useAuth();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!shareId || !privateKey) return;

      try {
        const metaRes = await api.get(`${API_ENDPOINTS.METADATA.NOTE_SHARE}/${shareId}`);
        const meta = metaRes.data;

        const dek = await decryptAESKey(
          {
            encryptedAESKey: meta.encryptedDEK,
            iv: meta.dekIv,
            ephemeralPublicKey: meta.ephemeralPublicKey,
          },
          privateKey
        );

        const plain = await decryptText(meta.encryptedContent, meta.iv, dek);
        setText(plain);
      } catch (err) {
        console.error("Failed to load note:", err);
        setError("Failed to decrypt note");
      } finally {
        setLoading(false);
      }
    }

    if (privateKey && vaultStatus === 'unlocked') {
      load();
    }
  }, [privateKey, vaultStatus, shareId]);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  if (loading) {
    return (
      <Box 
        sx={{ 
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 4,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            maxWidth: 400,
            width: "100%",
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography color="text.secondary">
            Decrypting shared note...
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
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
          <Description sx={{ color: "primary.main" }} />
          Shared Note
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          This note was shared with you securely.
        </Typography>
      </Box>

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
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Lock sx={{ color: "success.main", fontSize: 18 }} />
            <Typography variant="caption" color="success.main" sx={{ fontWeight: 500 }}>
              Decrypted
            </Typography>
          </Box>
          <Tooltip title="Copy to clipboard">
            <IconButton onClick={handleCopy} size="small">
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Typography 
          component="pre" 
          sx={{ 
            p: 3,
            bgcolor: "background.default",
            borderRadius: 1,
            whiteSpace: "pre-wrap", 
            wordBreak: "break-word",
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: "0.875rem",
            lineHeight: 1.7,
            color: "text.primary",
            m: 0,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {text}
        </Typography>
      </Paper>
    </Box>
  );
}
