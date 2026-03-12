const API="https://techmart-backend-ecbi.onrender.com"

const productsContainer=document.getElementById("products")
const featuredContainer=document.getElementById("featuredProducts")
const recommendedContainer=document.getElementById("recommendedProducts")

let allProducts=[]

async function loadProducts(){

const res=await fetch(API+"/api/products")
const products=await res.json()

allProducts=products

displayProducts(products)
displayFeatured(products.slice(0,4))
loadRecommendations()

}

function displayProducts(products){

productsContainer.innerHTML=""

products.forEach(product=>{
productsContainer.innerHTML+=productCard(product)
})

}

function displayFeatured(products){

featuredContainer.innerHTML=""

products.forEach(product=>{
featuredContainer.innerHTML+=productCard(product)
})

}

function productCard(product){

return`

<div class="product-card">

<div class="product-image">

<img src="${product.image}">
<span class="badge">New</span>

</div>

<div class="product-info">

<h3>${product.name}</h3>

<div>${getRating(product)}</div>

<p class="price">₦${product.price}</p>

<div class="actions">

<button onclick="addToCart('${product._id}','${product.name}',${product.price},'${product.image}')">🛒</button>

<button onclick="addToWishlist('${product._id}','${product.name}',${product.price},'${product.image}')">❤️</button>

<button onclick='quickView(${JSON.stringify(product)})'>👁</button>

</div>

</div>

</div>

`

}

function getRating(product){

if(!product.reviews||product.reviews.length===0) return "☆☆☆☆☆"

let total=0
product.reviews.forEach(r=>total+=r.rating)

let avg=Math.round(total/product.reviews.length)

return "★★★★★".slice(0,avg)+"☆☆☆☆☆".slice(avg)

}

function addToCart(id,name,price,image){

let cart=JSON.parse(localStorage.getItem("cart"))||[]

const existing=cart.find(i=>i.id===id)

if(existing){existing.quantity++}
else{cart.push({id,name,price,image,quantity:1})}

localStorage.setItem("cart",JSON.stringify(cart))

alert("Added to cart")

}

function addToWishlist(id,name,price,image){

let wishlist=JSON.parse(localStorage.getItem("wishlist"))||[]

wishlist.push({id,name,price,image})

localStorage.setItem("wishlist",JSON.stringify(wishlist))

alert("Added to wishlist")

}

function quickView(product){

document.getElementById("quickViewModal").style.display="block"

document.getElementById("modalImage").src=product.image
document.getElementById("modalName").innerText=product.name
document.getElementById("modalPrice").innerText="₦"+product.price
document.getElementById("modalDescription").innerText=product.description||""

document.getElementById("modalAddCart").onclick=function(){
addToCart(product._id,product.name,product.price,product.image)
}

let viewed=JSON.parse(localStorage.getItem("viewed"))||[]

viewed.unshift(product)
viewed=viewed.slice(0,5)

localStorage.setItem("viewed",JSON.stringify(viewed))

loadRecommendations()

}

function closeQuickView(){
document.getElementById("quickViewModal").style.display="none"
}

function loadRecommendations(){

const viewed=JSON.parse(localStorage.getItem("viewed"))||[]
recommendedContainer.innerHTML=""

viewed.forEach(product=>{
recommendedContainer.innerHTML+=productCard(product)
})

}

function applyFilters(){

let filtered=[...allProducts]

const category=document.getElementById("categoryFilter").value
const price=document.getElementById("priceFilter").value
const sort=document.getElementById("sortFilter").value

if(category){
filtered=filtered.filter(p=>p.category===category)
}

if(price){
filtered=filtered.filter(p=>p.price<=price)
}

if(sort==="low"){
filtered.sort((a,b)=>a.price-b.price)
}

if(sort==="high"){
filtered.sort((a,b)=>b.price-a.price)
}

displayProducts(filtered)

}

document.getElementById("categoryFilter").addEventListener("change",applyFilters)
document.getElementById("priceFilter").addEventListener("change",applyFilters)
document.getElementById("sortFilter").addEventListener("change",applyFilters)

document.getElementById("searchInput").addEventListener("keyup",function(){

const query=this.value.toLowerCase()

const filtered=allProducts.filter(p=>p.name.toLowerCase().includes(query))

displayProducts(filtered)

})

function scrollToProducts(){
window.scrollTo({top:600,behavior:"smooth"})
}

function toggleMenu(){

const nav=document.querySelector(".nav-links")
nav.classList.toggle("show")

}

loadProducts()