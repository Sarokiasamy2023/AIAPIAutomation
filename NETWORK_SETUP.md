# Network Access Setup Guide

## Quick Start - Accessing the Application from Network

This guide explains how to access the AI API Automation Platform from any machine on your network after deploying it on a virtual machine.

---

## Prerequisites

- Application deployed on a VM (see DEPLOYMENT_GUIDE.md)
- VM and client machines on the same network
- Firewall ports opened (8000, 5173, or 80)

---

## Step 1: Find Your VM's IP Address

### On Windows VM:
```powershell
ipconfig
```
Look for **IPv4 Address** under your active network adapter (e.g., Ethernet or Wi-Fi).

Example output:
```
Ethernet adapter Ethernet:
   IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

### On Linux VM:
```bash
# Option 1
ip addr show

# Option 2
hostname -I

# Option 3
ifconfig
```

Look for the IP address (typically starts with 192.168.x.x or 10.x.x.x for local networks).

---

## Step 2: Access the Application

Once you have the VM's IP address, users on the network can access the application using their web browser.

### Development Mode Access

If running with `npm run dev` and `uvicorn`:

**From any network machine:**
- Frontend: `http://<VM-IP>:5173`
- Backend API: `http://<VM-IP>:8000`
- API Docs: `http://<VM-IP>:8000/docs`

**Example (if VM IP is 192.168.1.100):**
- Frontend: http://192.168.1.100:5173
- Backend API: http://192.168.1.100:8000
- API Docs: http://192.168.1.100:8000/docs

### Production Mode Access (with Nginx)

If running with Nginx on port 80:

**From any network machine:**
- Frontend: `http://<VM-IP>`
- Backend API: `http://<VM-IP>:8000`
- API Docs: `http://<VM-IP>:8000/docs`

**Example (if VM IP is 192.168.1.100):**
- Frontend: http://192.168.1.100
- Backend API: http://192.168.1.100:8000

---

## Step 3: Verify Network Access

### Test Backend Connectivity

From any network machine, open a web browser and navigate to:
```
http://<VM-IP>:8000/docs
```

You should see the FastAPI Swagger documentation page.

### Test Frontend Connectivity

From any network machine, open a web browser and navigate to:
```
http://<VM-IP>:5173
```
(or `http://<VM-IP>` for production)

You should see the AI API Automation Platform interface.

---

## Configuration Details

### Backend Configuration

The backend is already configured for network access:

**File: `backend/main.py`**
```python
# CORS allows all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Accepts requests from any network client
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Server runs on all network interfaces
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)  # 0.0.0.0 = all interfaces
```

### Frontend Configuration

The frontend automatically detects the network hostname:

**File: `frontend/src/App.jsx`**
```javascript
// Dynamically determines API URL based on hostname
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:8000'           // Local development
  : `http://${window.location.hostname}:8000`  // Network access
```

**File: `frontend/vite.config.js`**
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Listens on all network interfaces
    port: 5173,
    strictPort: true
  }
})
```

---

## Firewall Configuration

### Windows VM Firewall

Open PowerShell as Administrator:

```powershell
# Allow Backend (port 8000)
New-NetFirewallRule -DisplayName "AI API Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow

# Allow Frontend Development (port 5173)
New-NetFirewallRule -DisplayName "AI API Frontend Dev" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow

# Allow Frontend Production (port 80) - if using Nginx
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow

# Verify rules
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*AI API*"}
```

### Linux VM Firewall (UFW)

```bash
# Allow Backend
sudo ufw allow 8000/tcp

# Allow Frontend Development
sudo ufw allow 5173/tcp

# Allow Frontend Production (if using Nginx)
sudo ufw allow 80/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Linux VM Firewall (firewalld)

```bash
# Allow Backend
sudo firewall-cmd --permanent --add-port=8000/tcp

# Allow Frontend Development
sudo firewall-cmd --permanent --add-port=5173/tcp

# Allow Frontend Production (if using Nginx)
sudo firewall-cmd --permanent --add-port=80/tcp

# Reload firewall
sudo firewall-cmd --reload

# Check status
sudo firewall-cmd --list-all
```

---

## Running the Application for Network Access

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # Windows: .\venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The `vite.config.js` is already configured with `host: '0.0.0.0'`, so no additional flags are needed.

### Production Mode

**Backend (as a service):**
```bash
sudo systemctl start ai-api-backend
```

**Frontend (with Nginx):**
```bash
sudo systemctl start nginx
```

---

## Troubleshooting

### Issue: Cannot Access from Network

**Check 1: VM IP Address**
```bash
# Verify you're using the correct IP
ip addr show  # Linux
ipconfig      # Windows
```

**Check 2: Services Running**
```bash
# Check backend is running
curl http://localhost:8000/docs

# Check frontend is running
curl http://localhost:5173
```

**Check 3: Firewall**
```bash
# Linux (UFW)
sudo ufw status

# Linux (firewalld)
sudo firewall-cmd --list-all

# Windows
Get-NetFirewallRule | Where-Object {$_.Enabled -eq 'True'}
```

**Check 4: Port Binding**
```bash
# Linux - verify services are listening on 0.0.0.0
sudo netstat -tulpn | grep -E ':(8000|5173|80)'

# Windows
netstat -an | findstr -E ":(8000|5173|80)"
```

Expected output should show `0.0.0.0:8000` and `0.0.0.0:5173`, not `127.0.0.1`.

### Issue: Frontend Loads but Can't Connect to Backend

**Symptom:** Frontend page loads, but API calls fail with CORS or connection errors.

**Solution 1:** Verify backend CORS settings in `backend/main.py`:
```python
allow_origins=["*"]  # Should be ["*"] not ["http://localhost:5000"]
```

**Solution 2:** Check browser console for the API URL being used:
- Press F12 in browser
- Go to Console tab
- Look for API request URLs
- Should be `http://<VM-IP>:8000/api/...`, not `http://localhost:8000/api/...`

**Solution 3:** Clear browser cache and reload:
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### Issue: Connection Refused

**Cause:** Backend not running or not listening on 0.0.0.0

**Solution:**
```bash
# Stop any existing backend process
pkill -f uvicorn  # Linux
# or find and kill process on Windows

# Restart backend with correct host binding
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Issue: Timeout When Accessing from Network

**Cause:** Network firewall or router blocking traffic

**Solution:**
1. Check VM firewall (see Firewall Configuration section)
2. Check network router/switch settings
3. Verify VM and client are on same subnet
4. Try pinging the VM from client machine:
   ```bash
   ping <VM-IP>
   ```

---

## Security Considerations

### For Internal Network Use

If the application is only for internal network use:
- Current configuration is suitable
- Ensure VM is behind a corporate firewall
- Do not expose VM directly to the internet

### For Internet-Facing Deployment

If you need to expose the application to the internet:

1. **Use HTTPS/SSL:**
   - Install SSL certificate (Let's Encrypt)
   - Configure Nginx with SSL
   - Update frontend to use HTTPS

2. **Restrict CORS:**
   - Update `allow_origins` in `backend/main.py` to specific domains
   - Example: `allow_origins=["https://yourdomain.com"]`

3. **Add Authentication:**
   - Implement user authentication
   - Use API keys for backend access
   - Add rate limiting

4. **Use Reverse Proxy:**
   - Configure Nginx to proxy both frontend and backend
   - Hide backend port from external access

---

## Network Access Checklist

Use this checklist to verify network access is properly configured:

- [ ] VM IP address identified
- [ ] Backend running on `0.0.0.0:8000`
- [ ] Frontend running on `0.0.0.0:5173` (or Nginx on port 80)
- [ ] Firewall ports 8000 and 5173 (or 80) opened
- [ ] CORS configured with `allow_origins=["*"]` in backend
- [ ] Frontend `App.jsx` uses dynamic hostname detection
- [ ] Vite config has `host: '0.0.0.0'`
- [ ] Can access `http://<VM-IP>:8000/docs` from network machine
- [ ] Can access `http://<VM-IP>:5173` from network machine
- [ ] API calls work from network machine (check browser console)

---

## Quick Command Reference

### Get VM IP Address
```bash
# Windows
ipconfig | findstr IPv4

# Linux
hostname -I | awk '{print $1}'
```

### Check if Ports are Open
```bash
# Linux
sudo netstat -tulpn | grep -E ':(8000|5173)'

# Windows
netstat -an | findstr -E ":(8000|5173)"
```

### Test Backend from Network Machine
```bash
# Replace <VM-IP> with actual IP
curl http://<VM-IP>:8000/docs
```

### View Backend Logs
```bash
# If running as systemd service
sudo journalctl -u ai-api-backend -f

# If running manually, check terminal output
```

---

## Example Network Setup Scenario

**Scenario:** Deploy on Windows VM (192.168.1.100) for team access

**Steps:**

1. **On VM - Start Backend:**
   ```powershell
   cd "C:\Test Automation\AI API Automation\backend"
   .\venv\Scripts\activate
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

2. **On VM - Start Frontend:**
   ```powershell
   cd "C:\Test Automation\AI API Automation\frontend"
   npm run dev
   ```

3. **On VM - Configure Firewall:**
   ```powershell
   New-NetFirewallRule -DisplayName "AI API Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
   New-NetFirewallRule -DisplayName "AI API Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
   ```

4. **From Team Member's Computer:**
   - Open browser
   - Navigate to: http://192.168.1.100:5173
   - Application loads and connects to backend automatically

**Result:** All team members can access the application using the VM's IP address.

---

## Support

For additional help:
- Review main DEPLOYMENT_GUIDE.md
- Check application logs for errors
- Verify all configuration files match the examples above
- Ensure VM has network connectivity (`ping google.com`)
