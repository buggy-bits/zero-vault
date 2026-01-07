import { useState } from "react";
import { encryptBytes } from "../crypto/symmetric";
import { encryptAESKey } from "../crypto/hybrid";
import { useAuth } from "../contexts/AuthContext";
import { bufferToBase64 } from "../crypto/utils";

export default function UploadFile() {
  const { user, privateKey } = useAuth();
  const [file, setFile] = useState<File | null>(null);

  async function handleUpload() {
    if (!file || !privateKey || !user || !user.publicKey) return;

    // 1. Read file
    const buffer = await file.arrayBuffer();

    // 2. Encrypt file bytes
    const { encryptedData, iv, rawKey } = await encryptBytes(buffer);

    // 3. Encrypt DEK for owner
    const wrapped = await encryptAESKey(bufferToBase64(rawKey), user.publicKey);

    // 4. Build multipart form
    const formData = new FormData();
    formData.append(
      "encryptedFile",
      new Blob([encryptedData]),
      file.name + ".enc"
    );
    formData.append("iv", JSON.stringify(iv));
    formData.append("encryptedDEK", wrapped.encryptedAESKey);
    formData.append("dekIv", wrapped.iv);
    formData.append(
      "ephemeralPublicKey",
      JSON.stringify(wrapped.ephemeralPublicKey)
    );
    formData.append("originalFileName", file.name);
    formData.append("mimeType", file.type);

    // 5. Send to backend
    const res = await fetch("http://localhost:3000/api/v1/files/upload", {
      method: "POST",
      credentials: "include", // JWT cookie
      body: formData,
    });

    if (!res.ok) {
      alert("Upload failed");
      return;
    }

    alert("Encrypted file uploaded");
  }

  return (
    <>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button onClick={handleUpload}>Upload Encrypted File</button>
    </>
  );
}
