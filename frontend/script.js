const BACKEND_URL = "https://techmart-backend-ecbi.onrender.com";

const productsContainer = document.getElementById("products");
const spinner = document.getElementById("loading-spinner");
const cartCount = document.getElementById("cart-count");

/* ===========================
   CART STORAGE
=========================== */

function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;
}

/* ===========================
   ADD TO CART
=========================== */

function addToCart(productId) {

  const cart = getCart();

  const product = window.products.find(p => p._id === productId);

  const existingItem = cart.find(item => item._id === productId);

  if (existingItem) {

    existingItem.quantity += 1;

  } else {

    cart.push({
      _id: product._id,
      name: product.name,
      price: product.price,
      quantity: 1
    });

  }

  saveCart(cart);

  alert(product.name + " added to cart");

}

/* ===========================
   LOAD PRODUCTS
=========================== */

async function loadProducts() {

  try {

    spinner.style.display = "block";
    productsContainer.innerHTML = "";

    const response = await fetch(`${BACKEND_URL}/api/products`);

    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }

    const products = await response.json();

    window.products = products;

    spinner.style.display = "none";

    products.forEach(product => {

      const div = document.createElement("div");
      div.classList.add("product");

      div.innerHTML = `
        <h3>${product.name}</h3>
        <p>${product.description || ""}</p>
        <p><strong>₦${product.price}</strong></p>
        <button onclick="addToCart('${product._id}')">
          Add to Cart
        </button>
      `;

      productsContainer.appendChild(div);

    });

  } catch (error) {

    spinner.style.display = "none";
    productsContainer.innerHTML = "<p>Failed to load products.</p>";
    console.error(error);

  }

}

updateCartBadge();
loadProducts();