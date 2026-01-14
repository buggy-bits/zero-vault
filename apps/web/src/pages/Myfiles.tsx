import { useEffect, useState } from "react";
import ShareFileModal from "../components/ShareFileModel";
import api from "../services/api";
import { API_ENDPOINTS } from "../constants";
import toast from "react-hot-toast";
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction,
  Tooltip,
  CircularProgress,
  ListItemIcon,
} from "@mui/material";
import { Delete, Share, InsertDriveFile, CloudDownload, Folder } from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { downloadAndDecryptFile } from "../services/downloadAndDecryptFile";

interface FileRecord {
  _id: string;
  originalFileName: string;
  mimeType: string;
  encryptedDEK: string;
  dekIv: string;
  ephemeralPublicKey: string;
  iv: string;
}

export default function MyFiles() {
  const { privateKey } = useAuth();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  async function fetchFiles() {
    try {
      const res = await api.get(API_ENDPOINTS.FILES.LIST);
      setFiles(res.data);
    } catch {
      toast.error("Failed to fetch files");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(file: FileRecord) {
    if (!privateKey) {
      toast.error("Vault is locked. Please unlock first.");
      return;
    }

    setDownloading(file._id);
    try {
      await downloadAndDecryptFile(file, privateKey);
      toast.success("File downloaded successfully!");
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Failed to download/decrypt file");
    } finally {
      setDownloading(null);
    }
  }

  async function deleteFile(fileId: string) {
    if (!confirm("Delete this file permanently?")) return;

    try {
      await api.delete(`${API_ENDPOINTS.FILES.DELETE}/${fileId}`);
      setFiles((files) => files.filter((f) => f._id !== fileId));
      toast.success("File deleted");
    } catch {
      toast.error("Failed to delete file");
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress size={32} />
        <Typography color="text.secondary" sx={{ mt: 2 }}>Loading files...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: "auto" }}>
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
          <Folder sx={{ color: "primary.main" }} />
          My Files
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Your encrypted files. Download to decrypt.
        </Typography>
      </Box>

      {files.length === 0 ? (
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
          <InsertDriveFile sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No files uploaded yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload a file to get started. It will be encrypted before upload.
          </Typography>
        </Paper>
      ) : (
        <Paper 
          elevation={0}
          sx={{ 
            bgcolor: "background.paper", 
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <List disablePadding>
            {files.map((file, index) => (
              <ListItem 
                key={file._id}
                divider={index !== files.length - 1}
                sx={{ 
                  py: 2,
                  px: 3,
                  transition: "background-color 0.15s",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <ListItemIcon>
                  <InsertDriveFile sx={{ color: "primary.main" }} />
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {file.originalFileName}
                    </Typography>
                  }
                  secondary={file.mimeType}
                />

                <ListItemSecondaryAction sx={{ display: "flex", gap: 0.5 }}>
                  <Tooltip title="Download & Decrypt">
                    <IconButton 
                      onClick={() => handleDownload(file)}
                      disabled={downloading === file._id}
                      size="small"
                      sx={{ color: "primary.main" }}
                    >
                      {downloading === file._id ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <CloudDownload fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Share">
                    <IconButton 
                      onClick={() => setSelectedFile(file)}
                      size="small"
                      sx={{ color: "success.main" }}
                    >
                      <Share fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton 
                      onClick={() => deleteFile(file._id)}
                      size="small"
                      sx={{ color: "error.main" }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {selectedFile && (
        <ShareFileModal
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </Box>
  );
}
