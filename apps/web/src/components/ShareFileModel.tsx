import { useState } from "react";
import { decryptAESKey, encryptAESKey } from "../crypto/hybrid";
import { useAuth } from "../contexts/AuthContext";

interface Props {
  file: any;
  onClose: () => void;
}

export default function ShareFileModal({ file, onClose }: Props) {
  const { privateKey } = useAuth();
  const [email, setEmail] = useState("");
  const [link, setLink] = useState<string | null>(null);

  async function handleShare() {
    // 1. get receiver public key
    const res = await fetch(
      `http://localhost:3000/api/v1/user/public-key?email=${email}`,
      {
        credentials: "include",
      }
    );
    const receiver = await res.json();

    // 2. decrypt owner DEK (you already do this elsewhere)
    const ownerKeyMeta = await fetch(
      `http://localhost:3000/api/v1/notes/metadata/file/${file._id}`,
      {
        credentials: "include",
      }
    ).then((r) => r.json());

    // ephemeralPublicKey is a stringified JWK → must be parsed
    if (typeof ownerKeyMeta.ephemeralPublicKey === "string") {
      ownerKeyMeta.ephemeralPublicKey = JSON.parse(
        ownerKeyMeta.ephemeralPublicKey
      );
    }

    ownerKeyMeta.iv = ownerKeyMeta.dekIv; // align naming
    ownerKeyMeta.encryptedAESKey = ownerKeyMeta.encryptedDEK; // align naming

    const rawDEK = await decryptAESKey(ownerKeyMeta, privateKey!);

    // 3. encrypt DEK for receiver
    const wrapped = await encryptAESKey(rawDEK, receiver.publicKey);

    // 4. call share API
    const shareRes = await fetch("http://localhost:3000/api/v1/share/file", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        noteId: file._id,
        receiverEmail: email,
        encryptedDEK: wrapped.encryptedAESKey,
        dekIv: wrapped.iv,
        ephemeralPublicKey: wrapped.ephemeralPublicKey,
      }),
    });

    const data = await shareRes.json();
    setLink(data.shareLink);
  }

  return (
    <div>
      <h3>Share File</h3>

      <input
        type="email"
        placeholder="Receiver email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={handleShare}>Create Share Link</button>

      {link && (
        <div>
          <p>Share link:</p>
          <input value={link} readOnly />
        </div>
      )}

      <button onClick={onClose}>Close</button>
    </div>
  );
}
