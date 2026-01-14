import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useReducer,
} from "react";
import { authService } from "../services/authService";
import { User, AuthState, VaultStatus } from "../types";
import { decryptPrivateKey } from "../crypto/password";

interface AuthContextType extends AuthState {
  login: (email?: string, password?: string) => Promise<void>;
  register: (
    email?: string,
    password?: string,
    publicKey?: JsonWebKey,
    encryptedPrivateKey?: any
  ) => Promise<void>;
  logout: () => void;
  // Demo login is now handled by registering a random user in LoginPage
  // guestLogin: () => Promise<void>;
  unlockVault: (password: string) => Promise<void>;
  lockVault: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ACTION TYPES
const SET_USER = "SET_USER";
const SET_LOADING = "SET_LOADING";
const SET_ERROR = "SET_ERROR";
const LOGOUT = "LOGOUT";
const SET_VAULT_STATUS = "SET_VAULT_STATUS";
const UNLOCK_VAULT = "UNLOCK_VAULT";
const LOCK_VAULT = "LOCK_VAULT";
const LOGIN_SUCCESS = "LOGIN_SUCCESS"; // New action for atomic login update
const SESSION_RESTORED = "SESSION_RESTORED"; // New action for session restore

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  privateKey: null,
  publicKey: null,
  vaultStatus: "unauthenticated", // Default start state
};

function authReducer(state: AuthState, action: any): AuthState {
  switch (action.type) {
    case SET_LOADING:
      return { ...state, loading: action.payload };
    case SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        privateKey: action.payload.privateKey,
        publicKey: action.payload.publicKey,
        vaultStatus: "unlocked", // Login = immediate unlock
        loading: false,
        error: null,
      };
    case SESSION_RESTORED:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        // privateKey is null (not persisted)
        publicKey: action.payload.publicKey,
        vaultStatus: "locked", // Restored session = locked vault
        loading: false,
        error: null,
      };
    case UNLOCK_VAULT:
      return {
        ...state,
        privateKey: action.payload,
        vaultStatus: "unlocked",
        error: null,
      };
    case LOCK_VAULT:
      return {
        ...state,
        privateKey: null,
        vaultStatus: "locked",
      };
    case LOGOUT:
      return { ...initialState, loading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const initializeAuth = useCallback(async () => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      // Call /me endpoint - this serves as both auth check and user data fetch
      // If user has valid httpOnly cookies, this will succeed
      const user = await authService.getCurrentUser();
      // Restore session but keep vault locked (key not in memory)
      dispatch({
        type: SESSION_RESTORED,
        payload: {
          user,
          publicKey: user.publicKey,
        },
      });
    } catch (error) {
      // No valid session - user needs to login
      dispatch({ type: LOGOUT });
    } finally {
      dispatch({ type: SET_LOADING, payload: false });
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  /**
   * Unlock Vault: Decrypt private key with password
   */
  const unlockVault = useCallback(
    async (password: string) => {
      if (!state.user?.encryptedPrivateKey) {
        dispatch({ type: SET_ERROR, payload: "No encrypted key found" });
        throw new Error("No encrypted key found");
      }

      try {
        const privateKey = await decryptPrivateKey(
          state.user.encryptedPrivateKey,
          password
        );
        dispatch({ type: UNLOCK_VAULT, payload: privateKey });
      } catch (err) {
        console.error("Unlock failed", err);
        throw new Error("Invalid password");
      }
    },
    [state.user]
  );

  /**
   * Lock Vault: Clear private key from memory
   */
  const lockVault = useCallback(() => {
    dispatch({ type: LOCK_VAULT });
  }, []);

  const login = useCallback(async (email?: string, password?: string) => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      if (!email || !password) throw new Error("Credentials required");

      const { user, publicKey, encryptedPrivateKey } = await authService.login({
        email,
        password,
      });

      // Decrypt private key IMMEDIATELY on login (we have the password)
      let privateKey: CryptoKey | null = null;
      try {
        privateKey = await decryptPrivateKey(encryptedPrivateKey, password);
      } catch (e) {
        console.error("Login key decryption failed", e);
        // This shouldn't happen on login with correct password unless data is corrupted
        throw new Error("Failed to decrypt your vault key.");
      }

      dispatch({
        type: LOGIN_SUCCESS,
        payload: {
          user: { encryptedPrivateKey, ...user },
          privateKey,
          publicKey,
        },
      });
    } catch (error) {
      const msg =
        error.response?.data?.message || error.message || "Login failed";
      dispatch({ type: SET_ERROR, payload: msg });
      throw error;
    }
  }, []);

  const register = useCallback(
    async (
      email?: string,
      password?: string,
      publicKey?: JsonWebKey,
      encryptedPrivateKey?: any
    ) => {
      dispatch({ type: SET_LOADING, payload: true });
      try {
        if (!email || !password || !publicKey || !encryptedPrivateKey) {
          throw new Error("All fields required");
        }
        await authService.register({
          email,
          password,
          publicKey,
          encryptedPrivateKey,
        });

        // We don't auto-login here to allow the caller to decide flow,
        // usually redirect to login or auto-login.
        dispatch({ type: SET_LOADING, payload: false });
      } catch (error) {
        const msg = error.response?.data?.message || "Registration failed";
        dispatch({ type: SET_ERROR, payload: msg });
        throw error;
      }
    },
    []
  );

  const logout = useCallback(() => {
    authService.logout();
    dispatch({ type: LOGOUT });
    // Reload to clear any memory states purely
    window.location.href = "/";
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        unlockVault,
        lockVault,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
