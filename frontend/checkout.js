const BACKEND_URL = "https://techmart-backend-ecbi.onrender.com";

const form = document.getElementById("checkout-form");
const summaryDiv = document.getElementById("order-summary");
const totalEl = document.getElementById("checkout-total");

let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* ===========================
   CHECK CART
=========================== */
if (cart.length === 0) {
  alert("Your cart is empty!");
  window.location.href = "index.html";
}

/* ===========================
   AUTO FILL USER
=========================== */
const user = JSON.parse(localStorage.getItem("user"));

if (user) {
  document.getElementById("name").value = user.name;
  document.getElementById("email").value = user.email;
}

/* ===========================
   RENDER SUMMARY
=========================== */
function renderSummary() {

  summaryDiv.innerHTML = "";
  let total = 0;

  cart.forEach(item => {

    total += item.price * item.quantity;

    const div = document.createElement("div");

    div.innerHTML = `
      <p>
        ${item.name} × ${item.quantity}
        <span style="float:right;">
          ₦${(item.price * item.quantity).toFixed(2)}
        </span>
      </p>
    `;

    summaryDiv.appendChild(div);

  });

  totalEl.textContent = `Total: ₦${total.toFixed(2)}`;
}

renderSummary();

/* ===========================
   CHECKOUT SUBMIT
=========================== */
form.addEventListener("submit", async (e) => {

  e.preventDefault();

  const token = localStorage.getItem("userToken");

  const customerName = document.getElementById("name").value.trim();
  const email = user ? user.email : document.getElementById("email").value.trim();
  const address = document.getElementById("address").value.trim();

  if (!customerName || !email || !address) {
    alert("Please fill all fields.");
    return;
  }

  const totalAmount = cart.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  try {

    /* ===========================
       INIT PAYMENT
    ============================ */
    const initResponse = await fetch(`${BACKEND_URL}/initialize-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        amount: totalAmount
      })
    });

    if (!initResponse.ok) {
      alert("Payment initialization failed.");
      return;
    }

    const initData = await initResponse.json();

    if (!initData.status) {
      alert("Payment failed.");
      return;
    }

    if (typeof PaystackPop === "undefined") {
      alert("Payment system not loaded.");
      return;
    }

    /* ===========================
       PAYSTACK POPUP
    ============================ */
    const handler = PaystackPop.setup({

      key: "pk_test_c37b9c580095dffc5e9a977f82c04ecac4bd8337",
      email: email,
      amount: Math.round(totalAmount * 100),
      currency: "NGN",
      ref: initData.data.reference,

      callback: function (response) {

        fetch(`${BACKEND_URL}/verify-payment`, {

          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            reference: response.reference,

            orderData: {
              customerName,
              email,
              address,
              items: cart,
              totalAmount
            }

          })

        })
        .then(res => res.json())
        .then(data => {

          if (data.success) {

            localStorage.removeItem("cart");

            window.location.href =
              `thankyou.html?orderId=${data.orderId}`;

          } else {
            alert("Payment verification failed.");
          }

        })
        .catch(err => {
          console.error(err);
          alert("Verification error.");
        });

      },

      onClose: function () {
        console.log("Payment window closed");
      }

    });

    handler.openIframe();

  } catch (error) {

    console.error(error);
    alert("Something went wrong.");

  }

});