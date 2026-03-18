require("dotenv").config()

const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const multer = require("multer")
const { CloudinaryStorage } = require("multer-storage-cloudinary")
const cloudinary = require("cloudinary").v2
app.get("/", (req, res) => {
   res.send("TechMart Backend Running ✅")
 })
const http = require("http")
const { Server } = require("socket.io")

const app = express()
const PORT = process.env.PORT || 10000

/* ===========================
   CORS
=========================== */

app.use(cors())
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
   PRODUCT SCHEMA
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
createdAt:{
type:Date,
default:Date.now
}
}],

createdAt:{
type:Date,
default:Date.now
}
})

const Product = mongoose.model("Product",productSchema)

/* ===========================
   SEED PRODUCTS
=========================== */

app.get("/seed-products", async(req,res)=>{
try{

await Product.deleteMany()

const products=[
{
name:"Gaming Laptop",
slug:"gaming-laptop",
price:1200,
description:"High performance gaming laptop",
stock:10,
image:"https://via.placeholder.com/400",
reviews:[]
},
{
name:"Wireless Headphones",
slug:"wireless-headphones",
price:150,
description:"Noise cancelling headphones",
stock:20,
image:"https://via.placeholder.com/400",
reviews:[]
}
]

await Product.insertMany(products)

res.json({message:"Products seeded"})

}catch(err){
res.status(500).json({error:err.message})
}
})

/* ===========================
   GET PRODUCTS
=========================== */

app.get("/api/products", async(req,res)=>{
const products = await Product.find()
res.json(products)
})

/* ===========================
   TRENDING PRODUCTS
=========================== */

app.get("/api/products/trending", async(req,res)=>{
const products = await Product.find().limit(4)
res.json(products)
})

/* ===========================
   GET PRODUCT BY SLUG
=========================== */

app.get("/api/products/:slug", async(req,res)=>{
const product = await Product.findOne({slug:req.params.slug})

if(!product){
return res.status(404).json({error:"Not found"})
}

res.json(product)
})

/* ===========================
   ADD PRODUCT
=========================== */

app.post("/api/products", upload.single("image"), async(req,res)=>{

const {name,price,description,stock} = req.body

const slug = name.toLowerCase().replace(/[^a-z0-9]+/g,"-")

const image = req.file ? req.file.path : ""

const product = new Product({
name,slug,price,description,stock,image
})

const saved = await product.save()

res.json(saved)

})

/* ===========================
   DELETE PRODUCT
=========================== */

app.delete("/api/products/:id", async(req,res)=>{
await Product.findByIdAndDelete(req.params.id)
res.json({success:true})
})

/* ===========================
   ADD REVIEW
=========================== */

app.post("/api/products/:slug/reviews", async(req,res)=>{
const product = await Product.findOne({slug:req.params.slug})

if(!product){
return res.status(404).json({error:"Product not found"})
}

product.reviews.push(req.body)

await product.save()

res.json({message:"Review added"})
})

/* ===========================
   SOCKET.IO
=========================== */

const server = http.createServer(app)

const io = new Server(server,{
cors:{origin:"*"}
})

io.on("connection",(socket)=>{
console.log("Admin connected:",socket.id)
})

/* ===========================
   START SERVER
=========================== */

server.listen(PORT,()=>{
console.log(`🚀 Server running on port ${PORT}`)
})