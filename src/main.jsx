import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '@ionic/react/css/core.css';
import './theme/variable.css';
import './index.css';

console.log('[main.jsx] Starting app initialization...');
console.log('[main.jsx] React version:', React.version);
console.log('[main.jsx] Environment:', import.meta.env.MODE);

try {
  const rootElement = document.getElementById('root');
  console.log('[main.jsx] Root element found:', !!rootElement);
  
  if (!rootElement) {
    throw new Error('Root element not found!');
  }
  
  console.log('[main.jsx] Creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  
  console.log('[main.jsx] Rendering App...');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('[main.jsx] App rendered successfully');
} catch (error) {
  console.error('[main.jsx] FATAL ERROR during initialization:', error);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;padding:20px;background:#fff">
        <div style="max-width:600px;text-align:center;padding:20px;border:2px solid #EF4444;border-radius:8px">
          <h2 style="color:#EF4444;margin:0 0 10px">❌ App Failed to Load</h2>
          <p style="margin:0 0 15px;color:#666">An error occurred during initialization:</p>
          <pre style="background:#f5f5f5;padding:10px;border-radius:4px;text-align:left;overflow:auto;font-size:12px">${error.message}\n\n${error.stack || ''}</pre>
          <button onclick="window.location.reload()" style="margin-top:15px;padding:10px 20px;background:#00D68F;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px">🔄 Reload Page</button>
        </div>
      </div>
    `;
  }
}

window.addEventListener('error', (event) => {
  console.error('[main.jsx] Global error caught:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[main.jsx] Unhandled promise rejection:', event.reason);
});
