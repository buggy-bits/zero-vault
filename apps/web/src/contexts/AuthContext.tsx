import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { AuthState, User } from "../types";
import { authService } from "../services/authService";
import { EncryptedPrivateKey } from "../types/crypto";
import { decryptPrivateKey } from "../crypto/password";

type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_USER"; payload: User }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "LOGOUT" }
  | { type: "SET_PRIVATE_KEY"; payload: CryptoKey | null }
  | { type: "SET_PUBLIC_KEY"; payload: JsonWebKey | null };

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  setPrivateKey: (key: CryptoKey | null) => void;
  setUser: (user: User) => void;
  register: (
    email: string,
    password: string,
    publicKey: JsonWebKey,
    encryptedPrivateKey: EncryptedPrivateKey
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  privateKey: null,
  publicKey: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
    case "SET_PRIVATE_KEY":
      return { ...state, privateKey: action.payload };

    case "SET_PUBLIC_KEY":
      return { ...state, publicKey: action.payload };

    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initializeAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const user = await authService.getCurrentUser();
          dispatch({ type: "SET_USER", payload: user });
        } catch (error) {
          authService.logout();
          dispatch({ type: "LOGOUT" });
        }
      } else {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    initializeAuth();
  }, []);

  const handleDecryptionPrivateKey = async (
    encryptedPrivateKey: EncryptedPrivateKey,
    userPass: string
  ) => {
    const pk = await decryptPrivateKey(encryptedPrivateKey, userPass);
    return pk;
  };
  const setPrivateKey = (key: CryptoKey | null) => {
    dispatch({ type: "SET_PRIVATE_KEY", payload: key });
  };
  const setUser = (user: User) => {
    dispatch({ type: "SET_USER", payload: user });
  };

  const login = async (email: string, password: string) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const responseData = await authService.login({ email, password });
      const decryptedKey = await handleDecryptionPrivateKey(
        responseData.encryptedPrivateKey,
        password
      );
      dispatch({ type: "SET_PUBLIC_KEY", payload: responseData.publicKey });
      dispatch({
        type: "SET_PRIVATE_KEY",
        payload: decryptedKey,
      });
      dispatch({ type: "SET_USER", payload: responseData.user });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error.response?.data?.message || "Login failed",
      });
      throw error;
    }
  };

  const guestLogin = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const user = await authService.guestLogin();
      dispatch({ type: "SET_USER", payload: user });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error.response?.data?.message || "Login failed",
      });
      throw error;
    }
  };
  const register = async (
    // userName: string,
    email: string,
    password: string,
    publicKey: JsonWebKey,
    encryptedPrivateKey: EncryptedPrivateKey
  ) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      await authService.register({
        // userName,
        email,
        password,
        publicKey,
        encryptedPrivateKey,
      });
      dispatch({ type: "SET_LOADING", payload: false });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error.response?.data?.message || "Registration failed",
      });
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    dispatch({ type: "LOGOUT" });
  };

  const value: AuthContextType = {
    ...state,
    login,
    setPrivateKey,
    setUser,
    guestLogin,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
