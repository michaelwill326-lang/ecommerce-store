document.getElementById('loginBtn').addEventListener('click', async () => {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
  
    if (!username || !password) {
      alert('Please enter both username and password');
      return;
    }
  
    try {
      const res = await fetch('http://localhost:5002/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
  
      const data = await res.json();
  
      if (res.ok && data.token) {
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('adminToken', data.token);
        window.location.href = 'admin.html'; // Go to dashboard
      } else {
        alert(data.message || 'Invalid login');
      }
    } catch (err) {
      console.error('Login error', err);
      alert('Login failed');
    }
  });
  