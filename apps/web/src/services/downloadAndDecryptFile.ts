import { decryptAESKey } from "../crypto/hybrid";
import { decryptBytes } from "../crypto/symmetric";
import { base64ToBuffer } from "../crypto/utils";

export async function downloadAndDecryptFile(
  note: any,
  privateKey: CryptoKey,
  token: string
) {
  // 1. Download encrypted file
  const res = await fetch(
    `http://localhost:3000/api/v1/files/download/${note._id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    }
  );

  const encryptedBuffer = await res.arrayBuffer();
  console.log(note);
  // 2. Decrypt DEK
  const rawDEK = await decryptAESKey(
    {
      encryptedAESKey: note.encryptedDEK,
      iv: note.dekIv,
      ephemeralPublicKey: JSON.parse(note.ephemeralPublicKey),
    },
    privateKey
  );

  const decryptedBuffer = await decryptBytes(
    encryptedBuffer,
    JSON.parse(note.iv),
    base64ToBuffer(rawDEK)
  );

  const blob = new Blob([decryptedBuffer], {
    type: note.mimeType,
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = note.originalFileName;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}
