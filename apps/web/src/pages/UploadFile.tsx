import { useState } from "react";
import { encryptBytes } from "../crypto/symmetric";
import { encryptAESKey } from "../crypto/hybrid";
import { useAuth } from "../contexts/AuthContext";
import { bufferToBase64 } from "../crypto/utils";
import { API_ENDPOINTS } from "../constants";
import toast from "react-hot-toast";
import { Box, Paper, Typography, Button, LinearProgress } from "@mui/material";
import { InsertDriveFile, Lock, Upload } from "@mui/icons-material";
import api from "../services/api";
export default function UploadFile() {
  const { user, publicKey } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleUpload() {
    if (!file || !user || !publicKey) return;

    setLoading(true);
    setProgress(10);
    const toastId = toast.loading("Encrypting file...");

    try {
      // 1. Read file
      const buffer = await file.arrayBuffer();
      setProgress(30);

      // 2. Encrypt file bytes
      const { encryptedData, iv, rawKey } = await encryptBytes(buffer);
      setProgress(60);

      // 3. Encrypt DEK for owner
      const wrapped = await encryptAESKey(bufferToBase64(rawKey), publicKey);
      setProgress(80);

      // 4. Build multipart form
      const formData = new FormData();
      formData.append(
        "encryptedFile",
        new Blob([encryptedData]),
        file.name + ".enc",
      );
      formData.append("iv", JSON.stringify(iv));
      formData.append("encryptedDEK", wrapped.encryptedAESKey);
      formData.append("dekIv", wrapped.iv);
      formData.append(
        "ephemeralPublicKey",
        JSON.stringify(wrapped.ephemeralPublicKey),
      );
      formData.append("originalFileName", file.name);
      formData.append("mimeType", file.type);

      toast.loading("Uploading to secure storage...", { id: toastId });

      // 5. Send to backend
      const res = await api.post(API_ENDPOINTS.FILES.UPLOAD, formData);

      if (!res.data.success) {
        throw new Error("Upload failed");
      }

      setProgress(100);
      toast.success("File encrypted & uploaded!", { id: toastId });
      setFile(null);
    } catch {
      toast.error("Upload failed", { id: toastId });
    } finally {
      setLoading(false);
      setProgress(0);
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
          <Upload sx={{ color: "primary.main" }} />
          Upload File
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Your file is encrypted on your device before uploading.
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, md: 6 },
          bgcolor: "background.paper",
          border: "2px dashed",
          borderColor: file ? "primary.main" : "divider",
          borderRadius: 2,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          transition: "border-color 0.2s, background-color 0.2s",
          "&:hover": {
            borderColor: "primary.light",
            bgcolor: "action.hover",
          },
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            bgcolor: file ? "primary.main" : "action.hover",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s",
          }}
        >
          <InsertDriveFile
            sx={{ fontSize: 40, color: file ? "white" : "text.secondary" }}
          />
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {file ? file.name : "Select a file to encrypt"}
        </Typography>

        {file && (
          <Typography variant="body2" color="text.secondary">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </Typography>
        )}

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 400 }}
        >
          Your file will be encrypted locally with AES-256 before upload. Only
          you can decrypt it.
        </Typography>

        <input
          accept="*/*"
          style={{ display: "none" }}
          id="raised-button-file"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={loading}
        />

        <label htmlFor="raised-button-file">
          <Button
            variant="outlined"
            component="span"
            disabled={loading}
            sx={{ mt: 1 }}
          >
            Choose File
          </Button>
        </label>

        {loading && (
          <Box sx={{ width: "100%", mt: 2 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block" }}
            >
              {progress < 80 ? "Encrypting..." : "Uploading..."}
            </Typography>
          </Box>
        )}

        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!file || loading}
          startIcon={<Lock />}
          size="large"
          sx={{ mt: 2, px: 4 }}
        >
          {loading ? "Processing..." : "Encrypt & Upload"}
        </Button>
      </Paper>
    </Box>
  );
}
