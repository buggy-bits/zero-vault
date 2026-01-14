import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { downloadAndDecryptFile } from "../services/downloadAndDecryptFile";
import api from "../services/api";
import { API_ENDPOINTS } from "../constants";

interface EncryptedFile {
  _id: string;
  originalFileName: string;
  mimeType: string;
  encryptedDEK: string;
  dekIv: string;
  ephemeralPublicKey: string;
  iv: string;
}

export default function EncryptedFilesList() {
  const { privateKey } = useAuth();
  const [files, setFiles] = useState<EncryptedFile[]>([]);
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
      console.error("Failed to fetch files");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(file: EncryptedFile) {
    if (!privateKey) return;

    setDownloading(file._id);
    try {
      await downloadAndDecryptFile(file, privateKey);
    } catch (err) {
      alert("Failed to download/decrypt file");
    } finally {
      setDownloading(null);
    }
  }

  if (loading) return <p style={{ padding: 20 }}>Loading files…</p>;
  if (!files.length) return <p style={{ padding: 20 }}>No encrypted files</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Your Encrypted Files</h2>

      {files.map((file) => (
        <div 
          key={file._id} 
          style={{ 
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 12,
            marginBottom: 8,
            border: "1px solid #444",
            borderRadius: 8,
            background: "rgba(26, 26, 46, 0.5)",
          }}
        >
          <span>{file.originalFileName}</span>

          <button
            onClick={() => handleDownload(file)}
            disabled={downloading === file._id}
            style={{
              padding: "8px 16px",
              background: downloading === file._id ? "#444" : "#6366f1",
              border: "none",
              borderRadius: 4,
              color: "white",
              cursor: downloading === file._id ? "wait" : "pointer",
            }}
          >
            {downloading === file._id ? "Decrypting..." : "Download & Decrypt"}
          </button>
        </div>
      ))}
    </div>
  );
}
