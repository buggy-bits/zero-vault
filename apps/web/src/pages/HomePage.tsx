import { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Divider,
  Alert,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Fade,
} from "@mui/material";
import {
  Shield,
  Lock,
  LockOpen,
  Visibility,
  VisibilityOff,
  Security,
  Key,
  CloudOff,
  Share,
  Description,
  CloudUpload,
  VerifiedUser,
  ArrowForward,
  PlayArrow,
  CheckCircle,
  Error as ErrorIcon,
  Person,
  VpnKey,
  Send,
  ContentCopy,
  Refresh,
} from "@mui/icons-material";

// ============================================================================
// ASYMMETRIC CRYPTO UTILITIES - This is what ZeroVault actually uses!
// ============================================================================

interface KeyPairData {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  publicKeyJwk: JsonWebKey;
}

// Generate ECDH key pair (same as ZeroVault uses)
async function generateKeyPair(): Promise<KeyPairData> {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"],
  );

  const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    publicKeyJwk,
  };
}

// Derive shared secret using ECDH (sender's private + recipient's public)
async function deriveSharedKey(
  privateKey: CryptoKey,
  publicKeyJwk: JsonWebKey,
): Promise<CryptoKey> {
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    publicKeyJwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  return crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

// Encrypt message with derived shared key
async function encryptWithSharedKey(
  plaintext: string,
  sharedKey: CryptoKey,
): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    new TextEncoder().encode(plaintext),
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

// Decrypt message with derived shared key
async function decryptWithSharedKey(
  ciphertextB64: string,
  ivB64: string,
  sharedKey: CryptoKey,
): Promise<string> {
  const ciphertext = Uint8Array.from(atob(ciphertextB64), (c) =>
    c.charCodeAt(0),
  );
  const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    ciphertext,
  );

  return new TextDecoder().decode(decrypted);
}

// Format public key for display
function formatPublicKey(jwk: JsonWebKey): string {
  const x = jwk.x?.substring(0, 8) || "";
  const y = jwk.y?.substring(0, 8) || "";
  return `${x}...${y}...`;
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: "100%",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: "primary.light",
          boxShadow: "0 4px 20px rgba(79, 70, 229, 0.1)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <Box sx={{ color: "primary.main", mb: 2 }}>{icon}</Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Paper>
  );
}

function StepCard({
  number,
  icon,
  title,
  description,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Box sx={{ textAlign: "center", position: "relative" }}>
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          bgcolor: "primary.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
          mb: 2,
          boxShadow: "0 4px 20px rgba(79, 70, 229, 0.3)",
          position: "relative",
        }}
      >
        <Box sx={{ color: "white", fontSize: 32 }}>{icon}</Box>
        <Chip
          label={number}
          size="small"
          sx={{
            position: "absolute",
            top: -8,
            right: -8,
            bgcolor: "secondary.main",
            color: "white",
            fontWeight: 700,
            minWidth: 28,
            height: 28,
          }}
        />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ maxWidth: 280, mx: "auto" }}
      >
        {description}
      </Typography>
    </Box>
  );
}

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 2,
        py: 1,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <Box sx={{ color: "primary.main" }}>{icon}</Box>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {label}
      </Typography>
    </Box>
  );
}

// User avatar with key indicator
function UserAvatar({
  name,
  color,
  hasKeys,
}: {
  name: string;
  color: string;
  hasKeys: boolean;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Avatar sx={{ bgcolor: color, width: 48, height: 48, fontWeight: 600 }}>
        {name[0]}
      </Avatar>
      <Box>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, lineHeight: 1.2 }}
        >
          {name}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {hasKeys ? (
            <>
              <VpnKey sx={{ fontSize: 14, color: "success.main" }} />
              <Typography variant="caption" color="success.main">
                Keys Generated
              </Typography>
            </>
          ) : (
            <Typography variant="caption" color="text.secondary">
              No keys yet
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function HomePage() {
  // Demo state
  const [activeStep, setActiveStep] = useState(0);
  const [aliceKeys, setAliceKeys] = useState<KeyPairData | null>(null);
  const [bobKeys, setBobKeys] = useState<KeyPairData | null>(null);
  const [message, setMessage] = useState(
    "Hey Bob! This is a secret message only you can read. 🔐",
  );
  const [encryptedData, setEncryptedData] = useState<{
    ciphertext: string;
    iv: string;
  } | null>(null);
  const [decryptedMessage, setDecryptedMessage] = useState("");
  const [hackerFailed, setHackerFailed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Animated text effect for hero
  const [displayText, setDisplayText] = useState("");
  const fullText = "Your Data. Your Keys. Zero Knowledge.";

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setDisplayText(fullText.substring(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // Step 1: Generate keys for both users
  const handleGenerateKeys = async () => {
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 800));

    const alice = await generateKeyPair();
    const bob = await generateKeyPair();

    setAliceKeys(alice);
    setBobKeys(bob);
    setIsProcessing(false);
    setActiveStep(1);
  };

  // Step 2: Alice encrypts for Bob
  const handleEncrypt = async () => {
    if (!aliceKeys || !bobKeys || !message.trim()) return;

    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 600));

    // Alice uses her private key + Bob's public key to derive shared secret
    const sharedKey = await deriveSharedKey(
      aliceKeys.privateKey,
      bobKeys.publicKeyJwk,
    );
    const encrypted = await encryptWithSharedKey(message, sharedKey);

    setEncryptedData(encrypted);
    setIsProcessing(false);
    setActiveStep(2);
  };

  // Step 3: Bob decrypts
  const handleBobDecrypt = async () => {
    if (!bobKeys || !aliceKeys || !encryptedData) return;

    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 600));

    try {
      // Bob uses his private key + Alice's public key to derive the SAME shared secret
      const sharedKey = await deriveSharedKey(
        bobKeys.privateKey,
        aliceKeys.publicKeyJwk,
      );
      const decrypted = await decryptWithSharedKey(
        encryptedData.ciphertext,
        encryptedData.iv,
        sharedKey,
      );
      setDecryptedMessage(decrypted);
      setActiveStep(3);
    } catch {
      // Should not happen with correct keys
    }

    setIsProcessing(false);
  };

  // Hacker tries with wrong keys
  const handleHackerAttempt = async () => {
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 800));

    // Generate random "hacker" keys
    const hackerKeys = await generateKeyPair();

    try {
      // Hacker tries with their own private key + Alice's public key
      // This produces a DIFFERENT shared secret, so decryption FAILS
      const wrongSharedKey = await deriveSharedKey(
        hackerKeys.privateKey,
        aliceKeys!.publicKeyJwk,
      );
      await decryptWithSharedKey(
        encryptedData!.ciphertext,
        encryptedData!.iv,
        wrongSharedKey,
      );
    } catch {
      setHackerFailed(true);
    }

    setIsProcessing(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setActiveStep(0);
    setAliceKeys(null);
    setBobKeys(null);
    setEncryptedData(null);
    setDecryptedMessage("");
    setHackerFailed(false);
    setMessage("Hey Bob! This is a secret message only you can read. 🔐");
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Navigation Bar */}
      <Box
        component="nav"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          bgcolor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              py: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {/* <Shield sx={{ color: "primary.main", fontSize: 32 }} /> */}
              <img src="z_logo_b.svg" alt="" width={32} />
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: "text.primary" }}
              >
                ZeroVault
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                component={RouterLink}
                to="/auth/login"
                variant="text"
                sx={{ fontWeight: 500 }}
              >
                Sign In
              </Button>
              <Button
                component={RouterLink}
                to="/auth/register"
                variant="contained"
                startIcon={<ArrowForward />}
              >
                Get Started
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          pt: { xs: 8, md: 12 },
          pb: { xs: 6, md: 10 },
          background:
            "linear-gradient(180deg, rgba(79, 70, 229, 0.05) 0%, rgba(255,255,255,0) 100%)",
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", maxWidth: 800, mx: "auto" }}>
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 4,
                boxShadow: "0 8px 32px rgba(79, 70, 229, 0.4)",
                animation: "pulse 2s ease-in-out infinite",
                "@keyframes pulse": {
                  "0%, 100%": {
                    boxShadow: "0 8px 32px rgba(79, 70, 229, 0.4)",
                  },
                  "50%": { boxShadow: "0 8px 48px rgba(79, 70, 229, 0.6)" },
                },
              }}
            >
              <Lock sx={{ fontSize: 48, color: "white" }} />
            </Box>

            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "2rem", md: "3rem" },
                fontWeight: 700,
                color: "text.primary",
                mb: 3,
                minHeight: { xs: "auto", md: "72px" },
              }}
            >
              {displayText}
              <Box
                component="span"
                sx={{
                  display: "inline-block",
                  width: 3,
                  height: "1em",
                  bgcolor: "primary.main",
                  ml: 0.5,
                  animation: "blink 1s step-end infinite",
                  "@keyframes blink": {
                    "0%, 100%": { opacity: 1 },
                    "50%": { opacity: 0 },
                  },
                }}
              />
            </Typography>

            <Typography
              variant="h5"
              color="text.secondary"
              sx={{ mb: 4, maxWidth: 600, mx: "auto", lineHeight: 1.6 }}
            >
              Share secrets with anyone using cryptographic key exchange. Even
              we can't read your data — only the intended recipient can.
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Button
                component={RouterLink}
                to="/auth/register"
                variant="contained"
                size="large"
                startIcon={<ArrowForward />}
                sx={{ px: 4, py: 1.5 }}
              >
                Start Encrypting
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<PlayArrow />}
                onClick={() => {
                  document
                    .getElementById("playground")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                sx={{ px: 4, py: 1.5 }}
              >
                Try the Demo
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Trust Badges */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <TrustBadge
            icon={<Security fontSize="small" />}
            label="AES-256-GCM Encryption"
          />
          <TrustBadge
            icon={<Key fontSize="small" />}
            label="ECDH Key Exchange"
          />
          <TrustBadge
            icon={<CloudOff fontSize="small" />}
            label="Client-Side Only"
          />
          <TrustBadge
            icon={<VerifiedUser fontSize="small" />}
            label="Zero Server Access"
          />
        </Box>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ py: 8, bgcolor: "background.paper" }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            sx={{ textAlign: "center", fontWeight: 700, mb: 2 }}
          >
            How It Works
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ textAlign: "center", mb: 6, maxWidth: 600, mx: "auto" }}
          >
            Secure sharing through cryptographic key exchange. No passwords to
            share.
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <Box
              sx={{
                flex: { xs: "1 1 100%", md: "1 1 30%" },
                maxWidth: { md: 350 },
              }}
            >
              <StepCard
                number={1}
                icon={<VpnKey sx={{ fontSize: 36, display: "block" }} />}
                title="Everyone Gets Keys"
                description="Each user generates their own key pair — a public key to share, and a private key that never leaves their device."
              />
            </Box>
            <Box
              sx={{
                flex: { xs: "1 1 100%", md: "1 1 30%" },
                maxWidth: { md: 350 },
              }}
            >
              <StepCard
                number={2}
                icon={<Lock sx={{ fontSize: 36, display: "block" }} />}
                title="Encrypt for Recipient"
                description="When you share data, it's encrypted specifically for the recipient using their public key. No one else can read it."
              />
            </Box>
            <Box
              sx={{
                flex: { xs: "1 1 100%", md: "1 1 30%" },
                maxWidth: { md: 350 },
              }}
            >
              <StepCard
                number={3}
                icon={<LockOpen sx={{ fontSize: 36, display: "block" }} />}
                title="Only They Decrypt"
                description="The recipient uses their private key to decrypt. Not us, not hackers, not even you — only the intended recipient."
              />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Interactive Demo - The Star Feature */}
      <Box id="playground" sx={{ py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Chip
              label="INTERACTIVE DEMO"
              size="small"
              sx={{
                mb: 2,
                bgcolor: "primary.main",
                color: "white",
                fontWeight: 600,
              }}
            />
            <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
              🔐 See Zero-Knowledge In Action
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 600, mx: "auto" }}
            >
              Watch how Alice sends a secret to Bob that{" "}
              <strong>only Bob can read</strong>. This is real cryptography
              running in your browser — the same tech that powers ZeroVault.
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 5 },
              border: "2px solid",
              borderColor: "primary.light",
              borderRadius: 3,
              bgcolor: "background.paper",
            }}
          >
            {/* Users Display */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-around",
                gap: 3,
                mb: 4,
                pb: 4,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box sx={{ textAlign: "center" }}>
                <UserAvatar
                  name="Alice"
                  color="#4f46e5"
                  hasKeys={!!aliceKeys}
                />
                {aliceKeys && (
                  <Fade in>
                    <Paper
                      sx={{
                        mt: 2,
                        p: 1.5,
                        bgcolor: "rgba(79, 70, 229, 0.05)",
                        border: "1px solid",
                        borderColor: "primary.light",
                        borderRadius: 1,
                        maxWidth: 200,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mb: 0.5 }}
                      >
                        Public Key:
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: "monospace",
                          color: "primary.main",
                          wordBreak: "break-all",
                        }}
                      >
                        {formatPublicKey(aliceKeys.publicKeyJwk)}
                      </Typography>
                    </Paper>
                  </Fade>
                )}
              </Box>

              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Send
                  sx={{
                    fontSize: 32,
                    color: activeStep >= 2 ? "primary.main" : "divider",
                  }}
                />
              </Box>

              <Box sx={{ textAlign: "center" }}>
                <UserAvatar name="Bob" color="#0f766e" hasKeys={!!bobKeys} />
                {bobKeys && (
                  <Fade in>
                    <Paper
                      sx={{
                        mt: 2,
                        p: 1.5,
                        bgcolor: "rgba(15, 118, 110, 0.05)",
                        border: "1px solid",
                        borderColor: "secondary.light",
                        borderRadius: 1,
                        maxWidth: 200,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mb: 0.5 }}
                      >
                        Public Key:
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: "monospace",
                          color: "secondary.main",
                          wordBreak: "break-all",
                        }}
                      >
                        {formatPublicKey(bobKeys.publicKeyJwk)}
                      </Typography>
                    </Paper>
                  </Fade>
                )}
              </Box>
            </Box>

            {/* Demo Steps */}
            <Stepper activeStep={activeStep} orientation="vertical">
              {/* Step 1: Generate Keys */}
              <Step>
                <StepLabel>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Generate Key Pairs
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Each person generates their own cryptographic key pair. The{" "}
                    <strong>public key</strong> can be shared with anyone, but
                    the <strong>private key</strong> stays secret on their
                    device.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleGenerateKeys}
                    disabled={isProcessing}
                    startIcon={<VpnKey />}
                  >
                    {isProcessing ? "Generating..." : "Generate Keys for Both"}
                  </Button>
                </StepContent>
              </Step>

              {/* Step 2: Alice Encrypts */}
              <Step>
                <StepLabel>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Alice Encrypts for Bob
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Alice writes a message and encrypts it using{" "}
                    <strong>Bob's public key</strong>. The magic? Only Bob's
                    private key can decrypt it.
                  </Typography>

                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write a secret message..."
                    sx={{ mb: 2 }}
                  />

                  <Button
                    variant="contained"
                    onClick={handleEncrypt}
                    disabled={isProcessing || !message.trim()}
                    startIcon={<Lock />}
                  >
                    {isProcessing ? "Encrypting..." : "Encrypt & Send to Bob"}
                  </Button>
                </StepContent>
              </Step>

              {/* Step 3: Show Encrypted Output */}
              <Step>
                <StepLabel>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    The Server Sees Only Gibberish
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    This is what ZeroVault's server sees. Without Bob's private
                    key, it's completely meaningless!
                  </Alert>

                  {encryptedData && (
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: "#1e293b",
                        borderRadius: 2,
                        fontFamily: "monospace",
                        fontSize: "0.75rem",
                        color: "#94a3b8",
                        mb: 3,
                        position: "relative",
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleCopy(encryptedData.ciphertext)}
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          color: "#94a3b8",
                        }}
                      >
                        <ContentCopy fontSize="small" />
                      </IconButton>
                      <Box sx={{ color: "#4ade80", mb: 1 }}>
                        // Encrypted Message (ciphertext)
                      </Box>
                      <Box
                        sx={{ wordBreak: "break-all", color: "#f1f5f9", mb: 2 }}
                      >
                        {encryptedData.ciphertext}
                      </Box>
                      <Box sx={{ color: "#4ade80", mb: 1 }}>
                        // Initialization Vector
                      </Box>
                      <Box sx={{ color: "#f1f5f9" }}>{encryptedData.iv}</Box>
                    </Paper>
                  )}

                  {copied && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Copied to clipboard!
                    </Alert>
                  )}

                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleBobDecrypt}
                      disabled={isProcessing}
                      startIcon={<LockOpen />}
                    >
                      {isProcessing
                        ? "Decrypting..."
                        : "Bob Decrypts with His Key"}
                    </Button>

                    {!hackerFailed && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleHackerAttempt}
                        disabled={isProcessing}
                        startIcon={<Person />}
                      >
                        Hacker Tries to Decrypt
                      </Button>
                    )}
                  </Box>

                  {hackerFailed && (
                    <Fade in>
                      <Alert
                        severity="error"
                        icon={<ErrorIcon />}
                        sx={{ mt: 2 }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          ❌ Hacker Failed!
                        </Typography>
                        <Typography variant="body2">
                          Without Bob's private key, decryption is
                          mathematically impossible. This is the power of
                          asymmetric cryptography.
                        </Typography>
                      </Alert>
                    </Fade>
                  )}
                </StepContent>
              </Step>

              {/* Step 4: Success */}
              <Step>
                <StepLabel>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Only Bob Can Read It ✨
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Alert
                    severity="success"
                    icon={<CheckCircle />}
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Bob successfully decrypted the message!
                    </Typography>
                  </Alert>

                  <Paper
                    sx={{
                      p: 3,
                      bgcolor: "rgba(5, 150, 105, 0.08)",
                      border: "2px solid",
                      borderColor: "success.main",
                      borderRadius: 2,
                      mb: 3,
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      "{decryptedMessage}"
                    </Typography>
                  </Paper>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3 }}
                  >
                    <strong>🎉 That's it!</strong> Alice sent a secret that only
                    Bob could read. The server never had access to it. Even if
                    someone intercepted it mid-transit, they'd only get
                    encrypted gibberish.
                  </Typography>

                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={handleReset}
                    >
                      Try Again
                    </Button>
                    <Button
                      variant="contained"
                      component={RouterLink}
                      to="/auth/register"
                      startIcon={<ArrowForward />}
                    >
                      Create Your Own Vault
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            </Stepper>

            {/* Initial CTA */}
            {activeStep === 0 && (
              <Box sx={{ textAlign: "center", mt: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Click the button above to start the demo. No data leaves your
                  browser!
                </Typography>
              </Box>
            )}
          </Paper>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8, bgcolor: "background.paper" }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            sx={{ textAlign: "center", fontWeight: 700, mb: 2 }}
          >
            Everything You Need
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ textAlign: "center", mb: 6, maxWidth: 600, mx: "auto" }}
          >
            Secure note-taking and file storage with zero-knowledge encryption.
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                flex: { xs: "1 1 100%", sm: "1 1 45%", md: "1 1 22%" },
                minWidth: 250,
              }}
            >
              <FeatureCard
                icon={<Description sx={{ fontSize: 32 }} />}
                title="Encrypted Notes"
                description="Create text notes that are encrypted before leaving your browser. Only you can read them."
              />
            </Box>
            <Box
              sx={{
                flex: { xs: "1 1 100%", sm: "1 1 45%", md: "1 1 22%" },
                minWidth: 250,
              }}
            >
              <FeatureCard
                icon={<CloudUpload sx={{ fontSize: 32 }} />}
                title="Secure File Storage"
                description="Upload files encrypted to your own Google Drive. We never see your file contents."
              />
            </Box>
            <Box
              sx={{
                flex: { xs: "1 1 100%", sm: "1 1 45%", md: "1 1 22%" },
                minWidth: 250,
              }}
            >
              <FeatureCard
                icon={<Share sx={{ fontSize: 32 }} />}
                title="Share Securely"
                description="Share notes and files with others through cryptographic key exchange — just like the demo above."
              />
            </Box>
            <Box
              sx={{
                flex: { xs: "1 1 100%", sm: "1 1 45%", md: "1 1 22%" },
                minWidth: 250,
              }}
            >
              <FeatureCard
                icon={<Shield sx={{ fontSize: 32 }} />}
                title="Zero Knowledge"
                description="Even if our servers are breached, your data remains encrypted and safe."
              />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: 10,
          background: "linear-gradient(135deg, #4f46e5 0%, #0f766e 100%)",
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: "center", color: "white" }}>
            <Typography
              variant="h3"
              sx={{ fontWeight: 700, mb: 2, color: "white" }}
            >
              Ready to Secure Your Data?
            </Typography>
            <Typography
              variant="h6"
              sx={{ mb: 4, opacity: 0.9, color: "white" }}
            >
              Join ZeroVault and experience true zero-knowledge security.
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Button
                component={RouterLink}
                to="/auth/register"
                variant="contained"
                size="large"
                sx={{
                  bgcolor: "white",
                  color: "primary.main",
                  px: 4,
                  py: 1.5,
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.9)",
                  },
                }}
              >
                Create Free Account
              </Button>
              <Button
                component={RouterLink}
                to="/auth/login"
                variant="outlined"
                size="large"
                sx={{
                  color: "white",
                  borderColor: "rgba(255,255,255,0.5)",
                  px: 4,
                  py: 1.5,
                  "&:hover": {
                    borderColor: "white",
                    bgcolor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                Sign In
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 4, bgcolor: "#0f172a", color: "white" }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {/* <Shield sx={{ fontSize: 24 }} /> */}
              <img src="z_logo_w.svg" alt="" width={24} />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                ZeroVault
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Built to understand. Designed to be correct.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
