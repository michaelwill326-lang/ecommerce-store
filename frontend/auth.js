const API = "https://techmart-backend-ecbi.onrender.com";

console.log("AUTH SCRIPT LOADED");

/* ===========================
   LOGIN FUNCTION
=========================== */
async function submitForm() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  console.log("SENDING:", { email, password });

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
      localStorage.setItem("adminToken", data.token);
      alert("✅ Login success");
    } else {
      alert("❌ " + data.message);
    }

  } catch (err) {
    console.error("ERROR:", err);
  }
}

/* ===========================
   BUTTON CONNECTOR (VERY IMPORTANT)
=========================== */
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM READY");

  const btn = document.getElementById("loginBtn");

  if (!btn) {
    console.error("❌ Button not found");
    return;
  }

  btn.addEventListener("click", submitForm);
});