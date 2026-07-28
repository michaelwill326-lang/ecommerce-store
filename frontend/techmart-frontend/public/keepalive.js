// Keep Render backend alive by pinging every 10 minutes
const BACKEND = "https://techmart-backend-ecbi.onrender.com";

self.addEventListener("activate", () => {
  // Ping backend every 10 minutes to prevent cold starts
  setInterval(() => {
    fetch(`${BACKEND}/api/health`).catch(() => {});
  }, 10 * 60 * 1000);
});
