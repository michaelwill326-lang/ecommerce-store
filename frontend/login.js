document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
  
    const res = await fetch('http://localhost:5002/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  
    const data = await res.json();
  
    if (data.success) {
      localStorage.setItem('adminToken', data.token);
      window.location.href = 'admin.html';
    } else {
      document.getElementById('errorMessage').textContent = data.message || 'Login failed';
    }
  });
  