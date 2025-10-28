// API Configuration - Auto-detects the correct server URL
// This works for both localhost development and network hosting

(function() {
  // Get the current hostname
  const hostname = window.location.hostname;
  const port = 5000;
  
  // If accessing via network IP (not localhost), use that IP
  // Otherwise use localhost for local development
  let API_BASE_URL;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    API_BASE_URL = `http://localhost:${port}`;
  } else {
    API_BASE_URL = `http://${hostname}:${port}`;
  }
  
  // Make it globally available
  window.API_BASE_URL = API_BASE_URL;
  window.API_BASE = API_BASE_URL; // Alternative name for compatibility
  
  console.log('🌐 API Base URL:', API_BASE_URL);
})();
