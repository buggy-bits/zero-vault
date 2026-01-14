import { useState } from "react";
import { encryptText } from "../crypto/symmetric";
import { encryptAESKey, decryptAESKey } from "../crypto/hybrid";
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
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import { Send, CheckCircle, PersonSearch, Share } from "@mui/icons-material";

type ReceiverInfo = {
  userId: string;
  publicKey: JsonWebKey;
};

export default function ShareNotePage() {
  const { publicKey, privateKey } = useAuth();

  const [note, setNote] = useState("");
  const [email, setEmail] = useState("");

  const [receiver, setReceiver] = useState<ReceiverInfo | null>(null);
  const [loading, setLoading] = useState(false);

  // STEP 1: Check receiver existence & fetch public key
  async function handleCheckUser() {
    setReceiver(null);
    setLoading(true);

    try {
      const res = await api.get(
        `${API_ENDPOINTS.USER.PUBLIC_KEY}?email=${encodeURIComponent(email)}`
      );
      setReceiver(res.data);
      toast.success("User found! Ready to send.");
    } catch {
      toast.error("User does not exist.");
    } finally {
      setLoading(false);
    }
  }

  // STEP 2: Encrypt note & share
  async function handleSendNote() {
    if (!receiver || !publicKey || !privateKey) return;

    setLoading(true);

    try {
      // 1. Encrypt note with DEK
      const encrypted = await encryptText(note);

      // 2. Encrypt DEK for sender (owner)
      const wrappedForSender = await encryptAESKey(encrypted.rawKey, publicKey);

      // 3. Store note
      const noteRes = await api.post(API_ENDPOINTS.NOTE.CREATE, {
        encryptedContent: encrypted.encryptedText,
        iv: encrypted.iv,
        encryptedDEK: wrappedForSender.encryptedAESKey,
        dekIv: wrappedForSender.iv,
        ephemeralPublicKey: wrappedForSender.ephemeralPublicKey,
      });

      const { noteId } = noteRes.data;

      // 4. Decrypt DEK (sender already has access)
      const rawDEK = await decryptAESKey(
        {
          encryptedAESKey: wrappedForSender.encryptedAESKey,
          iv: wrappedForSender.iv,
          ephemeralPublicKey: wrappedForSender.ephemeralPublicKey,
        },
        privateKey
      );

      // 5. Encrypt DEK for receiver
      const wrappedForReceiver = await encryptAESKey(
        rawDEK,
        receiver.publicKey
      );

      // 6. Store receiver access
      await api.post(API_ENDPOINTS.SHARE.NOTE, {
        noteId,
        receiverEmail: email,
        userId: receiver.userId,
        encryptedDEK: wrappedForReceiver.encryptedAESKey,
        dekIv: wrappedForReceiver.iv,
        ephemeralPublicKey: wrappedForReceiver.ephemeralPublicKey,
      });

      setNote("");
      setEmail("");
      setReceiver(null);
      toast.success("Note encrypted & shared successfully!");
    } catch {
      toast.error("Failed to send note.");
    } finally {
      setLoading(false);
    }
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
          <Share sx={{ color: "primary.main" }} />
          Secure Share
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Send an encrypted message that only the recipient can read.
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
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Write Message
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={6}
          placeholder="Write your secret note here..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          variant="outlined"
          sx={{ 
            mb: 4,
            "& .MuiOutlinedInput-root": {
              bgcolor: "background.default",
            },
          }}
        />

        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Recipient
        </Typography>

        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
          <TextField
            placeholder="Receiver email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
              endAdornment: receiver ? (
                <InputAdornment position="end">
                  <CheckCircle sx={{ color: "success.main" }} />
                </InputAdornment>
              ) : null
            }}
          />

          <Button 
            variant="outlined" 
            onClick={handleCheckUser} 
            disabled={loading || !email}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PersonSearch />}
            sx={{ height: 56 }}
          >
            Check User
          </Button>
        </Box>

        <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            onClick={handleSendNote}
            disabled={!receiver || loading || !note}
            startIcon={<Send />}
            size="large"
            sx={{ px: 4 }}
          >
            Send Encrypted
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
