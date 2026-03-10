const BACKEND_URL = "https://techmart-backend-ecbi.onrender.com";

const productsContainer = document.getElementById("products");
const spinner = document.getElementById("loading-spinner");
const searchInput = document.getElementById("searchInput");

let allProducts = [];

/* ===========================
   LOAD PRODUCTS
=========================== */

async function loadProducts() {

spinner.style.display = "block";

try {

const res = await fetch(`${BACKEND_URL}/api/products`);
const products = await res.json();

allProducts = products;

renderProducts(products);

} catch (err) {

productsContainer.innerHTML = "<p>Failed to load products.</p>";

}

spinner.style.display = "none";

}

loadProducts();

/* ===========================
   RENDER PRODUCTS
=========================== */

productsContainer.innerHTML += `

<div class="product">

<a href="product.html?slug=${product.slug}">
<img src="${product.image}" alt="${product.name}" style="width:100%;height:180px;object-fit:cover;border-radius:6px;">
</a>

<h3>
<a href="product.html?slug=${product.slug}">
${product.name}
</a>
</h3>

<p>${product.description || ""}</p>

<p><strong>₦${product.price}</strong></p>

<button onclick="addToCart(
'${product._id}',
'${product.name}',
${product.price},
'${product.image}'
)">Add to Cart</button>

<button onclick="addToWishlist(
'${product._id}',
'${product.name}',
${product.price},
'${product.image}'
)">❤️ Wishlist</button>

</div>

`;

/* ===========================
   SEARCH PRODUCTS
=========================== */

if (searchInput) {

searchInput.addEventListener("input", () => {

const keyword = searchInput.value.toLowerCase();

const filtered = allProducts.filter(product =>
product.name.toLowerCase().includes(keyword)
);

renderProducts(filtered);

});

}

/* ===========================
   CART SYSTEM
=========================== */

function addToCart(id, name, price, image) {

let cart = JSON.parse(localStorage.getItem("cart")) || [];

const existing = cart.find(item => item.id === id);

if (existing) {

existing.quantity++;

} else {

cart.push({
id,
name,
price,
image,
quantity: 1
});

}

localStorage.setItem("cart", JSON.stringify(cart));

updateCartCount();

alert("Added to cart 🛒");

}

/* ===========================
   UPDATE CART BADGE
=========================== */

function updateCartCount() {

const badge = document.getElementById("cart-count");

if (!badge) return;

const cart = JSON.parse(localStorage.getItem("cart")) || [];

const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

badge.textContent = totalItems;

}

updateCartCount();

/* ===========================
   WISHLIST SYSTEM
=========================== */

function addToWishlist(id, name, price, image) {

let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

const existing = wishlist.find(item => item.id === id);

if (existing) {

alert("Already in wishlist ❤️");

return;

}

wishlist.push({
id,
name,
price,
image
});

localStorage.setItem("wishlist", JSON.stringify(wishlist));

alert("Added to wishlist ❤️");

}