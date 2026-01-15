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
  Refresh,
  CheckCircle,
  Error as ErrorIcon,
} from "@mui/icons-material";

// Crypto utilities for the playground demo
async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

async function encryptMessage(plaintext: string, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPassword(password, salt);

  const encoder = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );

  // Export key for display
  const rawKey = await crypto.subtle.exportKey("raw", key);

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt)),
    keyHex: Array.from(new Uint8Array(rawKey))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .substring(0, 32) + "...",
  };
}

async function decryptMessage(
  ciphertextB64: string,
  ivB64: string,
  saltB64: string,
  password: string
): Promise<string> {
  const ciphertext = Uint8Array.from(atob(ciphertextB64), (c) => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));

  const key = await deriveKeyFromPassword(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

// Feature card component
function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
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

// Step component for "How it works"
function StepCard({ number, icon, title, description }: { number: number; icon: React.ReactNode; title: string; description: string }) {
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
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280, mx: "auto" }}>
        {description}
      </Typography>
    </Box>
  );
}

// Trust badge component
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

export default function HomePage() {
  // Playground state
  const [plaintext, setPlaintext] = useState("");
  const [encryptPassword, setEncryptPassword] = useState("");
  const [showEncryptPassword, setShowEncryptPassword] = useState(false);
  const [encryptedData, setEncryptedData] = useState<{
    ciphertext: string;
    iv: string;
    salt: string;
    keyHex: string;
  } | null>(null);
  const [encrypting, setEncrypting] = useState(false);

  const [decryptPassword, setDecryptPassword] = useState("");
  const [showDecryptPassword, setShowDecryptPassword] = useState(false);
  const [decryptedText, setDecryptedText] = useState("");
  const [decrypting, setDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState(false);
  const [decryptSuccess, setDecryptSuccess] = useState(false);

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

  const handleEncrypt = async () => {
    if (!plaintext.trim() || !encryptPassword) return;

    setEncrypting(true);
    setEncryptedData(null);
    setDecryptedText("");
    setDecryptError(false);
    setDecryptSuccess(false);

    try {
      // Add a small delay for visual effect
      await new Promise((r) => setTimeout(r, 500));
      const result = await encryptMessage(plaintext, encryptPassword);
      setEncryptedData(result);
    } catch {
      console.error("Encryption failed");
    } finally {
      setEncrypting(false);
    }
  };

  const handleDecrypt = async () => {
    if (!encryptedData || !decryptPassword) return;

    setDecrypting(true);
    setDecryptedText("");
    setDecryptError(false);
    setDecryptSuccess(false);

    try {
      await new Promise((r) => setTimeout(r, 500));
      const result = await decryptMessage(
        encryptedData.ciphertext,
        encryptedData.iv,
        encryptedData.salt,
        decryptPassword
      );
      setDecryptedText(result);
      setDecryptSuccess(true);
    } catch {
      setDecryptError(true);
    } finally {
      setDecrypting(false);
    }
  };

  const handleReset = () => {
    setPlaintext("");
    setEncryptPassword("");
    setEncryptedData(null);
    setDecryptPassword("");
    setDecryptedText("");
    setDecryptError(false);
    setDecryptSuccess(false);
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
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Shield sx={{ color: "primary.main", fontSize: 32 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary" }}>
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
          background: "linear-gradient(180deg, rgba(79, 70, 229, 0.05) 0%, rgba(255,255,255,0) 100%)",
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
                  "0%, 100%": { boxShadow: "0 8px 32px rgba(79, 70, 229, 0.4)" },
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
              A cryptographically enforced zero-knowledge system where even we can't read your data. 
              Everything is encrypted in your browser before it ever leaves.
            </Typography>

            <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
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
                  document.getElementById("playground")?.scrollIntoView({ behavior: "smooth" });
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
          <TrustBadge icon={<Security fontSize="small" />} label="AES-256-GCM Encryption" />
          <TrustBadge icon={<Key fontSize="small" />} label="PBKDF2 Key Derivation" />
          <TrustBadge icon={<CloudOff fontSize="small" />} label="Client-Side Only" />
          <TrustBadge icon={<VerifiedUser fontSize="small" />} label="Zero Server Access" />
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
            Three simple steps. Complete privacy. No trust required.
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 30%" }, maxWidth: { md: 350 } }}>
              <StepCard
                number={1}
                icon={<Description sx={{ fontSize: 36 }} />}
                title="You Create"
                description="Write notes or upload files directly in your browser. Your data stays on your device until you're ready."
              />
            </Box>
            <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 30%" }, maxWidth: { md: 350 } }}>
              <StepCard
                number={2}
                icon={<Lock sx={{ fontSize: 36 }} />}
                title="Your Browser Encrypts"
                description="Using your password, strong encryption happens locally. The server never sees your plaintext data or passwords."
              />
            </Box>
            <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 30%" }, maxWidth: { md: 350 } }}>
              <StepCard
                number={3}
                icon={<LockOpen sx={{ fontSize: 36 }} />}
                title="Only YOU Decrypt"
                description="When you need your data, only your password can unlock it. Not us, not hackers, not anyone else."
              />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Encryption Playground */}
      <Box id="playground" sx={{ py: 8 }}>
        <Container maxWidth="md">
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
              🔐 Encryption Playground
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: "auto" }}>
              Experience real encryption. Write a message, encrypt it with a password, 
              and see exactly what the server would store. Then decrypt it back!
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              border: "2px solid",
              borderColor: "primary.light",
              borderRadius: 3,
              bgcolor: "background.paper",
            }}
          >
            {/* Encrypt Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <Lock fontSize="small" color="primary" /> Step 1: Encrypt Your Message
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Write your secret message here... Try: 'Hello, this is my secret!'"
                value={plaintext}
                onChange={(e) => setPlaintext(e.target.value)}
                variant="outlined"
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-end" }}>
                <TextField
                  label="Encryption Password"
                  type={showEncryptPassword ? "text" : "password"}
                  value={encryptPassword}
                  onChange={(e) => setEncryptPassword(e.target.value)}
                  placeholder="Enter a password"
                  sx={{ flexGrow: 1, minWidth: 200 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowEncryptPassword(!showEncryptPassword)}
                          edge="end"
                          size="small"
                        >
                          {showEncryptPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleEncrypt}
                  disabled={!plaintext.trim() || !encryptPassword || encrypting}
                  startIcon={<Lock />}
                  sx={{ px: 3, py: 1.5 }}
                >
                  {encrypting ? "Encrypting..." : "Encrypt"}
                </Button>
              </Box>
            </Box>

            {/* Encrypted Output */}
            {encryptedData && (
              <>
                <Divider sx={{ my: 4 }} />

                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    📦 Encrypted Output — What the Server Sees:
                  </Typography>

                  <Alert severity="info" sx={{ mb: 2 }}>
                    This is what gets stored. Without your password, it's completely unreadable gibberish!
                  </Alert>

                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: "#1e293b",
                      borderRadius: 2,
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                      color: "#94a3b8",
                      overflow: "auto",
                      mb: 2,
                    }}
                  >
                    <Box sx={{ color: "#4ade80", mb: 1 }}>// Ciphertext (encrypted data)</Box>
                    <Box sx={{ wordBreak: "break-all", color: "#f1f5f9", mb: 2 }}>
                      {encryptedData.ciphertext}
                    </Box>
                    <Box sx={{ color: "#4ade80", mb: 1 }}>// Initialization Vector (IV)</Box>
                    <Box sx={{ color: "#f1f5f9", mb: 2 }}>{encryptedData.iv}</Box>
                    <Box sx={{ color: "#4ade80", mb: 1 }}>// Salt (for key derivation)</Box>
                    <Box sx={{ color: "#f1f5f9", mb: 2 }}>{encryptedData.salt}</Box>
                    <Box sx={{ color: "#4ade80", mb: 1 }}>// Derived Key (256-bit, shown partially)</Box>
                    <Box sx={{ color: "#facc15" }}>{encryptedData.keyHex}</Box>
                  </Paper>

                  <Typography variant="body2" color="text.secondary">
                    💡 <strong>Notice:</strong> The key is derived from your password using PBKDF2 with 100,000 iterations. 
                    Same password + same salt = same key. Different password = completely different output!
                  </Typography>
                </Box>

                <Divider sx={{ my: 4 }} />

                {/* Decrypt Section */}
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <LockOpen fontSize="small" color="primary" /> Step 2: Decrypt It Back
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Try decrypting with the same password — or try a wrong one to see what happens!
                  </Typography>

                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-end", mb: 3 }}>
                    <TextField
                      label="Decryption Password"
                      type={showDecryptPassword ? "text" : "password"}
                      value={decryptPassword}
                      onChange={(e) => {
                        setDecryptPassword(e.target.value);
                        setDecryptError(false);
                        setDecryptSuccess(false);
                      }}
                      placeholder="Re-enter your password"
                      sx={{ flexGrow: 1, minWidth: 200 }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowDecryptPassword(!showDecryptPassword)}
                              edge="end"
                              size="small"
                            >
                              {showDecryptPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleDecrypt}
                      disabled={!decryptPassword || decrypting}
                      startIcon={<LockOpen />}
                      sx={{ px: 3, py: 1.5 }}
                    >
                      {decrypting ? "Decrypting..." : "Decrypt"}
                    </Button>
                  </Box>

                  {decryptSuccess && (
                    <Alert
                      severity="success"
                      icon={<CheckCircle />}
                      sx={{ mb: 2 }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        ✅ Decryption Successful!
                      </Typography>
                      <Paper
                        sx={{
                          mt: 1,
                          p: 2,
                          bgcolor: "rgba(5, 150, 105, 0.1)",
                          border: "1px solid",
                          borderColor: "success.light",
                          borderRadius: 1,
                        }}
                      >
                        <Typography sx={{ fontFamily: "inherit" }}>
                          {decryptedText}
                        </Typography>
                      </Paper>
                    </Alert>
                  )}

                  {decryptError && (
                    <Alert
                      severity="error"
                      icon={<ErrorIcon />}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        ❌ Decryption Failed!
                      </Typography>
                      <Typography variant="body2">
                        Wrong password. The data cannot be decrypted. This is exactly what would happen 
                        if someone tried to access your data without knowing your password.
                        <br />
                        <strong>That's real security.</strong>
                      </Typography>
                    </Alert>
                  )}
                </Box>

                <Box sx={{ mt: 4, textAlign: "center" }}>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={handleReset}
                  >
                    Reset & Try Again
                  </Button>
                </Box>
              </>
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
            <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 45%", md: "1 1 22%" }, minWidth: 250 }}>
              <FeatureCard
                icon={<Description sx={{ fontSize: 32 }} />}
                title="Encrypted Notes"
                description="Create text notes that are encrypted before leaving your browser. Only you can read them."
              />
            </Box>
            <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 45%", md: "1 1 22%" }, minWidth: 250 }}>
              <FeatureCard
                icon={<CloudUpload sx={{ fontSize: 32 }} />}
                title="Secure File Storage"
                description="Upload files encrypted to your own Google Drive. We never see your file contents."
              />
            </Box>
            <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 45%", md: "1 1 22%" }, minWidth: 250 }}>
              <FeatureCard
                icon={<Share sx={{ fontSize: 32 }} />}
                title="Share Securely"
                description="Share notes and files with others through cryptographic key exchange."
              />
            </Box>
            <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 45%", md: "1 1 22%" }, minWidth: 250 }}>
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
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              Ready to Secure Your Data?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Join ZeroVault and take control of your privacy.
            </Typography>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
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
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Shield sx={{ fontSize: 24 }} />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                ZeroVault
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Built to understand cryptography. Designed to be correct.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
