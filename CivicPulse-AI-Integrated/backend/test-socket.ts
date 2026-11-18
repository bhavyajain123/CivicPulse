
import { io } from "socket.io-client";

const token = process.env.TEST_ADMIN_TOKEN;

if (!token) {
  throw new Error("TEST_ADMIN_TOKEN is missing");
}

const socket = io("http://localhost:5000", {
  auth: { token },
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("Socket connected successfully:", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("Socket connection failed:", error.message);
});

socket.on("new-notification", (notification) => {
  console.log("REAL-TIME NOTIFICATION RECEIVED:");
  console.log(notification);
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
});
