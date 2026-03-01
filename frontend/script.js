document.addEventListener("DOMContentLoaded", () => {

  const productList = document.getElementById("product-list");
  const cartCount = document.getElementById("cart-count");

  const API = "https://ecommerce-store-production-2a86.up.railway.app";

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  function updateCartBadge() {
    if (!cartCount) return;
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalQty;
    cartCount.style.display = totalQty > 0 ? "inline-block" : "none";
  }

  updateCartBadge();

  async function loadProducts() {
    try {
      const res = await fetch(`${API}/api/store/products`);

      if (!res.ok) throw new Error("Server returned " + res.status);

      const products = await res.json();

      productList.innerHTML = "";

      products.forEach(product => {
        const div = document.createElement("div");
        div.className = "product";

        div.innerHTML = `
          <img src="${product.image}" alt="${product.name}" style="width:200px">
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <p><strong>$${Number(product.price).toFixed(2)}</strong></p>
          <button>Add to Cart</button>
        `;

        div.querySelector("button").addEventListener("click", () => {
          const existingItem = cart.find(item => item._id === product._id);

          if (existingItem) {
            existingItem.quantity += 1;
          } else {
            cart.push({
              _id: product._id,
              name: product.name,
              price: product.price,
              image: product.image,
              quantity: 1
            });
          }

          localStorage.setItem("cart", JSON.stringify(cart));
          updateCartBadge();
          alert("Added to cart!");
        });

        productList.appendChild(div);
      });

    } catch (error) {
      console.error("❌ Error loading products:", error);
      productList.innerHTML = "<p style='color:red;'>Failed to load products.</p>";
    }
  }

  loadProducts();
});