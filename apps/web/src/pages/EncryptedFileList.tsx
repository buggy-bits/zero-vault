import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { downloadAndDecryptFile } from "../services/downloadAndDecryptFile";

export default function EncryptedFilesList() {
  const { privateKey } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token =
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("accessToken="))
      ?.split("=")[1] || "";
  useEffect(() => {
    fetch("http://localhost:3000/api/v1/notes/files", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setFiles(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading files…</p>;
  if (!files.length) return <p>No encrypted files</p>;

  return (
    <div>
      <h3>Your Encrypted Files</h3>

      {files.map((file) => (
        <div key={file._id} style={{ marginBottom: 10 }}>
          <span>{file.originalFileName}</span>

          <button
            onClick={() => downloadAndDecryptFile(file, privateKey!, token)}
          >
            Download & Decrypt
          </button>
        </div>
      ))}
    </div>
  );
}
