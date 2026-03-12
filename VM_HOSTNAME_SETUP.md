# VM Hostname Configuration Guide

## Overview

This guide explains how to configure the AI API Automation Platform to work with your VM hostname: **ehb-omsbxas-t01.ehbsbx.work**

---

## Architecture

The application uses a **two-port architecture**:

- **Frontend (Port 5000)**: User interface accessible at `http://ehb-omsbxas-t01.ehbsbx.work:5000`
- **Backend (Port 8000)**: API server accessible at `http://ehb-omsbxas-t01.ehbsbx.work:8000`

The frontend automatically detects the hostname and connects to the backend on port 8000.

---

## Quick Start

### 1. Start Backend (Port 8000)

**Windows:**
```powershell
cd "C:\Test Automation\AI API Automation\backend"
.\venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Linux:**
```bash
cd /opt/ai-api-automation/backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2. Start Frontend (Port 5000)

**Windows:**
```powershell
cd "C:\Test Automation\AI API Automation\frontend"
npm run dev
```

**Linux:**
```bash
cd /opt/ai-api-automation/frontend
npm run dev
```

### 3. Access the Application

From any machine on the network:

- **Frontend**: http://ehb-omsbxas-t01.ehbsbx.work:5000
- **Backend API**: http://ehb-omsbxas-t01.ehbsbx.work:8000
- **API Documentation**: http://ehb-omsbxas-t01.ehbsbx.work:8000/docs

---

## Configuration Details

### Frontend Configuration

**File: `frontend/vite.config.js`**
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Listen on all network interfaces
    port: 5000,       // Frontend port
    strictPort: true
  }
})
```

**File: `frontend/src/App.jsx`**
```javascript
// Automatically detects hostname and connects to backend
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:8000' 
  : `http://${window.location.hostname}:8000`
```

**How it works:**
- When accessed via `http://ehb-omsbxas-t01.ehbsbx.work:5000`, the frontend automatically connects to `http://ehb-omsbxas-t01.ehbsbx.work:8000`
- When accessed via `http://localhost:5000`, the frontend connects to `http://localhost:8000`
- No manual configuration needed!

### Backend Configuration

**File: `backend/main.py`**
```python
# CORS allows all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Runs on all network interfaces, port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## Firewall Configuration

### Windows VM

Open PowerShell as Administrator:

```powershell
# Allow Frontend (port 5000)
New-NetFirewallRule -DisplayName "AI API Frontend" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow

# Allow Backend (port 8000)
New-NetFirewallRule -DisplayName "AI API Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow

# Verify rules
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*AI API*"}
```

### Linux VM (UFW)

```bash
# Allow Frontend
sudo ufw allow 5000/tcp

# Allow Backend
sudo ufw allow 8000/tcp

# Enable and check status
sudo ufw enable
sudo ufw status
```

### Linux VM (firewalld)

```bash
# Allow Frontend
sudo firewall-cmd --permanent --add-port=5000/tcp

# Allow Backend
sudo firewall-cmd --permanent --add-port=8000/tcp

# Reload and check
sudo firewall-cmd --reload
sudo firewall-cmd --list-all
```

---

## DNS/Hostname Verification

### Verify Hostname Resolution

From a client machine on the network:

**Windows:**
```powershell
nslookup ehb-omsbxas-t01.ehbsbx.work
ping ehb-omsbxas-t01.ehbsbx.work
```

**Linux:**
```bash
nslookup ehb-omsbxas-t01.ehbsbx.work
ping ehb-omsbxas-t01.ehbsbx.work
```

Expected result: Should resolve to the VM's IP address.

### If Hostname Doesn't Resolve

If the hostname doesn't resolve, you have two options:

**Option 1: Use IP Address Instead**
```
http://<VM-IP-ADDRESS>:5000
http://<VM-IP-ADDRESS>:8000
```

**Option 2: Add to Hosts File (Client Machines)**

**Windows** (`C:\Windows\System32\drivers\etc\hosts`):
```
<VM-IP-ADDRESS>  ehb-omsbxas-t01.ehbsbx.work
```

**Linux** (`/etc/hosts`):
```
<VM-IP-ADDRESS>  ehb-omsbxas-t01.ehbsbx.work
```

---

## Production Deployment with Systemd (Linux)

### Backend Service

Create `/etc/systemd/system/ai-api-backend.service`:

```ini
[Unit]
Description=AI API Automation Backend
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/opt/ai-api-automation/backend
Environment="PATH=/opt/ai-api-automation/backend/venv/bin"
ExecStart=/opt/ai-api-automation/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable ai-api-backend
sudo systemctl start ai-api-backend
sudo systemctl status ai-api-backend
```

### Frontend Service

Create `/etc/systemd/system/ai-api-frontend.service`:

```ini
[Unit]
Description=AI API Automation Frontend
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/opt/ai-api-automation/frontend
Environment="PATH=/usr/bin:/usr/local/bin"
ExecStart=/usr/bin/npm run dev
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable ai-api-frontend
sudo systemctl start ai-api-frontend
sudo systemctl status ai-api-frontend
```

---

## Production Deployment with Nginx (Recommended)

For production, use Nginx as a reverse proxy to serve both frontend and backend on standard ports.

### Install Nginx

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install nginx -y
```

**CentOS/RHEL:**
```bash
sudo yum install nginx -y
```

### Configure Nginx

Create `/etc/nginx/sites-available/ai-api-automation`:

```nginx
server {
    listen 80;
    server_name ehb-omsbxas-t01.ehbsbx.work;

    # Frontend - serve built static files
    location / {
        root /opt/ai-api-automation/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API - proxy to port 8000
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support (if needed)
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_header_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable and start:
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/ai-api-automation /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Build Frontend for Production

```bash
cd /opt/ai-api-automation/frontend
npm run build
```

### Access with Nginx

- **Frontend**: http://ehb-omsbxas-t01.ehbsbx.work (port 80)
- **Backend API**: http://ehb-omsbxas-t01.ehbsbx.work/api
- **API Docs**: http://ehb-omsbxas-t01.ehbsbx.work:8000/docs

---

## Testing the Configuration

### 1. Test Backend

From the VM:
```bash
curl http://localhost:8000/docs
```

From a network machine:
```bash
curl http://ehb-omsbxas-t01.ehbsbx.work:8000/docs
```

Expected: HTML response with API documentation.

### 2. Test Frontend

From a network machine, open a web browser:
```
http://ehb-omsbxas-t01.ehbsbx.work:5000
```

Expected: Application interface loads.

### 3. Test API Connection

1. Open browser to: http://ehb-omsbxas-t01.ehbsbx.work:5000
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Look for API requests - should show:
   ```
   Fetching endpoints from: http://ehb-omsbxas-t01.ehbsbx.work:8000/api/endpoints
   ```

---

## Troubleshooting

### Issue: Cannot Access via Hostname

**Symptom:** `http://ehb-omsbxas-t01.ehbsbx.work:5000` doesn't load

**Solutions:**

1. **Verify hostname resolves:**
   ```bash
   ping ehb-omsbxas-t01.ehbsbx.work
   ```

2. **Check if services are running:**
   ```bash
   # Check backend
   curl http://localhost:8000/docs
   
   # Check frontend
   curl http://localhost:5000
   ```

3. **Verify firewall:**
   ```bash
   # Linux
   sudo ufw status
   
   # Windows
   Get-NetFirewallRule | Where-Object {$_.LocalPort -eq 5000 -or $_.LocalPort -eq 8000}
   ```

4. **Check port binding:**
   ```bash
   # Linux
   sudo netstat -tulpn | grep -E ':(5000|8000)'
   
   # Windows
   netstat -an | findstr -E ":(5000|8000)"
   ```
   
   Should show `0.0.0.0:5000` and `0.0.0.0:8000`, not `127.0.0.1`.

### Issue: Frontend Loads but Can't Connect to Backend

**Symptom:** Frontend page loads, but API calls fail

**Solutions:**

1. **Check browser console (F12):**
   - Look for CORS errors
   - Verify API URL being used

2. **Verify backend CORS settings:**
   ```python
   # In backend/main.py, should be:
   allow_origins=["*"]
   ```

3. **Test backend directly:**
   ```
   http://ehb-omsbxas-t01.ehbsbx.work:8000/docs
   ```

4. **Clear browser cache:**
   ```
   Ctrl + Shift + R (Windows/Linux)
   Cmd + Shift + R (Mac)
   ```

### Issue: Port Already in Use

**Symptom:** Error when starting: "Address already in use"

**Solutions:**

**Windows:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000
# Kill process
taskkill /PID <PID> /F

# Find process using port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Linux:**
```bash
# Find and kill process on port 5000
sudo lsof -ti:5000 | xargs kill -9

# Find and kill process on port 8000
sudo lsof -ti:8000 | xargs kill -9
```

---

## Environment-Specific Configuration

### Development Environment

```bash
# Backend
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Frontend
cd frontend
npm run dev
```

Access: http://ehb-omsbxas-t01.ehbsbx.work:5000

### Production Environment

```bash
# Backend (with systemd)
sudo systemctl start ai-api-backend

# Frontend (with Nginx)
cd frontend
npm run build
sudo systemctl start nginx
```

Access: http://ehb-omsbxas-t01.ehbsbx.work

---

## Security Considerations

### Internal Network Deployment

Current configuration is suitable for internal network use:
- CORS allows all origins
- No authentication required
- HTTP (not HTTPS)

**Recommendations:**
- Keep VM behind corporate firewall
- Do not expose directly to internet
- Use VPN for remote access

### Internet-Facing Deployment

If exposing to internet, implement:

1. **HTTPS/SSL:**
   ```bash
   sudo certbot --nginx -d ehb-omsbxas-t01.ehbsbx.work
   ```

2. **Restrict CORS:**
   ```python
   # In backend/main.py
   allow_origins=["http://ehb-omsbxas-t01.ehbsbx.work"]
   ```

3. **Add Authentication:**
   - Implement user login
   - Use API keys
   - Add rate limiting

---

## Quick Command Reference

### Start Services
```bash
# Backend
cd backend && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend
cd frontend && npm run dev
```

### Stop Services
```bash
# Find and kill processes
pkill -f uvicorn  # Backend
pkill -f vite     # Frontend
```

### Check Status
```bash
# Check if ports are listening
netstat -tulpn | grep -E ':(5000|8000)'

# Check services (if using systemd)
sudo systemctl status ai-api-backend
sudo systemctl status ai-api-frontend
```

### View Logs
```bash
# Backend (systemd)
sudo journalctl -u ai-api-backend -f

# Frontend (systemd)
sudo journalctl -u ai-api-frontend -f

# Manual runs - check terminal output
```

---

## Summary

**Configuration:**
- Frontend: Port 5000 (Vite dev server)
- Backend: Port 8000 (Uvicorn)
- Hostname: ehb-omsbxas-t01.ehbsbx.work

**Access URLs:**
- Frontend: http://ehb-omsbxas-t01.ehbsbx.work:5000
- Backend: http://ehb-omsbxas-t01.ehbsbx.work:8000
- API Docs: http://ehb-omsbxas-t01.ehbsbx.work:8000/docs

**Key Features:**
- Automatic hostname detection
- No manual API URL configuration needed
- Works with both hostname and IP address
- CORS enabled for network access
- Firewall-ready configuration

For additional help, refer to DEPLOYMENT_GUIDE.md and NETWORK_SETUP.md.
