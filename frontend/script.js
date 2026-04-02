const BACKEND_URL="https://techmart-backend-ecbi.onrender.com"

/* ===========================
   CART
=========================== */

let cart = JSON.parse(localStorage.getItem("cart") || "[]")

function saveCart(){
localStorage.setItem("cart", JSON.stringify(cart))
}

/* ADD TO CART */
function addToCart(id,name,price,image){

const existing = cart.find(item => item.id === id)

if(existing){
existing.quantity++
}else{
cart.push({
id,
name,
price,
image,
quantity:1
})
}

saveCart()
alert("Added to cart")
}

/* ===========================
   LOAD PRODUCTS
=========================== */

async function loadProducts(){

try{

const res = await fetch(`${BACKEND_URL}/api/products`)
const products = await res.json()

const container = document.getElementById("products")
if(!container) return

container.innerHTML = ""

products.forEach(p=>{
container.innerHTML += `
<div class="product-card">
<img src="${p.image}" width="100%">
<h3>${p.name}</h3>
<p>₦${p.price}</p>

<button onclick="addToCart('${p._id}','${p.name}','${p.price}','${p.image}')">
Add to Cart
</button>

<a href="cart.html">View Cart</a>
</div>
`
})

}catch(err){
console.error(err)
}

}

/* ===========================
   INIT
=========================== */

loadProducts()