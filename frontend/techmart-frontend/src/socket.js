import { io } from "socket.io-client";

// Use environment variable for backend URL
export const socket = io(import.meta.env.VITE_API_URL, {
  transports: ["websocket"],
  reconnection: true,
});

socket.on("connect", () => {
  console.log("⚡ Connected via Socket.IO:", socket.id);
});

socket.on("disconnect", () => {
  console.log("⚡ Disconnected from backend");
});

socket.on("connect_error", (err) => {
  console.error("⚡ Socket connection error:", err.message);
});