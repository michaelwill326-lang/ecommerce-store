const BACKEND_URL="https://techmart-backend-ecbi.onrender.com"

/* ===========================
   CART
=========================== */

let cart=JSON.parse(localStorage.getItem("cart")||"[]")

function saveCart(){
localStorage.setItem("cart",JSON.stringify(cart))
}

function addToCart(id,name,price,image){
cart.push({id,name,price,image,quantity:1})
saveCart()
alert("Added to cart")
}

/* ===========================
   LOAD PRODUCTS
=========================== */

async function loadProducts(){

try{

const res=await fetch(`${BACKEND_URL}/api/products`)
const products=await res.json()

const container=document.getElementById("products")
if(!container) return

container.innerHTML=""

products.forEach(p=>{
container.innerHTML+=`
<div class="product-card">
<img src="${p.image}" width="100%">
<h3>${p.name}</h3>
<p>₦${p.price}</p>

<button onclick="addToCart('${p._id}','${p.name}','${p.price}','${p.image}')">
Add to Cart
</button>

<a href="product.html?slug=${p.slug}">View</a>
</div>
`
})

}catch(err){
console.error(err)
}

}

/* ===========================
   LOAD PRODUCT PAGE
=========================== */

async function loadProduct(){

const params=new URLSearchParams(window.location.search)
const slug=params.get("slug")

if(!slug) return

const res=await fetch(`${BACKEND_URL}/api/products/${slug}`)
const p=await res.json()

document.getElementById("product-name").innerText=p.name
document.getElementById("product-price").innerText="₦"+p.price
document.getElementById("product-description").innerText=p.description
document.getElementById("product-image").src=p.image

loadReviews(slug)

}

/* ===========================
   LOAD REVIEWS
=========================== */

async function loadReviews(slug){

const res=await fetch(`${BACKEND_URL}/api/products/${slug}`)
const p=await res.json()

const container=document.getElementById("reviews")
if(!container) return

container.innerHTML=""

p.reviews.forEach(r=>{
container.innerHTML+=`
<div>
<strong>${r.name}</strong>
<p>${"⭐".repeat(r.rating)}</p>
<p>${r.comment}</p>
</div>
`
})

}

/* ===========================
   SUBMIT REVIEW
=========================== */

async function submitReview(){

const slug=new URLSearchParams(window.location.search).get("slug")

const name=document.getElementById("review-name").value
const rating=document.getElementById("review-rating").value
const comment=document.getElementById("review-comment").value

await fetch(`${BACKEND_URL}/api/products/${slug}/reviews`,{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({name,rating,comment})
})

alert("Review added")

loadReviews(slug)

}

/* ===========================
   INIT
=========================== */

loadProducts()
loadProduct()