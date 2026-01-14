import { useState } from "react";
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Link,
  InputAdornment,
  IconButton,
  Divider,
} from "@mui/material";
import { Visibility, VisibilityOff, Email, Lock, Shield } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../contexts/AuthContext";
import { Link as RouterLink } from "react-router-dom";
import { LoadingButton } from "../components/common/LoadingButton";
import toast from "react-hot-toast";
import { generateKeyPair } from "../crypto/identity";
import { encryptPrivateKey } from "../crypto/password";

const schema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().required("Password is required"),
});

type LoginFormData = yup.InferType<typeof schema>;

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const { login, loading, register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      toast.success("Welcome back!");
    } catch {
      toast.error("Invalid email or password");
    }
  };

  const onTryDemo = async () => {
    setDemoLoading(true);
    try {
      // 1. Generate random credentials
      const randomId = Math.random().toString(36).substring(7);
      const email = `demo_${randomId}@zerovault.app`;
      const password = `Demo@${randomId}`; // Meets complexity requirements

      // 2. Client-side Key Gen (Zero Knowledge)
      const keys = await generateKeyPair();
      const encryptedPrivateKey = await encryptPrivateKey(
        keys.privateKeyJwk,
        password
      );

      // 3. Register
      await registerUser(
        email,
        password,
        keys.publicKeyJwk,
        encryptedPrivateKey
      );

      // 4. Auto-login (registerUser usually logs in or we call login)
      // The current register implementation in AuthContext doesn't auto-login, 
      // but it might be better to just call login immediately.
      
      await login(email, password);
      
      toast.success("Demo account created! Use the vault freely.");
      
      // Cleanup: Show credentials to user (optional, maybe in a toast?)
      toast((t) => (
        <span>
          <b>Demo Credentials:</b><br/>
          Email: {email}<br/>
          Pass: {password}
        </span>
      ), { duration: 6000 });

    } catch (err) {
      toast.error("Failed to create demo account");
      console.error(err);
    } finally {
      setDemoLoading(false);
    }
  };

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
              Welcome Back
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to your ZeroVault account
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
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
              Sign In
            </LoadingButton>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              or
            </Typography>
          </Divider>

          <LoadingButton
            onClick={onTryDemo}
            fullWidth
            variant="outlined"
            loading={demoLoading}
            sx={{
              py: 1.5,
              fontSize: "1rem",
            }}
          >
            Try Demo Account
          </LoadingButton>

          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{" "}
              <Link 
                component={RouterLink} 
                to="/auth/register" 
                sx={{ 
                  color: "primary.main",
                  fontWeight: 500,
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Sign up here
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
