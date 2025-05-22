import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

// Simple test application with no dependencies on other components
function TestApp() {
  const [count, setCount] = useState(0);
  
  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      maxWidth: '600px', 
      margin: '0 auto', 
      padding: '20px' 
    }}>
      <h1>React Test Application</h1>
      <p>This is a standalone React application to test basic functionality.</p>
      
      <div style={{ 
        border: '1px solid #ddd', 
        padding: '20px', 
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
        marginTop: '20px'
      }}>
        <h2>Counter Component</h2>
        <p>Current count: {count}</p>
        <button 
          onClick={() => setCount(count + 1)}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Increment
        </button>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h2>React Information</h2>
        <p>React Version: {React.version}</p>
        <p>Environment: {process.env.NODE_ENV}</p>
      </div>
    </div>
  );
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Create a new div for our test app
  const testRoot = document.createElement('div');
  testRoot.id = 'test-root';
  document.body.appendChild(testRoot);
  
  try {
    // Render our test app
    const root = createRoot(testRoot);
    root.render(<TestApp />);
    console.log('Test application rendered successfully');
  } catch (error) {
    console.error('Failed to render test application:', error);
    testRoot.innerHTML = `
      <div style="color: red; padding: 20px;">
        <h1>Error Rendering React</h1>
        <p>${error instanceof Error ? error.message : String(error)}</p>
        <p>See console for more details.</p>
      </div>
    `;
  }
});