import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { TestApp } from './test-app';

// Use an IIFE to ensure proper initialization
(function() {
  console.log('Test main initializing');
  console.log('React version:', React.version);
  
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error('Root element not found');
      return;
    }
    
    console.log('Creating root');
    const root = ReactDOM.createRoot(rootElement);
    
    console.log('Rendering test app');
    root.render(
      <React.StrictMode>
        <TestApp />
      </React.StrictMode>
    );
    
    console.log('Render complete');
  } catch (error) {
    console.error('Error initializing React application:', error);
  }
})();