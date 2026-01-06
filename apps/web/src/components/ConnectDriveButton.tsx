function ConnectDriveButton() {
  function connect() {
    window.location.href = "http://localhost:3000/api/v1/oauth/google/start";
  }

  return <button onClick={connect}>Connect Google Drive</button>;
}
export default ConnectDriveButton;
