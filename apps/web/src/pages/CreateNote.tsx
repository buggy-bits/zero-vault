import { useState } from "react";
import { createNote } from "../services/createNote";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
} from "@mui/material";
import { NoteAdd, Lock } from "@mui/icons-material";

export default function CreateNote() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const { publicKey } = useAuth();

  async function handleCreate() {
    if (!publicKey || !text.trim()) return;

    setLoading(true);

    try {
      await createNote(text, publicKey);
      toast.success("Note created and encrypted successfully!");
      setText("");
    } catch {
      toast.error("Failed to create note");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 700, mx: "auto" }}>
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
          <NoteAdd sx={{ color: "primary.main" }} />
          Create Encrypted Note
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Your note will be encrypted before saving. Only you can read it.
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
        <TextField
          fullWidth
          multiline
          rows={8}
          placeholder="Write your secret note here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          variant="outlined"
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              bgcolor: "background.default",
            },
          }}
        />

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={loading || !text.trim()}
            startIcon={<Lock />}
            size="large"
            sx={{ px: 4 }}
          >
            {loading ? "Encrypting..." : "Encrypt & Save"}
          </Button>
          
          <Typography variant="caption" color="text.secondary">
            End-to-end encrypted with your personal key
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
