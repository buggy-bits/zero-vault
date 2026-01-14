import { useState } from "react";
import { decryptAESKey, encryptAESKey } from "../crypto/hybrid";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { API_ENDPOINTS } from "../constants";
import toast from "react-hot-toast";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  IconButton,
} from "@mui/material";
import { ContentCopy, Share } from "@mui/icons-material";

interface Props {
  noteId: string;
  onClose?: () => void;
}

export default function ShareNoteModal({ noteId, onClose }: Props) {
  const { privateKey } = useAuth();
  const [email, setEmail] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleShare() {
    if (!privateKey || !email) return;

    setLoading(true);
    setError("");

    try {
      // 1. receiver public key
      const receiverRes = await api.get(
        `${API_ENDPOINTS.USER.PUBLIC_KEY}?email=${encodeURIComponent(email)}`
      );
      const receiver = receiverRes.data;

      // 2. get owner metadata
      const metaRes = await api.get(`${API_ENDPOINTS.METADATA.FILE}/${noteId}`);
      const meta = metaRes.data;

      // 3. decrypt owner DEK
      const rawDEK = await decryptAESKey(meta, privateKey);

      // 4. encrypt DEK for receiver
      const wrapped = await encryptAESKey(rawDEK, receiver.publicKey);

      // 5. share
      const res = await api.post(API_ENDPOINTS.SHARE.NOTE, {
        noteId,
        receiverEmail: email,
        encryptedDEK: wrapped.encryptedAESKey,
        dekIv: wrapped.iv,
        ephemeralPublicKey: wrapped.ephemeralPublicKey,
      });

      setLink(res.data.shareLink);
      navigator.clipboard.writeText(res.data.shareLink);
      toast.success("Link copied to clipboard!");
    } catch {
      setError("Failed to share note. User may not exist.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopyLink() {
    if (link) {
      navigator.clipboard.writeText(link);
      toast.success("Copied to clipboard");
    }
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mt: 2,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Share sx={{ color: "primary.main", fontSize: 20 }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Share Note
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          placeholder="Receiver email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading || !!link}
          size="small"
          sx={{ flexGrow: 1 }}
        />
        
        {!link && (
          <Button 
            onClick={handleShare} 
            disabled={loading || !email}
            variant="contained"
            size="small"
          >
            {loading ? "Sharing..." : "Share"}
          </Button>
        )}
      </Box>
      
      {link && (
        <Box 
          sx={{ 
            p: 2, 
            bgcolor: "background.default", 
            borderRadius: 1,
            border: "1px solid",
            borderColor: "success.light",
            mb: 2,
          }}
        >
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: "success.main", 
              mb: 1,
              fontWeight: 600,
            }}
          >
            ✓ Share link created
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField 
              fullWidth 
              value={link} 
              size="small"
              InputProps={{ readOnly: true }}
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <IconButton onClick={handleCopyLink} sx={{ color: "primary.main" }}>
              <ContentCopy fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      )}

      {onClose && (
        <Button onClick={onClose} color="inherit" size="small">
          Close
        </Button>
      )}
    </Paper>
  );
}
