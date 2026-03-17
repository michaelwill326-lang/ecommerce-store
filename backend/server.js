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
   FRONTEND URL
=========================== */

const FRONTEND_URL = "https://techmart-jb9k.onrender.com"

/* ===========================
   CORS
=========================== */

app.use(cors({
origin:"*",
methods:["GET","POST","PUT","DELETE"],
allowedHeaders:["Content-Type","Authorization"]
}))

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
   USER SCHEMA
=========================== */

const userSchema = new mongoose.Schema({

name:String,

email:{
type:String,
unique:true
},

password:String,

createdAt:{
type:Date,
default:Date.now
}

})

const User = mongoose.model("User",userSchema)

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
   ORDER SCHEMA
=========================== */

const orderSchema = new mongoose.Schema({

customerName:String,
email:String,
address:String,

items:Array,

totalAmount:Number,

paymentReference:String,

status:{
type:String,
default:"Processing"
},

trackingNumber:{
type:String,
default:""
},

carrier:{
type:String,
default:""
},

createdAt:{
type:Date,
default:Date.now
}

})

const Order = mongoose.model("Order",orderSchema)

/* ===========================
   DEMO PRODUCT SEED
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
},

{
name:"Mechanical Keyboard",
slug:"mechanical-keyboard",
price:95,
description:"RGB mechanical keyboard",
stock:15,
image:"https://via.placeholder.com/400",
reviews:[]
},

{
name:"Gaming Mouse",
slug:"gaming-mouse",
price:60,
description:"High precision gaming mouse",
stock:25,
image:"https://via.placeholder.com/400",
reviews:[]
},

{
name:"4K Monitor",
slug:"4k-monitor",
price:450,
description:"Ultra HD display monitor",
stock:8,
image:"https://via.placeholder.com/400",
reviews:[]
}

]

await Product.insertMany(products)

res.json({
message:"Demo products inserted",
count:products.length
})

}catch(err){

console.error(err)
res.status(500).json({error:"Seed failed"})

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
   GET PRODUCT BY SLUG
=========================== */

app.get("/api/products/:slug", async(req,res)=>{

const product = await Product.findOne({slug:req.params.slug})

if(!product){
return res.status(404).json({error:"Product not found"})
}

res.json(product)

})

/* ===========================
   ADD PRODUCT
=========================== */

app.post("/api/products", upload.single("image"), async(req,res)=>{

const {name,price,description,stock} = req.body

const slug = name
.toLowerCase()
.replace(/[^a-z0-9]+/g,"-")
.replace(/(^-|-$)/g,"")

const image = req.file ? req.file.path : ""

const product = new Product({
name,
slug,
price,
description,
stock,
image
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
   GET ORDERS
=========================== */

app.get("/api/orders", async(req,res)=>{

const orders = await Order.find().sort({createdAt:-1})

res.json(orders)

})

/* ===========================
   TRACK ORDER
=========================== */

app.get("/api/track/:trackingNumber", async(req,res)=>{

const order = await Order.findOne({
trackingNumber:req.params.trackingNumber
})

if(!order){
return res.status(404).json({error:"Tracking not found"})
}

res.json(order)

})

/* ===========================
   SEO SITEMAP
=========================== */

app.get("/sitemap.xml", async(req,res)=>{

try{

const products = await Product.find()

let urls=""

products.forEach(p=>{

urls+=`

<url>
<loc>${FRONTEND_URL}/product.html?slug=${p.slug}</loc>
<changefreq>weekly</changefreq>
<priority>0.9</priority>
</url>

`

})

const sitemap=`<?xml version="1.0" encoding="UTF-8"?>

<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

<url>
<loc>${FRONTEND_URL}</loc>
<changefreq>daily</changefreq>
<priority>1.0</priority>
</url>

${urls}

</urlset>`

res.header("Content-Type","application/xml")
res.send(sitemap)

}catch(err){

console.error(err)
res.status(500).send("Error generating sitemap")

}

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