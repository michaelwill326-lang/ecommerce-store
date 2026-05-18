import { getOrders, updateStatus } from "./api.js";

const token = localStorage.getItem("adminToken");

if (!token) {
  window.location.href = "login.html";
}

async function loadOrders() {
  const orders = await getOrders(token);

  const container = document.getElementById("orders");

  container.innerHTML = "";

  orders.forEach(order => {
    container.innerHTML += `
      <div>
        <p>ID: ${order._id}</p>
        <p>Total: ₦${order.amount}</p>
        <p>Status: ${order.status}</p>

        <button onclick="changeStatus('${order._id}')">
          Update
        </button>
      </div>
    `;
  });
}

window.changeStatus = async function (id) {
  const status = prompt("Enter status:");
  await updateStatus(id, status, token);
  loadOrders();
};

loadOrders();