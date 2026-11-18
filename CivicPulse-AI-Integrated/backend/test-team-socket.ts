
import { io } from "socket.io-client";

const token = process.env.TEST_TEAM_TOKEN;
const incidentId = process.env.TEST_INCIDENT_ID;

if (!token) {
  throw new Error("TEST_TEAM_TOKEN is missing");
}

if (!incidentId) {
  throw new Error("TEST_INCIDENT_ID is missing");
}

const socket = io("http://localhost:5000", {
  auth: { token },
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("Response team socket connected:", socket.id);

  socket.emit("join-incident", incidentId);
});

socket.on("incident-joined", (data) => {
  console.log("Joined incident room:", data);

  socket.emit("update-team-location", {
    incidentId,
    latitude: 28.6139,
    longitude: 77.2090,
  });
});

socket.on("team-location-saved", (data) => {
  console.log("LOCATION SAVED:", data);
});
socket.on("incident-access-revoked", (data) => {
  console.log("INCIDENT ACCESS REVOKED:", data);
});

socket.on("team-location-updated", (data) => {
  console.log("LIVE LOCATION UPDATE:", data);
});

socket.on("socket-error", (error) => {
  console.error("SOCKET ERROR:", error.message);
});

socket.on("connect_error", (error) => {
  console.error("Connection failed:", error.message);
});

socket.on("new-notification", (notification) => {
  console.log("TEAM NOTIFICATION:", notification);
});
