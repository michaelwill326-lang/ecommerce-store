const API = "https://techmart-backend-ecbi.onrender.com";

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart(){
  localStorage.setItem("cart", JSON.stringify(cart));
}

/* ===========================
   SELF-HEAL CART (🔥 KEY FIX)
=========================== */
async function fixCartData(){

  let updated = false;

  for(let item of cart){

    if(!item.name || !item.price){

      try{
        const res = await fetch(API + "/api/products");
        const products = await res.json();

        const product = products.find(p => p._id == item.id);

        if(product){
          item.name = product.name;
          item.price = product.price;
          item.image = product.image;
          updated = true;
        }

      }catch(err){
        console.error("Fix cart error:", err);
      }

    }
  }

  if(updated){
    saveCart();
  }
}

/* ===========================
   RENDER CART
=========================== */
async function renderCart(){

  await fixCartData(); // 🔥 AUTO FIX

  const cartDiv = document.getElementById("cartItems");
  const totalSpan = document.getElementById("total");

  cartDiv.innerHTML = "";

  let total = 0;

  cart.forEach((item, index) => {

    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 1;

    const itemTotal = price * quantity;
    total += itemTotal;

    cartDiv.innerHTML += `
      <div class="cart-item">
        <span>${item.name || "Item"} x${quantity}</span>
        <span>₦${itemTotal}</span>

        <div>
          <button onclick="decreaseQuantity(${index})">-</button>
          <button onclick="increaseQuantity(${index})">+</button>
          <button onclick="removeItem(${index})">Remove</button>
        </div>
      </div>
    `;
  });

  totalSpan.textContent = total;
}

/* ===========================
   CART ACTIONS
=========================== */
function increaseQuantity(i){
  cart[i].quantity++;
  saveCart();
  renderCart();
}

function decreaseQuantity(i){
  if(cart[i].quantity > 1){
    cart[i].quantity--;
  }else{
    cart.splice(i,1);
  }
  saveCart();
  renderCart();
}

function removeItem(i){
  cart.splice(i,1);
  saveCart();
  renderCart();
}

function clearCart(){
  cart = [];
  saveCart();
  renderCart();
}

function goToCheckout(){
  window.location = "checkout.html";
}

/* INIT */
renderCart();