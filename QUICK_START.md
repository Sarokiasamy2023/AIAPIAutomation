# Quick Start Guide - AI API Automation Platform

## One-Command Startup (Network Ready)

Simply run:
```bash
start.bat
```

That's it! The script automatically handles all network configuration.

---

## What `start.bat` Does Automatically

### ✅ **Step 1: Process Cleanup**
- Kills any existing Python/Node processes
- Ensures clean startup

### ✅ **Step 2: Firewall Configuration**
- Automatically creates Windows Firewall rules for:
  - Port 5000 (Frontend)
  - Port 8000 (Backend)
- If not running as Administrator, provides instructions

### ✅ **Step 3: Network Detection**
- Detects your VM's IP address
- Displays all access URLs (local, network, hostname)

### ✅ **Step 4: Backend Startup**
- Activates Python virtual environment
- Starts backend on `0.0.0.0:8000` (all network interfaces)
- Enables CORS for network access

### ✅ **Step 5: Frontend Startup**
- Starts frontend on `0.0.0.0:5000` (all network interfaces)
- Automatically connects to backend

---

## Access URLs

After running `start.bat`, you'll see:

### **Local Access (on the VM):**
- Frontend: http://localhost:5000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### **Network Access (from other machines):**
- Frontend: http://YOUR-VM-IP:5000
- Backend: http://YOUR-VM-IP:8000
- API Docs: http://YOUR-VM-IP:8000/docs

### **VM Hostname Access:**
- Frontend: http://ehb-omsbxas-t01.ehbsbx.work:5000
- Backend: http://ehb-omsbxas-t01.ehbsbx.work:8000
- API Docs: http://ehb-omsbxas-t01.ehbsbx.work:8000/docs

---

## First Time Setup

### 1. Install Prerequisites
- Python 3.9+
- Node.js 18+
- Git

### 2. Run Setup (One Time Only)
```bash
setup.bat
```

This installs all dependencies.

### 3. Configure Environment Variables
Edit `backend\.env` with your credentials:
```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
```

### 4. Start the Application
```bash
start.bat
```

---

## Running as Administrator (Recommended)

For automatic firewall configuration, right-click `start.bat` and select **"Run as Administrator"**.

If not running as admin:
- The script will notify you
- Firewall rules can be created manually (instructions provided)
- Or run the script as admin next time

---

## Stopping the Application

Two windows will open:
- **GS API Backend - DO NOT CLOSE**
- **GS API Frontend - DO NOT CLOSE**

To stop the application:
1. Close both windows, or
2. Press `Ctrl+C` in each window

---

## Troubleshooting

### Firewall Warning
**Issue:** "Could not create firewall rule (requires admin rights)"

**Solution:** Right-click `start.bat` → Run as Administrator

### Port Already in Use
**Issue:** "Address already in use"

**Solution:** 
- Close existing server windows
- Or run `start.bat` again (it kills existing processes automatically)

### Cannot Access from Network
**Issue:** Other machines can't access the application

**Solution:**
1. Verify firewall rules are created (run as admin)
2. Check VM IP address matches what you're using
3. Ensure both machines are on the same network

---

## Network Configuration Summary

The application is **pre-configured** for network access:

| Component | Configuration | Status |
|-----------|--------------|--------|
| Backend CORS | `allow_origins=["*"]` | ✓ Enabled |
| Backend Host | `0.0.0.0:8000` | ✓ All interfaces |
| Frontend Host | `0.0.0.0:5000` | ✓ All interfaces |
| Firewall | Ports 5000, 8000 | ✓ Auto-configured |
| API Detection | Dynamic hostname | ✓ Automatic |

**No manual configuration needed!**

---

## Advanced Usage

### View Logs
Check the PowerShell windows for real-time logs:
- Backend window shows API requests and errors
- Frontend window shows Vite dev server output

### Update Code from Git
```bash
git pull origin main
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt --upgrade
cd ..\frontend
npm install
```

Then restart with `start.bat`

### Production Deployment
For production, see `DEPLOYMENT_GUIDE.md` for:
- Systemd services (Linux)
- Nginx reverse proxy
- SSL/TLS configuration

---

## File Structure

```
AI API Automation/
├── start.bat              ← Run this to start (network ready)
├── setup.bat              ← Run once to install dependencies
├── backend/
│   ├── .env              ← Configure your credentials here
│   ├── main.py           ← Backend API (auto-configured for network)
│   └── venv/             ← Python virtual environment
├── frontend/
│   ├── vite.config.js    ← Port 5000, host 0.0.0.0
│   └── src/
│       └── App.jsx       ← Auto-detects hostname
└── Documentation/
    ├── QUICK_START.md         ← This file
    ├── DEPLOYMENT_GUIDE.md    ← Full deployment guide
    ├── NETWORK_SETUP.md       ← Network configuration details
    └── VM_HOSTNAME_SETUP.md   ← VM-specific setup
```

---

## Support

For detailed information, see:
- **Network Setup**: `NETWORK_SETUP.md`
- **VM Hostname**: `VM_HOSTNAME_SETUP.md`
- **Full Deployment**: `DEPLOYMENT_GUIDE.md`

---

## Summary

**To start the application with full network access:**
```bash
start.bat
```

**Access from anywhere on the network:**
```
http://ehb-omsbxas-t01.ehbsbx.work:5000
```

**Everything is pre-configured. No extra steps needed!**
