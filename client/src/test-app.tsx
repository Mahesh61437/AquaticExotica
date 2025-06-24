import React from 'react';
import { useAuth } from './context/AuthContext';

export default function TestAuth() {
  const { currentUser, signIn, signOut, getAccessToken, loading } = useAuth();

  const handleTestLogin = async () => {
    try {
      // Test with your Django credentials
      await signIn('mahesh61437mahe@gmail.com', 'your_password_here');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleTestLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleTestToken = () => {
    const token = getAccessToken();
    console.log('Current access token:', token);
    alert(`Token: ${token || 'No token found'}`);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Django JWT Authentication Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Current Status:</h2>
        {currentUser ? (
          <div style={{ color: 'green' }}>
            ✅ Logged in as: {currentUser.username} (ID: {currentUser.id})
            <br />
            Email: {currentUser.email}
            <br />
            Admin: {currentUser.isAdmin ? 'Yes' : 'No'}
          </div>
        ) : (
          <div style={{ color: 'red' }}>
            ❌ Not logged in
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={handleTestLogin}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test Login
        </button>
        
        <button 
          onClick={handleTestLogout}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test Logout
        </button>
        
        <button 
          onClick={handleTestToken}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Show Token
        </button>
      </div>

      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
        <h3>Instructions:</h3>
        <ol>
          <li>Click "Test Login" to attempt login with Django JWT</li>
          <li>Check the console for any errors</li>
          <li>Click "Show Token" to see the stored JWT token</li>
          <li>Click "Test Logout" to clear the token</li>
        </ol>
        
        <p><strong>Note:</strong> Make sure your Django backend is running and the API endpoints are accessible.</p>
      </div>
    </div>
  );
}