
import "./config/env";

import http from "http";
import app from "./app";
import connectDB from "./config/database";
import { initializeSocket } from "./sockets";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const httpServer = http.createServer(app);

    initializeSocket(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`CivicPulse running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
};

startServer();
