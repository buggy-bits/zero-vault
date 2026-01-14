import { API_ENDPOINTS } from "../constants";

function ConnectDriveButton() {
  function connect() {
    // Using relative path - API service will handle the base URL
    window.location.href = `${window.location.origin.replace(':5173', ':3000')}${API_ENDPOINTS.OAUTH.GOOGLE_START}`;
  }

  return (
    <button 
      onClick={connect}
      style={{
        padding: "10px 20px",
        background: "#4285f4",
        border: "none",
        borderRadius: 4,
        color: "white",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      📁 Connect Google Drive
    </button>
  );
}

export default ConnectDriveButton;
