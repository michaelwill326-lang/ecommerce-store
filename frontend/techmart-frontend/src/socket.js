import { io } from "socket.io-client";

const API =
  import.meta.env.VITE_API_URL ||
  "https://techmart-backend-ecbi.onrender.com";

export const socket = io(API, {
  transports: ["websocket"],
  reconnection: true,
});

function joinUserRoom() {
  try {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user?.email) socket.emit("join", user.email);
  } catch {}
}

socket.on("connect", () => {
  console.log("⚡ Connected via Socket.IO:", socket.id);
  joinUserRoom();
});
socket.on("disconnect", () => console.log("⚡ Disconnected from backend"));
socket.on("connect_error", (err) => console.error("⚡ Socket connection error:", err.message));

// Re-join room whenever the user logs in/out on this tab
window.addEventListener("storage", (e) => {
  if (e.key === "token" && e.newValue) joinUserRoom();
});
