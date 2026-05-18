let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function renderCart() {
  const container = document.getElementById("cart");
  let total = 0;

  container.innerHTML = "";

  cart.forEach((item, i) => {
    total += item.price * item.quantity;

    container.innerHTML += `
      <div>
        <p>${item.name}</p>
        <p>₦${item.price}</p>

        <button onclick="increase(${i})">+</button>
        <button onclick="decrease(${i})">-</button>
        <button onclick="removeItem(${i})">Remove</button>
      </div>
    `;
  });

  document.getElementById("total").innerText = total;
}

window.increase = (i) => {
  cart[i].quantity++;
  saveCart();
  renderCart();
};

window.decrease = (i) => {
  cart[i].quantity--;
  if (cart[i].quantity <= 0) cart.splice(i, 1);
  saveCart();
  renderCart();
};

window.removeItem = (i) => {
  cart.splice(i, 1);
  saveCart();
  renderCart();
};

renderCart();