export const getToken = () => sessionStorage.getItem('token');
export const getUser = () => { try { return JSON.parse(sessionStorage.getItem('user')); } catch { return null; } };
export const saveAuth = (token, user) => { sessionStorage.setItem('token', token); sessionStorage.setItem('user', JSON.stringify(user)); localStorage.removeItem('token'); localStorage.removeItem('user'); };
export const clearAuth = () => { sessionStorage.clear(); localStorage.removeItem('token'); localStorage.removeItem('user'); localStorage.removeItem('sellerToken'); localStorage.removeItem('adminToken'); localStorage.removeItem('deviceToken'); localStorage.removeItem('techmart_last_activity'); };
export const getSellerToken = () => sessionStorage.getItem('sellerToken');
export const getAdminToken = () => sessionStorage.getItem('adminToken');
