const BACKEND_URL = "https://techmart-backend-ecbi.onrender.com";

const form = document.getElementById("checkout-form");

let cart = JSON.parse(localStorage.getItem("cart")) || [];

if (cart.length === 0) {
  alert("Your cart is empty!");
  window.location.href = "index.html";
}

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
    const initResponse = await fetch(`${BACKEND_URL}/initialize-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        amount: totalAmount
      })
    });

    const initData = await initResponse.json();

    if (!initData.status) {
      alert("Payment initialization failed.");
      return;
    }

    const handler = PaystackPop.setup({
      key: "pk_test_c37b9c580095dffc5e9a977f82c04ecac4bd8337",
      email: email,
      amount: totalAmount * 100,
      ref: initData.data.reference,

      callback: function (response) {
        // 🔥 THIS MUST RUN
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
        .then(res => res.json())
        .then(data => {
          console.log("Verify response:", data);

          if (data.success && data.orderId) {
            localStorage.removeItem("cart");
            window.location.href = `thankyou.html?orderId=${data.orderId}`;
          } else {
            alert("Payment verification failed.");
          }
        })
        .catch(err => {
          console.error("Verification error:", err);
          alert("Verification failed.");
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