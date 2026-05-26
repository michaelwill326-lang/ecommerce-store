import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Success from "./pages/Success";
import Admin from "./pages/Admin";
import Tracking from "./pages/Tracking";
import Wishlist from "./pages/Wishlist";
import Chatbot from "./components/Chatbot";
import Navbar from "./components/Navbar";
import AdminAddProduct from "./components/AdminAddProduct";
import Policy from "./pages/Policy";

// Inside Routes:
<Route path="/policy" element={<Policy />} />

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/success" element={<Success />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/add-product" element={<AdminAddProduct />} />
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/wishlist" element={<Wishlist />} />
      </Routes>
      <Chatbot />
    </BrowserRouter>
  );
}
