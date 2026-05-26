import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='/' element={<div style={{color: 'white', padding: '20px'}}>Welcome to TechMart</div>} />
      </Routes>
    </Router>
  );
}

export default App;
