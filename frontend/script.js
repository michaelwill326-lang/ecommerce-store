const BACKEND_URL = "https://techmart-backend-ecbi.onrender.com";

/* ===========================
   LOAD CART
=========================== */
let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* ===========================
   SAVE CART
=========================== */
function saveCart(){
  localStorage.setItem("cart", JSON.stringify(cart));
}

/* ===========================
   RENDER CART (FIXED)
=========================== */
function renderCart(){

  const cartDiv = document.getElementById("cartItems");
  const totalSpan = document.getElementById("total");

  if(!cartDiv) return;

  cartDiv.innerHTML = "";

  let total = 0;

  cart.forEach((item, index) => {

    const name = item.name || "Item";
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 1;

    const itemTotal = price * quantity;
    total += itemTotal;

    cartDiv.innerHTML += `
      <div class="cart-item">
        <span>${name} x${quantity}</span>
        <span>₦${itemTotal}</span>

        <div>
          <button onclick="decreaseQuantity(${index})">-</button>
          <button onclick="increaseQuantity(${index})">+</button>
          <button onclick="removeItem(${index})">Remove</button>
        </div>
      </div>
    `;
  });

  if(totalSpan){
    totalSpan.textContent = total;
  }
}

/* ===========================
   CART ACTIONS
=========================== */
function increaseQuantity(index){
  cart[index].quantity++;
  saveCart();
  renderCart();
}

function decreaseQuantity(index){
  if(cart[index].quantity > 1){
    cart[index].quantity--;
  }else{
    cart.splice(index,1);
  }
  saveCart();
  renderCart();
}

function removeItem(index){
  cart.splice(index,1);
  saveCart();
  renderCart();
}

function clearCart(){
  cart = [];
  saveCart();
  renderCart();
}

function goToCheckout(){
  if(cart.length === 0){
    alert("Cart is empty");
    return;
  }
  window.location = "checkout.html";
}

/* ===========================
   INIT
=========================== */
renderCart();