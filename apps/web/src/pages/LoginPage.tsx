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
import { Visibility, VisibilityOff, Email, Lock } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { LoadingButton } from "../components/common/LoadingButton";

const schema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().required("Password is required"),
});

type LoginFormData = yup.InferType<typeof schema>;
export function LoginPage() {
  // const { isAuthenticated, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const {
    login,
    loading,
    error,
    guestLogin,
    isAuthenticated,
    user,
  } = useAuth();
  const navigate = useNavigate();

  const to = "/create";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  });

  const navigateIfAuthenticated = () => {
    if (isAuthenticated) {
      navigate(to, { replace: true });
    } else {
      console.log("Not authenticated yet");
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password).then(() => {
        // Here decrypt the private key after login
        console.log("User after login, Login page work done:", user);
        setTimeout(navigateIfAuthenticated, 2000);
      });
    } catch (error) {
      // Error is handled by context
    }
  };

  const onGuestLogin = async () => {
    try {
      await guestLogin().then(() => {
        setTimeout(navigateIfAuthenticated, 2000);
      });
    } catch (error) {
      // Error is handled by context
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: 4,
            borderRadius: 3,
            background: "rgba(26, 26, 46, 0.8)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: "linear-gradient(45deg, #6366f1 30%, #10b981 90%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 1,
              }}
            >
              Welcome Back
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to your EchoSphere account
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
              label="Email"
              type="email"
              margin="normal"
              {...register("email")}
              error={!!errors.email}
              helperText={errors.email?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
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
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
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
                borderRadius: 2,
              }}
            >
              Sign In
            </LoadingButton>
          </Box>

          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{" "}
              <Link component={RouterLink} to="/auth/register" color="primary">
                Sign up here
              </Link>
            </Typography>
            <LoadingButton
              onClick={onGuestLogin}
              fullWidth
              variant="outlined"
              loading={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                fontSize: "1rem",
                borderRadius: 2,
              }}
            >
              Login as Guest
            </LoadingButton>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <Link component={RouterLink} to="/" color="primary">
                Back to Home
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
