import { encryptText } from "../crypto/symmetric";
import { encryptAESKey } from "../crypto/hybrid";
// import api from "./api";
import axios from "axios";

export async function createNote(
  plaintext: string,
  userPublicKey: JsonWebKey,
  token?: string
) {
  // 1. Encrypt note content
  const encrypted = await encryptText(plaintext);
  console.log("1. Encrypted note content:", encrypted);
  // 2. Encrypt DEK for owner (self)
  const wrappedKey = await encryptAESKey(encrypted.rawKey, userPublicKey);
  console.log("2. Encrypted DEK for owner:", wrappedKey);
  // 3. Send to backend
  const res = await axios.post(
    "http://localhost:3000/api/v1/notes",
    {
      encryptedContent: encrypted.encryptedText,
      iv: encrypted.iv,
      encryptedDEK: wrappedKey.encryptedAESKey,
      dekIv: wrappedKey.iv,
      ephemeralPublicKey: wrappedKey.ephemeralPublicKey,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  console.log("3. Backend response:", res.data);
  // Axios throws automatically on non-2xx responses,
  // so no need for a manual res.ok check
  return res.data;
}
