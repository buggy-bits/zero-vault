import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import TestingPage from "./pages/TestingPage";
import CreateNote from "./pages/CreateNote";
import ShareNotePage from "./pages/ShareNotePage";
import ReceiverInbox from "./pages/InboxPage";
import UploadFile from "./pages/UploadFile";
import HomePage from "./pages/HomePage";

import UnlockVaultModal from "./components/UnlockVaultModal";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import EncryptedFilesList from "./pages/EncryptedFileList";
import MyFiles from "./pages/Myfiles";
import ShareDownload from "./pages/ShareDownload";
import SharedNote from "./pages/SharedNote";
import Navbar from "./components/NavBar";
import SettingsPage from "./pages/SettingsPage";
import { Box, CircularProgress } from "@mui/material";
import { ROUTES } from "./constants";

function MainApp() {
  const { vaultStatus, loading, isAuthenticated } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Unauthenticated: Show homepage, login, and register routes
  if (vaultStatus === 'unauthenticated') {
    return (
      <>
        <Toaster position="top-right" />
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </>
    );
  }

  // Locked: Show unlock modal overlay
  if (vaultStatus === 'locked') {
    return (
      <>
        <Toaster position="top-right" />
        <UnlockVaultModal />
      </>
    );
  }

  // Unlocked: Full app access
  return (
    <>
      <Toaster position="top-right" />
      <Router>
        {isAuthenticated && <Navbar />}

        <Routes>
          {/* Auth routes redirect to home when authenticated */}
          <Route
            path={ROUTES.LOGIN}
            element={<Navigate to="/" replace />}
          />
          <Route
            path={ROUTES.REGISTER}
            element={<Navigate to="/" replace />}
          />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <CreateNote />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.CREATE}
            element={
              <ProtectedRoute>
                <CreateNote />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.SHARE}
            element={
              <ProtectedRoute>
                <ShareNotePage />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.INBOX}
            element={
              <ProtectedRoute>
                <ReceiverInbox />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.UPLOAD}
            element={
              <ProtectedRoute>
                <UploadFile />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.FILES} // Was using custom paths before, strict to constants now if possible
            element={
              <ProtectedRoute>
                <MyFiles />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/myfiles" // Keeping backward compat or just updating to match constant which is /files
            element={
              <ProtectedRoute>
                <EncryptedFilesList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/share/:shareId"
            element={
              <ProtectedRoute>
                <ShareDownload />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notes/:shareId"
            element={
              <ProtectedRoute>
                <SharedNote />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.SETTINGS}
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/testing"
            element={
              <ProtectedRoute>
                <TestingPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default MainApp;
