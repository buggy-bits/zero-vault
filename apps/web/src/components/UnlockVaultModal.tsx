import { useState } from "react";
import { decryptPrivateKey } from "../crypto/password";
import { useAuth } from "../contexts/AuthContext";
import { EncryptedPrivateKey } from "../types/crypto";

export default function UnlockVaultModal() {
  const { user, setPrivateKey } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleUnlock() {
    try {
      const privateKey = await decryptPrivateKey(
        user?.encryptedPrivateKey as EncryptedPrivateKey,
        password
      );
      setPrivateKey(privateKey);
      setPassword("");
    } catch {
      setError("Wrong password");
    }
  }

  return (
    <div className="modal">
      <h2>🔐 Unlock Vault</h2>
      <p>Enter your password to access your encrypted data.</p>

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleUnlock}>Unlock</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
