import { adminLogin } from "./api.js";

window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const data = await adminLogin(email, password);

  console.log("LOGIN RESPONSE:", data);

  if (data.success) {
    localStorage.setItem("adminToken", data.token);
    window.location.href = "admin-dashboard.html";
  } else {
    alert("Login failed");
  }
};