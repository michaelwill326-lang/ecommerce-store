const BACKEND_URL = "https://techmart-backend-ecbi.onrender.com";

const summaryDiv = document.getElementById("order-summary");
const totalEl = document.getElementById("checkout-total");
const form = document.getElementById("checkout-form");

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
          $${(item.price * item.quantity).toFixed(2)}
        </span>
      </p>
    `;
    summaryDiv.appendChild(div);
  });

  totalEl.textContent = `Total: $${total.toFixed(2)}`;
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

  try {
    /* ===========================
       Initialize Payment
    ============================ */
    const response = await fetch(`${BACKEND_URL}/initialize-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        amount: totalAmount
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Initialize error:", errText);
      alert("Payment initialization failed.");
      return;
    }

    const data = await response.json();

    if (!data.status) {
      console.error("Paystack init response:", data);
      alert("Payment initialization failed.");
      return;
    }

    /* ===========================
       Ensure Paystack Loaded
    ============================ */
    if (typeof PaystackPop === "undefined") {
      alert("Paystack script not loaded.");
      return;
    }

    /* ===========================
       Open Paystack Popup
    ============================ */
    const handler = PaystackPop.setup({
      key: "pk_test_c37b9c580095dffc5e9a977f82c04ecac4bd8337",
      email: email,
      amount: totalAmount * 100,
      ref: data.data.reference,

      callback: async function (response) {
        try {
          /* ===========================
             Verify Payment
          ============================ */
          const verifyResponse = await fetch(`${BACKEND_URL}/verify-payment`, {
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
          });

          if (!verifyResponse.ok) {
            const errText = await verifyResponse.text();
            console.error("Verify error:", errText);
            alert("Payment verification failed.");
            return;
          }

          const verifyData = await verifyResponse.json();

          if (verifyData.success) {
            localStorage.removeItem("cart");
            window.location.href = "thankyou.html";
          } else {
            alert("Payment verification failed.");
          }

        } catch (verifyError) {
          console.error("Verification crash:", verifyError);
          alert("Verification error occurred.");
        }
      },

      onClose: function () {
        alert("Payment window closed.");
      }
    });

    handler.openIframe();

  } catch (error) {
    console.error("Payment process error:", error);
    alert("Something went wrong.");
  }
});