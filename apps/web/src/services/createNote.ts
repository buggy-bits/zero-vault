import { encryptText } from "../crypto/symmetric";
import { encryptAESKey } from "../crypto/hybrid";
import api from "./api";
import { API_ENDPOINTS } from "../constants";

export async function createNote(
  plaintext: string,
  userPublicKey: JsonWebKey
) {
  // 1. Encrypt note content
  const encrypted = await encryptText(plaintext);
  
  // 2. Encrypt DEK for owner (self)
  const wrappedKey = await encryptAESKey(encrypted.rawKey, userPublicKey);
  
  // 3. Send to backend
  const res = await api.post(API_ENDPOINTS.NOTE.CREATE, {
    encryptedContent: encrypted.encryptedText,
    iv: encrypted.iv,
    encryptedDEK: wrappedKey.encryptedAESKey,
    dekIv: wrappedKey.iv,
    ephemeralPublicKey: wrappedKey.ephemeralPublicKey,
  });

  return res.data;
}
