const express = require('express');
const app = express();
const PORT = 5002;

// Sample product list
const products = [
  {
    id: "1",
    name: "Wireless Headphones",
    price: 99.99,
    image: "https://m.media-amazon.com/images/I/61eeHPRFQ9L._AC_SX300_SY300_QL70_FMwebp_.jpg",
    description: "High quality wireless headphones."
  },
  {
    id: "2",
    name: "Smart Watch",
    price: 149.99,
    image: "https://m.media-amazon.com/images/I/71SZNup1qrL._AC_SX300_SY300_QL70_FMwebp_.jpg",
    description: "Stay connected with this smart watch."
  },
  {
    id: "3",
    name: "Bluetooth Speaker",
    price: 59.99,
    image: "https://m.media-amazon.com/images/I/711EhVM5CRL._AC_SX300_SY300_QL70_FMwebp_.jpg",
    description: "Portable speaker with excellent sound."
  }
];

// Enable JSON parsing
app.use(express.json());

// API endpoint
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
