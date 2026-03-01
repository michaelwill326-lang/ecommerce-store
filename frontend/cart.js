document.addEventListener("DOMContentLoaded", () => {
  const cartList = document.getElementById("cart-items");
  const totalElement = document.getElementById("cart-total");
  const clearCartBtn = document.getElementById("clear-cart");
  const checkoutBtn = document.getElementById("checkout-btn");

  // Load cart from localStorage
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  // ✅ Render cart items
  function renderCart() {
    cartList.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
      cartList.innerHTML = `<li>Your cart is empty.</li>`;
      totalElement.textContent = "Total: $0.00";
      return;
    }

    cart.forEach(item => {
      const li = document.createElement("li");
      li.innerHTML = `
        <img src="${item.image}" alt="${item.name}" width="50">
        ${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}
      `;
      cartList.appendChild(li);

      total += item.price * item.quantity;
    });

    totalElement.textContent = `Total: $${total.toFixed(2)}`;
  }

  // ✅ Clear cart
  clearCartBtn.addEventListener("click", () => {
    cart = [];
    localStorage.removeItem("cart");
    renderCart();
  });

  // ✅ Proceed to checkout
  checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    window.location.href = "checkout.html";
  });

  renderCart();
});
