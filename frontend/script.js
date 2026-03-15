const BACKEND_URL="https://techmart-backend-ecbi.onrender.com"

const productsContainer=document.getElementById("products")
const trendingContainer=document.getElementById("trending")
const cartCount=document.getElementById("cart-count")

let allProducts=[]

updateCartCount()

/* ===========================
   LOAD PRODUCTS
=========================== */

async function loadProducts(){

const res=await fetch(`${BACKEND_URL}/api/products`)

const products=await res.json()

allProducts=products

renderProducts(products)

}

/* ===========================
   RENDER PRODUCTS
=========================== */

function renderProducts(products){

if(!productsContainer) return

productsContainer.innerHTML=""

products.forEach(product=>{

productsContainer.innerHTML+=`

<div class="product-card">

<div class="product-image">

<a href="product.html?slug=${product.slug}">
<img src="${product.image}">
</a>

</div>

<div class="product-info">

<h3>${product.name}</h3>

<div class="rating">${generateStars(product.reviews)}</div>

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

/* ===========================
   TRENDING PRODUCTS
=========================== */

async function loadTrending(){

if(!trendingContainer) return

const res=await fetch(`${BACKEND_URL}/api/products/trending`)

const products=await res.json()

trendingContainer.innerHTML=""

products.forEach(product=>{

trendingContainer.innerHTML+=`

<div class="product-card">

<div class="product-image">

<a href="product.html?slug=${product.slug}">
<img src="${product.image}">
</a>

</div>

<div class="product-info">

<h3>${product.name}</h3>

<div class="rating">${generateStars(product.reviews)}</div>

<p class="price">₦${product.price}</p>

</div>

</div>

`

})

}

/* ===========================
   STAR RATINGS
=========================== */

function generateStars(reviews){

if(!reviews || reviews.length===0){

return "No ratings"

}

let total=0

reviews.forEach(r=>{
total+=r.rating
})

let avg=total/reviews.length

let stars=""

for(let i=1;i<=5;i++){

stars += i<=Math.round(avg) ? "⭐" : "☆"

}

return `${stars} (${reviews.length})`

}

/* ===========================
   ADD TO CART
=========================== */

function addToCart(id,name,price,image){

let cart=JSON.parse(localStorage.getItem("cart")) || []

const existing=cart.find(i=>i.id===id)

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

/* ===========================
   WISHLIST
=========================== */

function addToWishlist(id,name,price,image){

let wishlist=JSON.parse(localStorage.getItem("wishlist")) || []

const existing=wishlist.find(i=>i.id===id)

if(existing){

alert("Already in wishlist")

return

}

wishlist.push({id,name,price,image})

localStorage.setItem("wishlist",JSON.stringify(wishlist))

alert("Added to wishlist")

}

/* ===========================
   CART BADGE
=========================== */

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

/* ===========================
   PRODUCT SORTING
=========================== */

const sortSelect=document.getElementById("sortProducts")

if(sortSelect){

sortSelect.addEventListener("change",function(){

let sorted=[...allProducts]

switch(sortSelect.value){

case "newest":

sorted.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))

break

case "price-low":

sorted.sort((a,b)=>a.price-b.price)

break

case "price-high":

sorted.sort((a,b)=>b.price-a.price)

break

case "reviews":

sorted.sort((a,b)=>(b.reviews?.length||0)-(a.reviews?.length||0))

break

}

renderProducts(sorted)

})

}

/* ===========================
   SEARCH SUGGESTIONS
=========================== */

const searchBox=document.getElementById("searchBox")
const searchResults=document.getElementById("search-results")

if(searchBox){

searchBox.addEventListener("input", async function(){

const query=searchBox.value.trim()

if(query.length<2){

searchResults.innerHTML=""
return

}

const res=await fetch(`${BACKEND_URL}/api/products/search?q=${query}`)

const products=await res.json()

searchResults.innerHTML=""

products.forEach(p=>{

searchResults.innerHTML+=`

<div class="search-item"
onclick="window.location='product.html?slug=${p.slug}'">

${p.name}

</div>

`

})

})

/* ENTER SEARCH PAGE */

searchBox.addEventListener("keypress",function(e){

if(e.key==="Enter"){

window.location=`search.html?q=${searchBox.value}`

}

})

}

/* ===========================
   START
=========================== */

loadProducts()
loadTrending()