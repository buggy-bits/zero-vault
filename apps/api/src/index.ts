import { PORT } from "./config/env";
import app from "./app";
import { connectToDatabase, disconnectDB } from "./database/mongodb";

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  // connectToDatabase();
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Closing gracefully...`);
  await disconnectDB();

  server.close(() => {
    console.log("Express server stopped.");
    process.exit(0);
  });
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
