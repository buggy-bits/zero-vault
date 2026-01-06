import { useState } from "react";
import { encryptText } from "../crypto/symmetric";
import { encryptAESKey, decryptAESKey } from "../crypto/hybrid";
import { useAuth } from "../contexts/AuthContext";

type ReceiverInfo = {
  userId: string;
  publicKey: JsonWebKey;
};

export default function ShareNotePage() {
  const { token, publicKey, privateKey } = useAuth();

  const [note, setNote] = useState("");
  const [email, setEmail] = useState("");

  const [receiver, setReceiver] = useState<ReceiverInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // STEP 1: Check receiver existence & fetch public key
  async function handleCheckUser() {
    setStatus("");
    setReceiver(null);
    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:3000/api/v1/user/public-key?email=${encodeURIComponent(
          email
        )}`,
        {
          headers: {
            // Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("User not found");

      const data = await res.json();
      setReceiver(data);
      setStatus("✅ User found. Ready to send note.");
    } catch {
      setStatus("❌ User does not exist.");
    } finally {
      setLoading(false);
    }
  }

  // STEP 2: Encrypt note & share
  async function handleSendNote() {
    if (!receiver || !publicKey || !privateKey) return;

    setLoading(true);
    setStatus("");

    try {
      // 1. Encrypt note with DEK
      const encrypted = await encryptText(note);

      // 2. Encrypt DEK for sender (owner)
      const wrappedForSender = await encryptAESKey(encrypted.rawKey, publicKey);

      // 3. Store note
      const noteRes = await fetch("http://localhost:3000/api/v1/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          encryptedContent: encrypted.encryptedText,
          iv: encrypted.iv,
          encryptedDEK: wrappedForSender.encryptedAESKey,
          dekIv: wrappedForSender.iv,
          ephemeralPublicKey: wrappedForSender.ephemeralPublicKey,
        }),
      });

      if (!noteRes.ok) throw new Error("Failed to create note");

      const { noteId } = await noteRes.json();

      // 4. Decrypt DEK (sender already has access)
      const rawDEK = await decryptAESKey(
        {
          encryptedAESKey: wrappedForSender.encryptedAESKey,
          iv: wrappedForSender.iv,
          ephemeralPublicKey: wrappedForSender.ephemeralPublicKey,
        },
        privateKey
      );

      // 5. Encrypt DEK for receiver
      const wrappedForReceiver = await encryptAESKey(
        rawDEK,
        receiver.publicKey
      );

      // 6. Store receiver access
      await fetch("http://localhost:3000/api/v1/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          noteId,
          userId: receiver.userId,
          encryptedDEK: wrappedForReceiver.encryptedAESKey,
          dekIv: wrappedForReceiver.iv,
          ephemeralPublicKey: wrappedForReceiver.ephemeralPublicKey,
        }),
      });

      setNote("");
      setEmail("");
      setReceiver(null);
      setStatus("🎉 Note encrypted & shared successfully!");
    } catch (err) {
      setStatus("❌ Failed to send note.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h2>Secure Share Note</h2>

      <textarea
        placeholder="Write your secret note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={6}
        style={{ width: "100%" }}
      />

      <br />
      <br />

      <input
        type="email"
        placeholder="Receiver email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "70%" }}
      />

      <button onClick={handleCheckUser} disabled={loading}>
        Check User
      </button>

      <br />
      <br />

      <button onClick={handleSendNote} disabled={!receiver || loading || !note}>
        Send Encrypted Note
      </button>

      <br />
      <br />

      <p>{status}</p>
    </div>
  );
}
