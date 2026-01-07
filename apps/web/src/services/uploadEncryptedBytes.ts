import { encryptBytes } from "../crypto/symmetric";
import { encryptAESKey } from "../crypto/hybrid";
import { bufferToBase64 } from "../crypto/utils";

export async function uploadEncryptedFile(
  file: File,
  userPublicKey: JsonWebKey,
  token: string
) {
  // 1. Read file bytes
  const buffer = await file.arrayBuffer();

  // 2. Encrypt file
  const encrypted = await encryptBytes(buffer);

  // 3. Encrypt DEK for owner
  const wrappedKey = await encryptAESKey(
    bufferToBase64(encrypted.rawKey),
    userPublicKey
  );

  // 4. Build multipart form
  const formData = new FormData();

  formData.append(
    "encryptedFile",
    new Blob([encrypted.encryptedData]),
    file.name + ".enc"
  );

  formData.append("iv", JSON.stringify(encrypted.iv));
  formData.append("encryptedDEK", wrappedKey.encryptedAESKey);
  formData.append("dekIv", wrappedKey.iv);
  formData.append(
    "ephemeralPublicKey",
    JSON.stringify(wrappedKey.ephemeralPublicKey)
  );
  formData.append("originalFileName", file.name);
  formData.append("mimeType", file.type);

  // 5. Send to backend
  const res = await fetch("http://localhost:3000/api/v1/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) throw new Error("Upload failed");

  return res.json();
}
