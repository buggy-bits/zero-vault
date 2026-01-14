import { useEffect, useState } from "react";
import { decryptAESKey } from "../crypto/hybrid";
import { decryptText } from "../crypto/symmetric";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { API_ENDPOINTS } from "../constants";
import toast from "react-hot-toast";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
} from "@mui/material";
import { Delete, Visibility, Lock, ContentCopy, Inbox } from "@mui/icons-material";

type EncryptedNote = {
  noteId: string;
  encryptedContent: string;
  iv: string;
  encryptedDEK: string;
  dekIv: string;
  ephemeralPublicKey: JsonWebKey;
  createdAt: string;
};

export default function ReceiverInbox() {
  const { privateKey } = useAuth();

  const [notes, setNotes] = useState<EncryptedNote[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [open, setOpen] = useState(false);
  const [selectedNoteContent, setSelectedNoteContent] = useState("");

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    try {
      const res = await api.get(API_ENDPOINTS.NOTE.GET_ALL);
      setNotes(res.data);
    } catch {
      toast.error("Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }

  async function deleteNote(noteId: string) {
    if (!confirm("Delete this note permanently?")) return;

    try {
      await api.delete(`${API_ENDPOINTS.NOTE.GET_ALL}/${noteId}`);
      setNotes((notes) => notes.filter((n) => n.noteId !== noteId));
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  }

  async function decryptAndShow(note: EncryptedNote) {
    if (!privateKey) return;

    const toastId = toast.loading("Decrypting...");
    try {
      // 1. Decrypt DEK
      const rawDEK = await decryptAESKey(
        {
          encryptedAESKey: note.encryptedDEK,
          iv: note.dekIv,
          ephemeralPublicKey: note.ephemeralPublicKey,
        },
        privateKey
      );

      // 2. Decrypt note
      const plaintext = await decryptText(note.encryptedContent, note.iv, rawDEK);
      
      setSelectedNoteContent(plaintext);
      setOpen(true);
      toast.success("Decryption successful", { id: toastId });
    } catch (err) {
      toast.error("Failed to decrypt note. Key mismatch?", { id: toastId });
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(selectedNoteContent);
    toast.success("Copied to clipboard");
  }

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">Loading secure inbox...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: "auto" }}>
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
          <Inbox sx={{ color: "primary.main" }} />
          Secure Inbox
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Encrypted messages shared with you. Decrypt to read.
        </Typography>
      </Box>

      {notes.length === 0 ? (
        <Paper 
          elevation={0}
          sx={{ 
            p: 6, 
            textAlign: "center", 
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Lock sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No encrypted notes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            When someone shares an encrypted note with you, it will appear here.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {notes.map((note) => (
            <Grid item xs={12} sm={6} md={4} key={note.noteId}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    borderColor: "primary.light",
                    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.08)",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Lock sx={{ color: "primary.main", mr: 1, fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Encrypted Message
                  </Typography>
                </Box>
                
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                  Received: {new Date(note.createdAt).toLocaleString()}
                </Typography>

                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                  <Tooltip title="Decrypt & Read">
                    <IconButton 
                      onClick={() => decryptAndShow(note)} 
                      size="small"
                      sx={{ color: "primary.main" }}
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton 
                      onClick={() => deleteNote(note.noteId)} 
                      size="small"
                      sx={{ color: "error.main" }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Decrypted Note Dialog */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Decrypted Note
          <Tooltip title="Copy to clipboard">
            <IconButton onClick={handleCopy} size="small">
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
        </DialogTitle>
        <DialogContent dividers>
          <Typography 
            component="pre" 
            sx={{ 
              whiteSpace: "pre-wrap", 
              wordBreak: "break-word",
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: "0.875rem",
              lineHeight: 1.6,
              color: "text.primary",
              m: 0,
            }}
          >
            {selectedNoteContent}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
