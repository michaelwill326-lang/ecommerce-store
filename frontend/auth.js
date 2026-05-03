const API = "https://techmart-backend-ecbi.onrender.com";

console.log("AUTH SCRIPT LOADED");

/* ===========================
   ADMIN LOGIN
=========================== */
async function submitForm() {
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  console.log("SENDING:", { email, password });

  if (!email || !password) {
    alert("❌ Email and password required");
    return;
  }

  try {
    const res = await fetch(API + "/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    console.log("RESPONSE:", data);

    if (data.success) {
      // ✅ Save token
      localStorage.setItem("adminToken", data.token);

      // ✅ Redirect to admin dashboard
      window.location.href = "admin.html";
    } else {
      alert("❌ " + (data.message || "Login failed"));
    }

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    alert("❌ Network error");
  }
}