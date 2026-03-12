// API Configuration - Dynamic hostname detection for network access
// Automatically detects whether running locally or on network/VM

const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:8000' 
  : `http://${window.location.hostname}:8000`

export default API_BASE
