// API Configuration - Auto-detects the correct server URL
// This works for both localhost development and production deployment

(function() {
  // Get the current hostname and protocol
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  let API_BASE_URL;
  
  // For localhost development - use http://localhost:5000
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    API_BASE_URL = 'http://localhost:5000';
  } 
  // For Render or other production deployments - use same protocol, no port
  else if (hostname.includes('onrender.com') || hostname.includes('herokuapp.com')) {
    API_BASE_URL = `${protocol}//${hostname}`;
  }
  // For local network IP (e.g., 192.168.x.x)
  else {
    API_BASE_URL = `http://${hostname}:5000`;
  }
  
  // Make it globally available
  window.API_BASE_URL = API_BASE_URL;
  window.API_BASE = API_BASE_URL; // Alternative name for compatibility
  
  console.log('🌐 API Base URL:', API_BASE_URL);
})();
