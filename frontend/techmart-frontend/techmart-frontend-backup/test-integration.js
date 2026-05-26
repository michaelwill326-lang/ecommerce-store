// test-integration.js
import axios from "axios";
import { io } from "socket.io-client";

const BASE_URL = "https://techmart-backend-ecbi.onrender.com"; // Your live backend

async function testAPI() {
  try {
    console.log("🚀 Testing Backend API...");

    // Test root endpoint
    const root = await axios.get(`${BASE_URL}/`);
    console.log("Root:", root.data);

    // Test products
    const products = await axios.get(`${BASE_URL}/api/products`);
    console.log(`✅ Products loaded: ${products.data.length}`);

    // Test signup (dummy user)
    const signupRes = await axios.post(`${BASE_URL}/api/auth/signup`, {
      name: "Test User",
      email: "testuser@example.com",
      password: "Test1234",
    }).catch(e => e.response);
    console.log("Signup:", signupRes.data);

    // Test login
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: "testuser@example.com",
      password: "Test1234",
    }).catch(e => e.response);
    console.log("Login:", loginRes.data);

    const token = loginRes.data.token || "";

    // Test fetching orders (requires auth)
    const orders = await axios.get(`${BASE_URL}/api/orders/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(e => e.response);
    console.log("Orders:", orders.data);

    // Test admin stats (should fail with non-admin)
    const adminStats = await axios.get(`${BASE_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(e => e.response);
    console.log("Admin Stats (non-admin):", adminStats.data);

    console.log("✅ API testing completed.\n");
  } catch (err) {
    console.error("❌ API test failed:", err.message);
  }
}

function testSocket() {
  console.log("🔌 Testing Socket.IO...");

  const socket = io(BASE_URL, {
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    console.log("⚡ Socket connected:", socket.id);
    socket.emit("register", "testuser@example.com");
  });

  socket.on("disconnect", () => {
    console.log("⚡ Socket disconnected");
  });

  socket.on("orderUpdated", (order) => {
    console.log("⚡ Live order update received:", order);
  });

  // Auto disconnect after 10 seconds
  setTimeout(() => {
    socket.disconnect();
    console.log("⚡ Socket test finished");
  }, 10000);
}

async function runTests() {
  await testAPI();
  testSocket();
}

runTests();