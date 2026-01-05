import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages

import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import TestingPage from "./pages/TestingPage";
import CreateNote from "./pages/CreateNote";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import ShareNotePage from "./pages/ShareNotePage";
import Navbar from "./components/NavBar";
import ReceiverInbox from "./pages/InboxPage";
import { useEffect, useState } from "react";
import UnlockVaultModal from "./components/UnlockVaultModal";
import { useAuth } from "./contexts/AuthContext";

function MainApp() {
  const { user, setUser, privateKey } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/api/v1/auth/me", {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setUser(data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading…</p>;

  return (
    <Router>
      {/* Not authenticated */}
      {!user && <LoginPage />}

      {/* Authenticated but vault locked */}
      {user && !privateKey && <UnlockVaultModal />}

      {/* Fully authenticated */}
      {user && privateKey && (
        <>
          <Navbar />
          <Routes>
            <Route path="/" element={<TestingPage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />

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
          </Routes>
        </>
      )}
    </Router>
    //   </AuthProvider>
    // </ThemeProvider>
  );
}

export default MainApp;
