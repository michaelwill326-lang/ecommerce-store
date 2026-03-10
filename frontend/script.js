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

  const totalItems = cart.reduce((sum,item)=>{
    return sum + item.quantity
  },0)

  if(cartCount){
    cartCount.textContent = totalItems
  }

}

/* ===========================
   ADD TO CART
=========================== */

function addToCart(product){

  let cart = getCart()

  const existing = cart.find(item => item._id === product._id)

  if(existing){

    existing.quantity += 1

  }else{

    cart.push({
      _id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    })

  }

  saveCart(cart)

}

/* ===========================
   LOAD PRODUCTS
=========================== */

async function loadProducts(){

try{

spinner.style.display="block"

const res = await fetch(`${BACKEND_URL}/api/products`)

const products = await res.json()

spinner.style.display="none"

productsContainer.innerHTML=""

products.forEach(product=>{

productsContainer.innerHTML+=`

<div class="product">

<img src="${product.image}" width="150">

<h3>${product.name}</h3>

<p>${product.description}</p>

<p><strong>₦${product.price}</strong></p>

<button onclick='addToCart(${JSON.stringify(product)})'>
Add to Cart
</button>

</div>

`

})

}catch(err){

console.error(err)

productsContainer.innerHTML="Failed to load products"

}

}

updateCartBadge()
loadProducts()