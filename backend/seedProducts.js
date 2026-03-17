const mongoose = require("mongoose")

mongoose.connect(
  "mongodb+srv://michaelwill326:Godiswithme1@cluster0.g70qv9b.mongodb.net/ecommerce"
)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.error(err))

const productSchema = new mongoose.Schema({
  name: String,
  slug: String,
  price: Number,
  description: String,
  stock: Number,
  image: String,
  category: String,
  sellerId: String,
  reviews: [
    {
      name: String,
      rating: Number,
      comment: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: "products"
})

const Product = mongoose.model("Product", productSchema)

const products = [
  {
    name: "Gaming Laptop",
    slug: "gaming-laptop",
    price: 1200,
    description: "High performance gaming laptop built for speed and graphics.",
    stock: 10,
    image: "https://via.placeholder.com/400",
    category: "laptops",
    sellerId: "demo",
    reviews: []
  },
  {
    name: "Wireless Headphones",
    slug: "wireless-headphones",
    price: 150,
    description: "Noise cancelling wireless headphones with deep bass.",
    stock: 20,
    image: "https://via.placeholder.com/400",
    category: "audio",
    sellerId: "demo",
    reviews: []
  },
  {
    name: "Mechanical Keyboard",
    slug: "mechanical-keyboard",
    price: 95,
    description: "RGB mechanical keyboard designed for gamers.",
    stock: 15,
    image: "https://via.placeholder.com/400",
    category: "accessories",
    sellerId: "demo",
    reviews: []
  },
  {
    name: "Gaming Mouse",
    slug: "gaming-mouse",
    price: 60,
    description: "High precision gaming mouse with customizable buttons.",
    stock: 25,
    image: "https://via.placeholder.com/400",
    category: "accessories",
    sellerId: "demo",
    reviews: []
  },
  {
    name: "4K Monitor",
    slug: "4k-monitor",
    price: 450,
    description: "Ultra HD monitor with vivid colors and wide viewing angles.",
    stock: 8,
    image: "https://via.placeholder.com/400",
    category: "monitors",
    sellerId: "demo",
    reviews: []
  }
]

async function seed() {
  try {
    await Product.deleteMany({})
    await Product.insertMany(products)
    console.log("5 demo products added")
  } catch (err) {
    console.error(err)
  } finally {
    await mongoose.disconnect()
    process.exit()
  }
}

seed()