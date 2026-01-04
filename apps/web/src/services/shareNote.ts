import { decryptAESKey, encryptAESKey } from "../crypto/hybrid";

export async function shareNote(
  noteId: string,
  noteKey: any, // Bob’s note_key row
  recipientPublicKey: JsonWebKey,
  privateKey: CryptoKey,
  token: string,
  recipientUserId: string
) {
  // 1. Decrypt DEK (Bob already has access)
  const rawDEK = await decryptAESKey(
    {
      encryptedAESKey: noteKey.encryptedDEK,
      iv: noteKey.dekIv,
      ephemeralPublicKey: noteKey.ephemeralPublicKey,
    },
    privateKey
  );

  // 2. Encrypt DEK for Alice
  const wrappedForAlice = await encryptAESKey(rawDEK, recipientPublicKey);

  // 3. Send to backend
  await fetch("http://localhost:3000/api/v1/share", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      noteId,
      userId: recipientUserId,
      encryptedDEK: wrappedForAlice.encryptedAESKey,
      dekIv: wrappedForAlice.iv,
      ephemeralPublicKey: wrappedForAlice.ephemeralPublicKey,
    }),
  });
}
