// Debug script to test API configuration
// Run this with: node src/debug-api.js

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 
  (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : 'https://edusmart-server.pages.dev');

console.log('=== API Configuration Debug ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
console.log('Computed API_BASE_URL:', API_BASE_URL);
console.log('');

// Test basic API endpoint
const testAPI = async () => {
  try {
    const axios = require('axios');
    
    console.log('Testing API root endpoint...');
    const response = await axios.get(`${API_BASE_URL}/api/`);
    console.log('✅ API root test successful:', response.status);
    console.log('Response:', response.data);
    console.log('');
    
    // Test login
    console.log('Testing login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'info@matrixaiglobal.com',
      password: '12345678'
    });
    console.log('✅ Login successful:', loginResponse.status);
    
    const token = loginResponse.data.session.access_token;
    console.log('Token received:', token.substring(0, 20) + '...');
    console.log('');
    
    // Test profile API
    console.log('Testing profile API...');
    const profileResponse = await axios.get(`${API_BASE_URL}/api/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Profile API successful:', profileResponse.status);
    console.log('Profile data:', profileResponse.data.data.full_name);
    
  } catch (error) {
    console.error('❌ API test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
};

testAPI(); 