import { useEffect } from "react";
type EcJwk = {
  kty: "EC";
  crv: "P-256";
  x: string;
  y: string;
  ext?: boolean;
  key_ops?: string[];
};
export type PublicEcJwk = EcJwk;

export type PrivateEcJwk = EcJwk & {
  d: string;
};

export default function EcdhTest() {
  async function generateKeyPairJwk() {
    const keyPair = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveBits"]
    );

    return {
      publicJwk: await crypto.subtle.exportKey("jwk", keyPair.publicKey),
      privateJwk: await crypto.subtle.exportKey("jwk", keyPair.privateKey),
    };
  }

  async function importPublicKey(jwk) {
    return crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      []
    );
  }

  async function importPrivateKey(jwk) {
    return crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      ["deriveBits"]
    );
  }
  async function deriveSecret(
    privateKey: CryptoKey,
    otherPublicKey: CryptoKey
  ) {
    return crypto.subtle.deriveBits(
      { name: "ECDH", public: otherPublicKey },
      privateKey,
      256
    );
  }

  useEffect(() => {
    async function testECDH() {
      // Alice
      const alice = await generateKeyPairJwk();

      // Bob
      const bob = await generateKeyPairJwk();

      // Import keys
      const alicePrivate = await importPrivateKey(alice.privateJwk);
      const bobPrivate = await importPrivateKey(bob.privateJwk);

      const alicePublic = await importPublicKey(alice.publicJwk);
      const bobPublic = await importPublicKey(bob.publicJwk);

      // Derive secrets
      const aliceSecret = await deriveSecret(alicePrivate, bobPublic);
      const bobSecret = await deriveSecret(bobPrivate, alicePublic);

      // Compare
      const a = new Uint8Array(aliceSecret);
      const b = new Uint8Array(bobSecret);

      console.log("Alice secret:", a);
      console.log("Bob secret:  ", b);
      console.log(
        "Match:",
        a.every((v, i) => v === b[i])
      );
    }

    testECDH();
  }, []);

  return <div>Check console for ECDH test</div>;
}
