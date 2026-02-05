import { API_ENDPOINTS } from "../constants";
import { decryptAESKey, encryptAESKey } from "../crypto/hybrid";
import api from "../services/api";

export async function shareNote(
  noteId: string,
  noteKey: any, // Bob’s note_key row
  recipientPublicKey: JsonWebKey,
  privateKey: CryptoKey,
  token: string,
  recipientUserId: string,
) {
  // 1. Decrypt DEK (Bob already has access)
  const rawDEK = await decryptAESKey(
    {
      encryptedAESKey: noteKey.encryptedDEK,
      iv: noteKey.dekIv,
      ephemeralPublicKey: noteKey.ephemeralPublicKey,
    },
    privateKey,
  );

  // 2. Encrypt DEK for Alice
  const wrappedForAlice = await encryptAESKey(rawDEK, recipientPublicKey);

  // 3. Send to backend

  await api.post(API_ENDPOINTS.SHARE.NOTE, {
    noteId,
    userId: recipientUserId,
    encryptedDEK: wrappedForAlice.encryptedAESKey,
    dekIv: wrappedForAlice.iv,
    ephemeralPublicKey: wrappedForAlice.ephemeralPublicKey,
  });
}
