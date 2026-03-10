const cartContainer = document.getElementById("cart-items")
const totalElement = document.getElementById("cart-total")

function getCart(){
return JSON.parse(localStorage.getItem("cart")) || []
}

function saveCart(cart){
localStorage.setItem("cart",JSON.stringify(cart))
renderCart()
}

function removeItem(id){

let cart = getCart()

cart = cart.filter(item => item._id !== id)

saveCart(cart)

}

function changeQty(id,amount){

let cart = getCart()

const item = cart.find(i => i._id === id)

if(!item) return

item.quantity += amount

if(item.quantity <= 0){
removeItem(id)
return
}

saveCart(cart)

}

function renderCart(){

const cart = getCart()

cartContainer.innerHTML=""

let total = 0

cart.forEach(item=>{

total += item.price * item.quantity

cartContainer.innerHTML+=`

<div class="cart-item">

<img src="${item.image}" width="80">

<div>

<h3>${item.name}</h3>

<p>₦${item.price}</p>

<button onclick="changeQty('${item._id}',-1)">-</button>

${item.quantity}

<button onclick="changeQty('${item._id}',1)">+</button>

<button onclick="removeItem('${item._id}')">
Remove
</button>

</div>

</div>

`

})

totalElement.textContent = `Total: ₦${total}`

}

renderCart()