import { useState } from "react";
import { decryptAESKey, encryptAESKey } from "../crypto/hybrid";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { API_ENDPOINTS } from "../constants";
import toast from "react-hot-toast";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
  IconButton,
} from "@mui/material";
import { Close, Share, ContentCopy } from "@mui/icons-material";

interface Props {
  file: {
    _id: string;
    originalFileName: string;
  };
  onClose: () => void;
}

export default function ShareFileModal({ file, onClose }: Props) {
  const { privateKey } = useAuth();
  const [email, setEmail] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleShare() {
    if (!privateKey || !email) return;

    setLoading(true);

    try {
      // 1. get receiver public key
      const receiverRes = await api.get(
        `${API_ENDPOINTS.USER.PUBLIC_KEY}?email=${encodeURIComponent(email)}`
      );
      const receiver = receiverRes.data;

      // 2. get owner metadata
      const metaRes = await api.get(`${API_ENDPOINTS.METADATA.FILE}/${file._id}`);
      const ownerKeyMeta = metaRes.data;

      // ephemeralPublicKey is a stringified JWK → must be parsed (if string)
      if (typeof ownerKeyMeta.ephemeralPublicKey === "string") {
        ownerKeyMeta.ephemeralPublicKey = JSON.parse(ownerKeyMeta.ephemeralPublicKey);
      }

      // align naming (API differences)
      ownerKeyMeta.iv = ownerKeyMeta.dekIv;
      ownerKeyMeta.encryptedAESKey = ownerKeyMeta.encryptedDEK;

      // 3. decrypt owner DEK
      const rawDEK = await decryptAESKey(ownerKeyMeta, privateKey);

      // 4. encrypt DEK for receiver
      const wrapped = await encryptAESKey(rawDEK, receiver.publicKey);

      // 5. call share API
      const shareRes = await api.post(API_ENDPOINTS.SHARE.FILE, {
        noteId: file._id,
        receiverEmail: email,
        encryptedDEK: wrapped.encryptedAESKey,
        dekIv: wrapped.iv,
        ephemeralPublicKey: wrapped.ephemeralPublicKey,
      });

      const shareLink = shareRes.data.shareLink;
      setLink(shareLink);
      toast.success("Link generated!");
      
      navigator.clipboard.writeText(shareLink);
      toast.success("Copied to clipboard");

    } catch (err) {
      toast.error("Failed to share. User may not exist.");
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
    <Dialog 
      open 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Share sx={{ color: "primary.main" }} />
          Share File
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Share <strong>"{file.originalFileName}"</strong> with another ZeroVault user.
        </Typography>

        <TextField
          fullWidth
          placeholder="Receiver email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading || !!link}
          variant="outlined"
          sx={{ mb: 3 }}
        />

        {link && (
          <Box 
            sx={{ 
              p: 2, 
              bgcolor: "background.default", 
              borderRadius: 1,
              border: "1px solid",
              borderColor: "success.light",
            }}
          >
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: "success.main", 
                display: "flex", 
                alignItems: "center", 
                gap: 0.5,
                mb: 1,
                fontWeight: 600,
              }}
            >
              ✓ Share Link Created
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
                <ContentCopy />
              </IconButton>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          {link ? "Done" : "Cancel"}
        </Button>
        {!link && (
          <Button
            variant="contained"
            onClick={handleShare}
            disabled={loading || !email}
          >
            {loading ? "Creating Link..." : "Generate Secure Link"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
