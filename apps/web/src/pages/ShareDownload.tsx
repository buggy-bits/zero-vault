import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { decryptAESKey } from "../crypto/hybrid";
import { decryptBytes } from "../crypto/symmetric";
import { base64ToBuffer } from "../crypto/utils";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { API_ENDPOINTS } from "../constants";
import { ENV } from "../config/env";
import { Box, Paper, Typography, CircularProgress, Alert } from "@mui/material";
import { CloudDownload, CheckCircle, Error } from "@mui/icons-material";

export default function ShareDownload() {
  const { shareId } = useParams();
  const { privateKey, vaultStatus } = useAuth();
  const [status, setStatus] = useState("Preparing download...");
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    async function run() {
      if (!shareId || !privateKey) return;

      try {
        setStatus("Fetching file metadata...");

        // 1. get metadata
        const metaRes = await api.get(
          `${API_ENDPOINTS.METADATA.SHARE}/${shareId}`,
        );
        const meta = metaRes.data;

        setStatus("Downloading encrypted file...");

        // 2. download encrypted file
        const fileRes = await fetch(
          `${ENV.API_BASE_URL}${API_ENDPOINTS.SHARE.DOWNLOAD}/${shareId}`,
          { credentials: "include" },
        );
        const encryptedBuffer = await fileRes.arrayBuffer();

        setStatus("Decrypting file...");

        // 3. decrypt DEK
        const rawDEK = await decryptAESKey(
          {
            encryptedAESKey: meta.encryptedDEK,
            iv: meta.dekIv,
            ephemeralPublicKey: meta.ephemeralPublicKey,
          },
          privateKey,
        );

        // 4. decrypt file - handle IV format
        let iv: number[];
        if (typeof meta.iv === "string") {
          if (meta.iv.startsWith("[")) {
            iv = JSON.parse(meta.iv);
          } else {
            iv = Array.from(new Uint8Array(base64ToBuffer(meta.iv)));
          }
        } else {
          iv = meta.iv;
        }

        const decrypted = await decryptBytes(
          encryptedBuffer,
          iv,
          base64ToBuffer(rawDEK),
        );

        setStatus("Starting download...");

        // 5. save file
        const blob = new Blob([decrypted], {
          type: meta.mimeType,
        });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = meta.originalFileName;
        a.click();

        URL.revokeObjectURL(url);

        setComplete(true);
        setStatus("File downloaded successfully!");
      } catch (err) {
        console.error("Download failed:", err);
        setError("Failed to download or decrypt file");
      }
    }

    if (privateKey && vaultStatus === "unlocked") {
      run();
    }
  }, [privateKey, vaultStatus, shareId]);

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
          borderColor: error
            ? "error.light"
            : complete
            ? "success.light"
            : "divider",
          borderRadius: 2,
        }}
      >
        {error ? (
          <>
            <Error sx={{ fontSize: 56, color: "error.main", mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Download Failed
            </Typography>
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          </>
        ) : complete ? (
          <>
            <CheckCircle sx={{ fontSize: 56, color: "success.main", mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              {status}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Check your downloads folder.
            </Typography>
          </>
        ) : (
          <>
            <Box sx={{ position: "relative", display: "inline-flex", mb: 3 }}>
              <CircularProgress size={56} />
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CloudDownload sx={{ color: "primary.main", fontSize: 24 }} />
              </Box>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Processing Shared File
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {status}
            </Typography>
          </>
        )}
      </Paper>
    </Box>
  );
}
