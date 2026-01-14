import { decryptAESKey } from "../crypto/hybrid";
import { decryptBytes } from "../crypto/symmetric";
import { base64ToBuffer } from "../crypto/utils";
import { API_ENDPOINTS } from "../constants";
import { ENV } from "../config/env";

interface FileMetadata {
  _id: string;
  originalFileName: string;
  mimeType: string;
  encryptedDEK: string;
  dekIv: string;
  ephemeralPublicKey: string;
  iv: string;
}

export async function downloadAndDecryptFile(
  file: FileMetadata,
  privateKey: CryptoKey
) {
  // 1. Download encrypted file
  const res = await fetch(
    `${ENV.API_BASE_URL}${API_ENDPOINTS.FILES.DOWNLOAD}/${file._id}`,
    { credentials: "include" }
  );

  if (!res.ok) {
    throw new Error("Failed to download file");
  }

  const encryptedBuffer = await res.arrayBuffer();

  // 2. Parse ephemeralPublicKey (handle both string and object formats)
  let ephemeralPublicKey: JsonWebKey;
  if (typeof file.ephemeralPublicKey === "string") {
    ephemeralPublicKey = JSON.parse(file.ephemeralPublicKey);
  } else {
    ephemeralPublicKey = file.ephemeralPublicKey as unknown as JsonWebKey;
  }

  // 3. Parse iv (handle both string and array formats)
  let ivArray: number[];
  if (typeof file.iv === "string") {
    ivArray = JSON.parse(file.iv);
  } else {
    ivArray = file.iv as unknown as number[];
  }

  // 4. Decrypt DEK
  const rawDEK = await decryptAESKey(
    {
      encryptedAESKey: file.encryptedDEK,
      iv: file.dekIv,
      ephemeralPublicKey,
    },
    privateKey
  );

  // 5. Decrypt file
  const decryptedBuffer = await decryptBytes(
    encryptedBuffer,
    ivArray,
    base64ToBuffer(rawDEK)
  );

  // 4. Trigger download
  const blob = new Blob([decryptedBuffer], {
    type: file.mimeType,
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.originalFileName;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}
