import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";

import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import TestingPage from "./pages/TestingPage";
import CreateNote from "./pages/CreateNote";
import ShareNotePage from "./pages/ShareNotePage";
import ReceiverInbox from "./pages/InboxPage";
import UploadFile from "./pages/UploadFile";

import Navbar from "./components/NavBar";
import UnlockVaultModal from "./components/UnlockVaultModal";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import EncryptedFilesList from "./pages/EncryptedFileList";

function MainApp() {
  const { user, setUser, privateKey } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/api/v1/auth/me", {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setUser(data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading…</p>;

  return (
    <Router>
      {/* 🔐 Vault lock overlay (NOT a route) */}
      {user && !privateKey && <UnlockVaultModal />}

      {/* ✅ Navbar only for authenticated users */}
      {user && <Navbar />}

      <Routes>
        {/* 🌍 PUBLIC ROUTES */}
        <Route
          path="/auth/login"
          element={!user ? <LoginPage /> : <Navigate to="/" />}
        />

        <Route
          path="/auth/register"
          element={!user ? <RegisterPage /> : <Navigate to="/" />}
        />

        {/* 🔒 PROTECTED ROUTES */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <TestingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreateNote />
            </ProtectedRoute>
          }
        />

        <Route
          path="/share"
          element={
            <ProtectedRoute>
              <ShareNotePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inbox"
          element={
            <ProtectedRoute>
              <ReceiverInbox />
            </ProtectedRoute>
          }
        />

        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadFile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/myfiles"
          element={
            <ProtectedRoute>
              <EncryptedFilesList />
            </ProtectedRoute>
          }
        />

        {/* 🚨 CATCH-ALL */}
        <Route
          path="*"
          element={<Navigate to={user ? "/" : "/auth/login"} />}
        />
      </Routes>
    </Router>
  );
}

export default MainApp;
