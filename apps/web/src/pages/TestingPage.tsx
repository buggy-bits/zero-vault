import { useState } from "react";
import { generateKeyPair } from "../crypto/identity";
import { encryptPrivateKey, decryptPrivateKey } from "../crypto/password";
import { encryptText, decryptText } from "../crypto/symmetric";
import { encryptAESKey, decryptAESKey } from "../crypto/hybrid";

function TestingPage() {
  const [password, setPassword] = useState("");
  const [plaintext, setPlaintext] = useState("");
  const [output, setOutput] = useState<Record<string, unknown>>({});
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [publicKey, setPublicKey] = useState<JsonWebKey | null>(null);

  async function handleGenerate() {
    const keys = await generateKeyPair();
    setPublicKey(keys.publicKeyJwk);
    const encrypted = await encryptPrivateKey(keys.privateKeyJwk, password);
    setOutput({ encryptedPrivateKey: encrypted });
  }

  async function handleEncrypt() {
    if (!publicKey) return;

    const sym = await encryptText(plaintext);
    const wrappedKey = await encryptAESKey(sym.rawKey, publicKey);

    setOutput({
      ...output,
      encryptedText: sym.encryptedText,
      iv: sym.iv,
      wrappedKey,
    });
  }

  async function handleDecrypt() {
    const pk = await decryptPrivateKey(output.encryptedPrivateKey as { ciphertext: string; iv: string; salt: string }, password);
    setPrivateKey(pk);

    const rawKey = await decryptAESKey(output.wrappedKey, pk);
    const text = await decryptText(output.encryptedText as string, output.iv as string, rawKey);

    alert(text);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Crypto Testing Page</h2>
      <p>Use this page to test encryption/decryption flows</p>
      
      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 8, marginRight: 8 }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <textarea
          placeholder="Plaintext to encrypt"
          onChange={(e) => setPlaintext(e.target.value)}
          rows={4}
          style={{ width: "100%", maxWidth: 400, padding: 8 }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={handleGenerate} style={{ padding: "8px 16px" }}>
          1. Generate Keys
        </button>
        <button onClick={handleEncrypt} style={{ padding: "8px 16px" }}>
          2. Encrypt
        </button>
        <button onClick={handleDecrypt} style={{ padding: "8px 16px" }}>
          3. Decrypt
        </button>
      </div>

      <pre style={{ 
        background: "#1a1a2e", 
        padding: 16, 
        borderRadius: 8,
        overflow: "auto",
        maxHeight: 400
      }}>
        {JSON.stringify(output, null, 2)}
      </pre>
    </div>
  );
}

export default TestingPage;
