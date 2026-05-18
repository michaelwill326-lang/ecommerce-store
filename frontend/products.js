import { getProducts } from "./api.js";

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

window.addToCart = function (id, name, price) {
  cart.push({ id, name, price, quantity: 1 });
  saveCart();
  alert("Added to cart");
};

async function loadProducts() {
  const products = await getProducts();

  const container = document.getElementById("products");

  container.innerHTML = "";

  products.forEach(p => {
    container.innerHTML += `
      <div class="card">
        <h3>${p.name}</h3>
        <p>₦${p.price}</p>

        <button onclick="addToCart('${p._id}', '${p.name}', ${p.price})">
          Add to Cart
        </button>
      </div>
    `;
  });
}

loadProducts();