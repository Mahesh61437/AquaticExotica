import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function DebugLogin() {
  const { signIn, currentUser, getAccessToken } = useAuth();
  const [email, setEmail] = useState('mahesh61437mahe@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      addLog('Starting login process...');
      addLog(`Email: ${email}`);
      addLog(`API Base: ${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}`);
      
      const user = await signIn(email, password);
      
      if (user) {
        addLog('✅ Login successful!');
        addLog(`User ID: ${user.id}`);
        addLog(`Username: ${user.username}`);
        addLog(`Email: ${user.email}`);
        addLog(`Is Admin: ${user.isAdmin}`);
        
        // Check token storage
        const token = getAccessToken();
        addLog(`Access Token: ${token ? '✅ Stored' : '❌ Not found'}`);
        
        // Check localStorage directly
        const directToken = localStorage.getItem('aquaticexotica_access_token');
        addLog(`Direct localStorage check: ${directToken ? '✅ Found' : '❌ Not found'}`);
        
        if (directToken) {
          addLog(`Token preview: ${directToken.substring(0, 20)}...`);
        }
      }
    } catch (error: any) {
      addLog(`❌ Login failed: ${error.message}`);
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentState = () => {
    addLog('=== Current State Check ===');
    addLog(`Current User: ${currentUser ? '✅ Logged in' : '❌ Not logged in'}`);
    if (currentUser) {
      addLog(`User ID: ${currentUser.id}`);
      addLog(`Username: ${currentUser.username}`);
    }
    
    const token = getAccessToken();
    addLog(`Access Token: ${token ? '✅ Available' : '❌ Not available'}`);
    
    const refreshToken = localStorage.getItem('aquaticexotica_refresh_token');
    addLog(`Refresh Token: ${refreshToken ? '✅ Available' : '❌ Not available'}`);
    
    addLog('=== End State Check ===');
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '14px' }}>
      <h1>🔧 Django JWT Login Debug</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Configuration:</h3>
        <p>API Base: {import.meta.env.VITE_API_BASE || 'http://localhost:8000'}</p>
        <p>Current User: {currentUser ? `Logged in as ${currentUser.username}` : 'Not logged in'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Test Login:</h3>
        <div style={{ marginBottom: '10px' }}>
          <label>Email: </label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '300px', padding: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Password: </label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '300px', padding: '5px' }}
          />
        </div>
        <button 
          onClick={handleLogin} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Logging in...' : 'Test Login'}
        </button>
        
        <button 
          onClick={checkCurrentState}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer',
            marginLeft: '10px'
          }}
        >
          Check State
        </button>
        
        <button 
          onClick={clearLogs}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#6c757d', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer',
            marginLeft: '10px'
          }}
        >
          Clear Logs
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        border: '1px solid #dee2e6', 
        borderRadius: '5px', 
        padding: '15px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        <h3>Debug Logs:</h3>
        {logs.length === 0 ? (
          <p style={{ color: '#6c757d' }}>No logs yet. Try logging in or checking state.</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '5px', whiteSpace: 'pre-wrap' }}>
              {log}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '5px' }}>
        <h3>🔍 Troubleshooting Tips:</h3>
        <ul>
          <li>Make sure your Django backend is running on the correct port</li>
          <li>Check that the login endpoint is accessible at <code>/api/auth/login</code></li>
          <li>Verify your Django credentials are correct</li>
          <li>Check the browser console for additional error details</li>
          <li>Ensure CORS is properly configured on your Django backend</li>
        </ul>
      </div>
    </div>
  );
} 