require("dotenv").config()

const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const axios = require("axios")
const multer = require("multer")
const { CloudinaryStorage } = require("multer-storage-cloudinary")
const cloudinary = require("cloudinary").v2
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const http = require("http")
const { Server } = require("socket.io")

const app = express()
const PORT = process.env.PORT || 10000

/* ===========================
   ROOT ROUTE (FIXES ERROR)
=========================== */

app.get("/", (req, res) => {
  res.send("TechMart Backend Running ✅")
})

/* ===========================
   MIDDLEWARE
=========================== */

app.use(cors({ origin:"*" }))
app.use(express.json())

/* ===========================
   MONGODB
=========================== */

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("✅ MongoDB Connected"))
.catch(err=>console.error(err))

/* ===========================
   CLOUDINARY
=========================== */

cloudinary.config({
cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
api_key:process.env.CLOUDINARY_API_KEY,
api_secret:process.env.CLOUDINARY_API_SECRET
})

const storage = new CloudinaryStorage({
cloudinary,
params:{
folder:"techmart_products",
allowed_formats:["jpg","png","jpeg"]
}
})

const upload = multer({storage})

/* ===========================
   MODELS
=========================== */

const productSchema = new mongoose.Schema({
name:String,
slug:String,
price:Number,
description:String,
stock:Number,
image:String,
reviews:[{
name:String,
rating:Number,
comment:String,
createdAt:{ type:Date, default:Date.now }
}],
createdAt:{ type:Date, default:Date.now }
})

const Product = mongoose.model("Product",productSchema)

/* ===========================
   🔥 SEED PRODUCTS (NEW)
=========================== */

app.get("/seed-products", async (req, res) => {
  try {

    await Product.deleteMany()

    const products = [
      {
        name: "Gaming Laptop",
        slug: "gaming-laptop",
        price: 1200,
        description: "High performance gaming laptop",
        stock: 10,
        image: "https://via.placeholder.com/400"
      },
      {
        name: "Wireless Headphones",
        slug: "wireless-headphones",
        price: 150,
        description: "Noise cancelling headphones",
        stock: 20,
        image: "https://via.placeholder.com/400"
      },
      {
        name: "Mechanical Keyboard",
        slug: "mechanical-keyboard",
        price: 95,
        description: "RGB keyboard",
        stock: 15,
        image: "https://via.placeholder.com/400"
      },
      {
        name: "Gaming Mouse",
        slug: "gaming-mouse",
        price: 60,
        description: "High precision mouse",
        stock: 25,
        image: "https://via.placeholder.com/400"
      }
    ]

    await Product.insertMany(products)

    res.json({ message: "Products seeded", count: products.length })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ===========================
   PRODUCTS
=========================== */

app.get("/api/products", async(req,res)=>{
const products = await Product.find()
res.json(products)
})

app.get("/api/products/:slug", async(req,res)=>{
const product = await Product.findOne({slug:req.params.slug})
if(!product) return res.status(404).json({error:"Not found"})
res.json(product)
})

/* ===========================
   SERVER
=========================== */

const server = http.createServer(app)

const io = new Server(server,{ cors:{origin:"*"} })

server.listen(PORT,()=>{
console.log(`🚀 Server running on port ${PORT}`)
})