import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import ProductDetail from './pages/ProductDetail';
import Tracking from './pages/Tracking';
import Verify from './pages/Verify';
import Wishlist from './pages/Wishlist';
import Admin from './pages/Admin';
import RequireAdmin from './utils/RequireAdmin';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/wishlist" element={<Wishlist />} />
        
        {/* Protected Admin Route */}
        <Route path="/admin" element={
          <RequireAdmin>
            <Admin />
          </RequireAdmin>
        } />
      </Routes>
    </Router>
  );
}

export default App;