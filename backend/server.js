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

app.use(cors())
app.use(express.json())

/* ===========================
   DATABASE
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
   USER MODEL
=========================== */

const userSchema = new mongoose.Schema({

name:String,

email:{
type:String,
unique:true
},

password:String,

role:{
type:String,
default:"customer"
},

storeName:String,

subaccountCode:String,

createdAt:{
type:Date,
default:Date.now
}

})

const User = mongoose.model("User",userSchema)

/* ===========================
   PRODUCT MODEL
=========================== */

const productSchema = new mongoose.Schema({

name:String,
slug:String,
price:Number,
description:String,
stock:Number,
image:String,
category:String,

sellerId:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

storeName:String,

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
   ORDER MODEL
=========================== */

const orderSchema = new mongoose.Schema({

customerName:String,
email:String,
address:String,

sellerId:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

items:Array,

totalAmount:Number,

paymentReference:String,

status:{
type:String,
default:"Processing"
},

trackingNumber:String,
carrier:String,

createdAt:{
type:Date,
default:Date.now
}

})

const Order = mongoose.model("Order",orderSchema)

/* ===========================
   REGISTER USER
=========================== */

app.post("/api/users/register",async(req,res)=>{

try{

const {name,email,password}=req.body

const existing = await User.findOne({email})

if(existing){
return res.status(400).json({error:"User already exists"})
}

const hashed = await bcrypt.hash(password,10)

const user = new User({
name,
email,
password:hashed
})

await user.save()

res.json({message:"Account created successfully"})

}catch(err){

res.status(500).json({error:"Server error"})

}

})

/* ===========================
   LOGIN USER
=========================== */

app.post("/api/users/login",async(req,res)=>{

const {email,password}=req.body

const user = await User.findOne({email})

if(!user) return res.status(400).json({error:"Invalid email"})

const valid = await bcrypt.compare(password,user.password)

if(!valid) return res.status(400).json({error:"Invalid password"})

const token = jwt.sign(
{id:user._id},
process.env.JWT_SECRET || "techmartsecret",
{expiresIn:"7d"}
)

res.json({
token,
user:{
id:user._id,
name:user.name,
email:user.email,
role:user.role
}
})

})

/* ===========================
   PRODUCTS
=========================== */

app.get("/api/products",async(req,res)=>{

const products = await Product.find()

res.json(products)

})

app.get("/api/products/:slug",async(req,res)=>{

const product = await Product.findOne({slug:req.params.slug})

if(!product){
return res.status(404).json({error:"Product not found"})
}

res.json(product)

})

/* ADD PRODUCT */

app.post("/api/products",upload.single("image"),async(req,res)=>{

const {name,price,description,stock,category,sellerId,storeName}=req.body

const slug = name.toLowerCase().replace(/[^a-z0-9]+/g,"-")

const image = req.file ? req.file.path : ""

const product = new Product({
name,
slug,
price,
description,
stock,
image,
category,
sellerId,
storeName
})

const saved = await product.save()

res.json(saved)

})

/* DELETE PRODUCT */

app.delete("/api/products/:id",async(req,res)=>{

await Product.findByIdAndDelete(req.params.id)

res.json({success:true})

})

/* ===========================
   REVIEWS
=========================== */

app.post("/api/products/:slug/reviews",async(req,res)=>{

const {name,rating,comment}=req.body

const product = await Product.findOne({slug:req.params.slug})

product.reviews.push({
name,
rating,
comment
})

await product.save()

res.json(product)

})

/* ===========================
   ORDERS
=========================== */

app.get("/api/user-orders/:email",async(req,res)=>{

const orders = await Order.find({
email:req.params.email
}).sort({createdAt:-1})

res.json(orders)

})

app.get("/api/orders",async(req,res)=>{

const orders = await Order.find().sort({createdAt:-1})

res.json(orders)

})

/* TRACK ORDER */

app.get("/api/track/:trackingNumber",async(req,res)=>{

const order = await Order.findOne({
trackingNumber:req.params.trackingNumber
})

if(!order){
return res.status(404).json({error:"Tracking not found"})
}

res.json(order)

})

/* ===========================
   PAYSTACK PAYMENT
=========================== */

app.post("/initialize-payment", async (req,res)=>{

const {email,amount,subaccount} = req.body

try{

const response = await axios.post(

"https://api.paystack.co/transaction/initialize",

{
email,
amount:Math.round(amount*100),
subaccount:subaccount,
bearer:"subaccount"
},

{
headers:{
Authorization:`Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
"Content-Type":"application/json"
}
}

)

res.json(response.data)

}catch(err){

res.status(500).json({error:"Payment initialization failed"})

}

})

/* VERIFY PAYMENT */

app.post("/verify-payment",async(req,res)=>{

const {reference,orderData}=req.body

try{

const response = await axios.get(

`https://api.paystack.co/transaction/verify/${reference}`,

{
headers:{
Authorization:`Bearer ${process.env.PAYSTACK_SECRET_KEY}`
}
}

)

if(response.data.data.status==="success"){

const order = new Order(orderData)

const saved = await order.save()

io.emit("new-order",saved)

res.json({success:true})

}else{

res.json({success:false})

}

}catch(err){

res.status(500).json({success:false})

}

})

/* ===========================
   ADMIN ANALYTICS
=========================== */

app.get("/api/admin/analytics",async(req,res)=>{

const orders = await Order.find()

let revenue = 0

orders.forEach(o=>{
revenue += o.totalAmount
})

res.json({
totalOrders:orders.length,
revenue
})

})

/* ===========================
   DYNAMIC SITEMAP
=========================== */

app.get("/sitemap.xml", async (req,res)=>{

try{

const products = await Product.find()

let urls = ""

products.forEach(p=>{

urls += `
<url>
<loc>https://techmart.vercel.app/product.html?slug=${p.slug}</loc>
<changefreq>weekly</changefreq>
<priority>0.9</priority>
</url>
`

})

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>

<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

<url>
<loc>https://techmart.vercel.app</loc>
<changefreq>daily</changefreq>
<priority>1.0</priority>
</url>

${urls}

</urlset>`

res.header("Content-Type","application/xml")
res.send(sitemap)

}catch(err){

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

server.listen(PORT,()=>{

console.log(`🚀 Server running on port ${PORT}`)

})