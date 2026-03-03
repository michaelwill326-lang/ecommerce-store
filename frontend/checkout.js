const BACKEND_URL = "https://techmart-backend-ecbi.onrender.com";

const form = document.getElementById("checkout-form");
const summaryDiv = document.getElementById("order-summary");
const totalEl = document.getElementById("checkout-total");

let cart = JSON.parse(localStorage.getItem("cart")) || [];

if (cart.length === 0) {
  alert("Your cart is empty!");
  window.location.href = "index.html";
}

/* ===========================
   Render Order Summary
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
   Handle Checkout Submit
=========================== */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const customerName = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const address = document.getElementById("address").value.trim();

  if (!customerName || !email || !address) {
    alert("Please fill all fields.");
    return;
  }

  const totalAmount = cart.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  const amountInKobo = Math.round(totalAmount * 100);

  try {
    /* ===========================
       STEP 1: Initialize Payment
    ============================ */
    const initResponse = await fetch(`${BACKEND_URL}/initialize-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        amount: totalAmount
      })
    });

    const initData = await initResponse.json();
    console.log("Initialize response:", initData);

    if (!initData.status) {
      alert("Payment initialization failed.");
      return;
    }

    if (typeof PaystackPop === "undefined") {
      alert("Paystack script not loaded.");
      return;
    }

    /* ===========================
       STEP 2: Open Paystack Popup
    ============================ */
    const handler = PaystackPop.setup({
      key: "pk_test_c37b9c580095dffc5e9a977f82c04ecac4bd8337",
      email: email,
      amount: amountInKobo,
      currency: "NGN",
      ref: initData.data.reference,

      callback: function (response) {
        console.log("Callback triggered:", response);

        fetch(`${BACKEND_URL}/verify-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        .then(res => {
          console.log("Raw verify response:", res);
          return res.text(); // get raw response first
        })
        .then(text => {
          console.log("Raw verify text:", text);

          try {
            const data = JSON.parse(text);
            console.log("Parsed verify JSON:", data);

            if (data.success && data.orderId) {
              localStorage.removeItem("cart");
              window.location.href = `thankyou.html?orderId=${data.orderId}`;
            } else {
              alert("Payment verification failed.");
            }

          } catch (err) {
            console.error("JSON parse error:", err);
            alert("Server did not return valid JSON.");
          }
        })
        .catch(err => {
          console.error("Verify request failed:", err);
          alert("Verification request failed.");
        });
      },

      onClose: function () {
        console.log("Payment popup closed.");
      }
    });

    handler.openIframe();

  } catch (error) {
    console.error("Checkout error:", error);
    alert("Something went wrong.");
  }
});