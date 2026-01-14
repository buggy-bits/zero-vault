import { useState } from "react";
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Link,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Shield,
} from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { LoadingButton } from "../components/common/LoadingButton";
import { generateKeyPair } from "../crypto/identity";
import { encryptPrivateKey } from "../crypto/password";

const schema = yup.object({
  userName: yup
    .string()
    .min(3, "Username must be at least 3 characters")
    .required("Username is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and number"
    )
    .required("Password is required"),
});

type RegisterFormData = yup.InferType<typeof schema>;

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register: registerUser, loading, error } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema),
  });

  const password = watch("password");

  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: "", color: "text.secondary" };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;

    const levels = [
      { label: "", color: "text.secondary" },
      { label: "Very Weak", color: "#dc2626" },
      { label: "Weak", color: "#d97706" },
      { label: "Fair", color: "#0284c7" },
      { label: "Good", color: "#059669" },
      { label: "Strong", color: "#059669" },
    ];

    return { score, ...levels[score] };
  };

  const passwordStrength = getPasswordStrength(password);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const keys = await generateKeyPair();
      const encryptedPrivateKey = await encryptPrivateKey(
        keys.privateKeyJwk,
        password
      );
      await registerUser(
        data.email,
        data.password,
        keys.publicKeyJwk,
        encryptedPrivateKey
      );
      setSuccess(true);
      setTimeout(() => navigate("/auth/login"), 2000);
    } catch {
      // Error is handled by context
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 5 },
              borderRadius: 3,
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                bgcolor: "success.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
              }}
            >
              <Shield sx={{ fontSize: 36, color: "white" }} />
            </Box>
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
              Registration Successful!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your account has been created. Redirecting to login...
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 3,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
                boxShadow: "0 4px 14px 0 rgba(79, 70, 229, 0.3)",
              }}
            >
              <Shield sx={{ fontSize: 32, color: "white" }} />
            </Box>
            
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "text.primary",
                mb: 1,
              }}
            >
              Create Account
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Join ZeroVault — Your end-to-end encrypted vault
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              label="Username"
              margin="normal"
              {...register("userName")}
              error={!!errors.userName}
              helperText={errors.userName?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              margin="normal"
              {...register("email")}
              error={!!errors.email}
              helperText={errors.email?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              margin="normal"
              {...register("password")}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {password && (
              <Box sx={{ mt: 1, mb: 1 }}>
                <Typography
                  variant="caption"
                  sx={{ color: passwordStrength.color, fontWeight: 500 }}
                >
                  Password Strength: {passwordStrength.label}
                </Typography>
                <Box
                  sx={{
                    height: 4,
                    backgroundColor: "divider",
                    borderRadius: 2,
                    mt: 0.5,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      height: "100%",
                      width: `${(passwordStrength.score / 5) * 100}%`,
                      backgroundColor: passwordStrength.color,
                      borderRadius: 2,
                      transition: "all 0.3s ease",
                    }}
                  />
                </Box>
              </Box>
            )}

            <LoadingButton
              type="submit"
              fullWidth
              variant="contained"
              loading={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                fontSize: "1rem",
              }}
            >
              Create Account
            </LoadingButton>
          </Box>

          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{" "}
              <Link 
                component={RouterLink} 
                to="/auth/login" 
                sx={{ 
                  color: "primary.main",
                  fontWeight: 500,
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Sign in here
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
