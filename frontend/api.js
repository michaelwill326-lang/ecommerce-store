const API = "https://techmart-backend-ecbi.onrender.com";

/* PRODUCTS */
export async function getProducts() {
  const res = await fetch(`${API}/api/products`);
  return res.json();
}

/* ADMIN ORDERS */
export async function getOrders(token) {
  const res = await fetch(`${API}/api/admin/orders`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.json();
}

/* UPDATE ORDER STATUS */
export async function updateStatus(id, status, token) {
  const res = await fetch(`${API}/api/admin/orders/${id}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });

  return res.json();
}

/* LOGIN */
export async function adminLogin(email, password) {
  const res = await fetch(`${API}/api/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  return res.json();
}