app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { name, email, address, cartItems } = req.body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const lineItems = cartItems.map(item => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer_email: email,
      metadata: {
        name,
        email,
        address,
      },
      success_url: "http://localhost:5002/success.html",
      cancel_url: "http://localhost:5002/cancel.html",
    });

    res.json({
      url: session.url,
      trackingNumber: session.id
    });

  } catch (error) {
    console.error("❌ Checkout Error:", error);
    res.status(500).json({ error: error.message });
  }
});

