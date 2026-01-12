import { useState } from "react";

interface Props {
  noteId: string;
  onShare: (receiverEmail: string) => Promise<void>;
}

export default function ShareFile({ noteId, onShare }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  async function handleShare() {
    setLoading(true);
    const shareLink = await onShare(email);
    setLink(shareLink);
    setLoading(false);
  }

  return (
    <div>
      <h3>Share file</h3>

      <input
        type="email"
        placeholder="Receiver email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={handleShare} disabled={loading}>
        Share
      </button>

      {link && (
        <div>
          <p>Share link:</p>
          <input value={link} readOnly />
        </div>
      )}
    </div>
  );
}
