const BACKEND_URL="https://techmart-backend-ecbi.onrender.com"

const productsContainer=document.getElementById("products")

const cartCount=document.getElementById("cart-count")

updateCartCount()

/* LOAD PRODUCTS */

async function loadProducts(){

const res=await fetch(`${BACKEND_URL}/api/products`)

const products=await res.json()

productsContainer.innerHTML=""

products.forEach(product=>{

productsContainer.innerHTML+=`

<div class="product-card">

<div class="product-image">

<a href="product.html?slug=${product.slug}">

<img src="${product.image}">

</a>

<span class="badge-new">NEW</span>

</div>

<div class="product-info">

<h3>${product.name}</h3>

<div class="rating">⭐⭐⭐⭐⭐</div>

<p class="price">₦${product.price}</p>

<div class="actions">

<button onclick="addToCart('${product._id}','${product.name}',${product.price},'${product.image}')">
🛒 Add
</button>

<button onclick="addToWishlist('${product._id}','${product.name}',${product.price},'${product.image}')">
❤️
</button>

</div>

</div>

</div>

`

})

}

/* ADD TO CART */

function addToCart(id,name,price,image){

let cart=JSON.parse(localStorage.getItem("cart")) || []

const existing=cart.find(item=>item.id===id)

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

localStorage.setItem("cart",JSON.stringify(cart))

updateCartCount()

alert("Added to cart")

}

/* WISHLIST */

function addToWishlist(id,name,price,image){

let wishlist=JSON.parse(localStorage.getItem("wishlist")) || []

const existing=wishlist.find(item=>item.id===id)

if(existing){

alert("Already in wishlist")

return

}

wishlist.push({id,name,price,image})

localStorage.setItem("wishlist",JSON.stringify(wishlist))

alert("Added to wishlist")

}

/* CART BADGE */

function updateCartCount(){

let cart=JSON.parse(localStorage.getItem("cart")) || []

let total=0

cart.forEach(i=>{

total+=i.quantity

})

if(cartCount){

cartCount.textContent=total

}

}

loadProducts()