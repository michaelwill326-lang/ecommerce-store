const BACKEND_URL = "https://techmart-backend-ecbi.onrender.com";

const productsContainer = document.getElementById("products");
const spinner = document.getElementById("loading-spinner");

/* ===========================
   Load Products From Backend
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

    spinner.style.display = "none";

    products.forEach(product => {
      const div = document.createElement("div");
      div.classList.add("product");

      div.innerHTML = `
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <p><strong>$${product.price}</strong></p>
        <button class="add-to-cart" onclick="addToCart(${product.id})">
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

/* ===========================
   Cart Logic
=========================== */
function addToCart(productId) {
  alert("Product added to cart!");
}

loadProducts();