import { useState } from "react";
import { generateKeyPair } from "./crypto/identity";
import { encryptPrivateKey, decryptPrivateKey } from "./crypto/password";
import { encryptText, decryptText } from "./crypto/symmetric";
import { encryptAESKey, decryptAESKey } from "./crypto/hybrid";

function App() {
  const [password, setPassword] = useState("");
  const [plaintext, setPlaintext] = useState("");
  const [output, setOutput] = useState<any>({});
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
    const pk = await decryptPrivateKey(output.encryptedPrivateKey, password);
    setPrivateKey(pk);

    const rawKey = await decryptAESKey(output.wrappedKey, pk);

    const text = await decryptText(output.encryptedText, output.iv, rawKey);

    alert(text);
  }

  return (
    <div>
      <input
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <textarea
        placeholder="Plaintext"
        onChange={(e) => setPlaintext(e.target.value)}
      />
      <button onClick={handleGenerate} className="m-4">
        Generate Keys
      </button>
      <button onClick={handleEncrypt} className="m-4">
        Encrypt
      </button>
      <button onClick={handleDecrypt} className="m-4">
        Decrypt
      </button>
      <pre>{JSON.stringify(output, null, 2)}</pre>
    </div>
  );
}

export default App;
