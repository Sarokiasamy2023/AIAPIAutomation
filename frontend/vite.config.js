import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Listen on all network interfaces for network access
    port: 5000,       // Port 5000 to match VM hostname configuration
    strictPort: true,
    allowedHosts: [
      'ehb-omsbxas-t01.ehbsbx.work',  // VM hostname
      'localhost',                     // Local development
      '.ehbsbx.work'                   // Allow all subdomains in the domain
    ]
  }
})
