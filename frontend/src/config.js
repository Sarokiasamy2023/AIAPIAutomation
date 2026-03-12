// API Configuration
// Automatically detects if running on server or localhost
const getApiBase = () => {
  // If frontend is running on server, use server backend
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Use the same hostname as frontend but port 8000
    return `http://${window.location.hostname}:8000`;
  }
  // Default to localhost for local development
  return 'http://localhost:8000';
};

export const API_BASE = getApiBase();

// Log the API base for debugging
console.log('API Base URL:', API_BASE);
