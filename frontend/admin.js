document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("orders-table");

  // ✅ Load all orders from server
  async function loadOrders() {
    try {
      const res = await fetch("http://localhost:5002/api/orders");
      const orders = await res.json();

      tableBody.innerHTML = "";

      orders.forEach(order => {
        const tr = document.createElement("tr");

        const idTd = document.createElement("td");
        idTd.textContent = order.id;

        const trackingTd = document.createElement("td");
        trackingTd.textContent = order.tracking_number;

        const statusTd = document.createElement("td");
        statusTd.textContent = order.status;
        statusTd.style.fontWeight = "bold";

        const actionsTd = document.createElement("td");

        // Create buttons for each possible status
        const statuses = ["processing", "shipped", "out-for-delivery", "delivered"];
        statuses.forEach(status => {
          const btn = document.createElement("button");
          btn.textContent = status.charAt(0).toUpperCase() + status.slice(1);
          btn.classList.add(status);
          btn.addEventListener("click", () => updateStatus(order.id, status));
          actionsTd.appendChild(btn);
        });

        tr.appendChild(idTd);
        tr.appendChild(trackingTd);
        tr.appendChild(statusTd);
        tr.appendChild(actionsTd);

        tableBody.appendChild(tr);
      });
    } catch (err) {
      console.error("❌ Failed to load orders:", err);
    }
  }

  // ✅ Update order status
  async function updateStatus(orderId, status) {
    try {
      const res = await fetch("http://localhost:5002/api/orders/update-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status })
      });

      const data = await res.json();
      if (data.success) {
        alert(`Order ${orderId} updated to "${status}"`);
        loadOrders(); // Refresh table
      } else {
        alert("Failed to update order.");
      }
    } catch (err) {
      console.error("❌ Update status failed:", err);
      alert("Error updating order status.");
    }
  }

  loadOrders();
});




