# AI API Automation Platform - Deployment Guide

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Prerequisites Installation](#prerequisites-installation)
3. [Project Setup](#project-setup)
4. [Backend Configuration](#backend-configuration)
5. [Frontend Configuration](#frontend-configuration)
6. [Database Setup](#database-setup)
7. [Running the Application](#running-the-application)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Hardware Requirements
- **CPU**: 2 cores (4 cores recommended)
- **RAM**: 4 GB (8 GB recommended)
- **Storage**: 10 GB free space
- **Network**: Internet connectivity for package downloads and API calls

### Supported Operating Systems
- Windows Server 2016 or later
- Windows 10/11
- Ubuntu 20.04 LTS or later
- CentOS 7 or later
- Red Hat Enterprise Linux 8 or later

---

## Prerequisites Installation

### 1. Install Python 3.9+

#### Windows
```powershell
# Download Python from https://www.python.org/downloads/
# During installation, check "Add Python to PATH"

# Verify installation
python --version
pip --version
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3.9 python3.9-venv python3-pip -y

# CentOS/RHEL
sudo yum install python39 python39-pip -y

# Verify installation
python3 --version
pip3 --version
```

### 2. Install Node.js 18+ and npm

#### Windows
```powershell
# Download from https://nodejs.org/
# Install LTS version

# Verify installation
node --version
npm --version
```

#### Linux
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install Git

#### Windows
```powershell
# Download from https://git-scm.com/download/win
# Install with default settings

# Verify installation
git --version
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt install git -y

# CentOS/RHEL
sudo yum install git -y

# Verify installation
git --version
```

---

## Project Setup

### 1. Clone or Copy the Project

#### Option A: Clone from Repository
```bash
git clone <repository-url>
cd AI\ API\ Automation
```

#### Option B: Copy Files to VM
```bash
# Create project directory
mkdir -p /opt/ai-api-automation
cd /opt/ai-api-automation

# Copy project files using SCP, FTP, or shared folder
# Example using SCP:
scp -r /path/to/project/* user@vm-ip:/opt/ai-api-automation/
```

### 2. Set Proper Permissions (Linux only)
```bash
# Set ownership
sudo chown -R $USER:$USER /opt/ai-api-automation

# Set permissions
chmod -R 755 /opt/ai-api-automation
```

---

## Backend Configuration

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Create Python Virtual Environment

#### Windows
```powershell
python -m venv venv
.\venv\Scripts\activate
```

#### Linux
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Python Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
# Copy the example file
cp .env.example .env

# Edit the .env file with your configuration
nano .env  # or use vim, vi, or any text editor
```

#### Required Environment Variables

```env
# Azure OpenAI Configuration (Required for AI scenario generation)
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_API_KEY=your_api_key_here
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

# Email Configuration (Required for email reports)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SENDER_EMAIL=your-email@gmail.com
SENDER_NAME=API Test Platform

# Azure DevOps Configuration (Required for bug tracking)
AZURE_DEVOPS_ORG=your-organization-name
AZURE_DEVOPS_COLLECTION=DefaultCollection
AZURE_DEVOPS_PROJECT=your-project-name
AZURE_DEVOPS_PAT=your-personal-access-token
AZURE_DEVOPS_BASE_URL=https://dev.azure.com  # or your on-premises URL
```

#### How to Obtain Configuration Values

**Azure OpenAI:**
1. Go to Azure Portal (https://portal.azure.com)
2. Navigate to your Azure OpenAI resource
3. Copy the endpoint URL and API key from "Keys and Endpoint" section
4. Note your deployment name from "Model deployments"

**Email (Gmail example):**
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the generated password in `SMTP_PASSWORD`

**Azure DevOps:**
1. Go to Azure DevOps (https://dev.azure.com)
2. Navigate to User Settings > Personal Access Tokens
3. Create a new token with "Work Items (Read, Write)" permissions
4. Copy the token to `AZURE_DEVOPS_PAT`

### 5. Initialize Database

The application uses SQLite by default. The database file will be created automatically on first run.

```bash
# Database file location: backend/test_automation.db
# No manual initialization required
```

---

## Frontend Configuration

### 1. Navigate to Frontend Directory
```bash
cd ../frontend
```

### 2. Install Node.js Dependencies
```bash
npm install
```

### 3. Configure API Endpoint

Edit `frontend/src/App.jsx` to set the backend API URL:

```javascript
// For development (default)
const API_BASE = 'http://localhost:8000'

// For production, update to your VM's IP or domain
const API_BASE = 'http://your-vm-ip:8000'
// or
const API_BASE = 'https://your-domain.com/api'
```

### 4. Build Frontend for Production
```bash
npm run build
```

This creates an optimized production build in the `dist` directory.

---

## Running the Application

### Development Mode

#### Terminal 1 - Start Backend
```bash
cd backend
source venv/bin/activate  # Windows: .\venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### Terminal 2 - Start Frontend
```bash
cd frontend
npm run dev
```

Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Network Access Configuration

The application is configured to be accessible from any machine on the network. Here's how to access it:

#### Find Your VM's IP Address

**Windows:**
```powershell
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

**Linux:**
```bash
ip addr show
# or
hostname -I
# Look for the IP address (e.g., 192.168.1.100)
```

#### Access from Network Machines

Once the application is running on the VM, users on the same network can access it using:

- **Frontend**: `http://<VM-IP-ADDRESS>:5173` (development) or `http://<VM-IP-ADDRESS>` (production with Nginx)
- **Backend API**: `http://<VM-IP-ADDRESS>:8000`
- **API Documentation**: `http://<VM-IP-ADDRESS>:8000/docs`

**Example:**
If your VM's IP is `192.168.1.100`:
- Frontend: `http://192.168.1.100:5173`
- Backend: `http://192.168.1.100:8000`

#### Important Notes

1. **Firewall Configuration**: Ensure ports 8000 and 5173 (or 80 for production) are open in the VM's firewall
2. **CORS**: The backend is configured with `allow_origins=["*"]` to accept requests from any network client
3. **Host Binding**: The backend runs on `0.0.0.0:8000` to listen on all network interfaces
4. **Dynamic API URL**: The frontend automatically detects the hostname and connects to the backend on the same IP

#### Development Mode Network Access

When running in development mode with `npm run dev`, you need to configure Vite to accept network connections:

**Option 1: Command Line**
```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

**Option 2: Update vite.config.js**

Create or update `frontend/vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Listen on all network interfaces
    port: 5173,
    strictPort: true
  }
})
```

Then run normally:
```bash
npm run dev
```

### Production Mode

#### Option 1: Using Provided Batch Script (Windows)

```powershell
# Edit setup.bat to ensure correct paths
.\setup.bat
```

#### Option 2: Manual Production Setup

**Backend (using Uvicorn):**
```bash
cd backend
source venv/bin/activate

# Run with production settings
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Frontend (using a web server):**

The frontend build needs to be served by a web server.

##### Option A: Using Python HTTP Server (Simple)
```bash
cd frontend/dist
python -m http.server 5173
```

##### Option B: Using Nginx (Recommended)

Install Nginx:
```bash
# Ubuntu/Debian
sudo apt install nginx -y

# CentOS/RHEL
sudo yum install nginx -y
```

Configure Nginx:
```bash
sudo nano /etc/nginx/sites-available/ai-api-automation
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # or VM IP

    # Frontend
    location / {
        root /opt/ai-api-automation/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable and start Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/ai-api-automation /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Production Deployment

### 1. Create Systemd Services (Linux)

#### Backend Service

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

### 2. Configure Firewall

#### Windows
```powershell
# Allow ports 80 (HTTP) and 8000 (Backend)
New-NetFirewallRule -DisplayName "AI API Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
```

#### Linux (UFW)
```bash
sudo ufw allow 80/tcp
sudo ufw allow 8000/tcp
sudo ufw enable
sudo ufw status
```

#### Linux (firewalld)
```bash
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload
```

### 3. Set Up SSL/TLS (Optional but Recommended)

#### Using Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

---

## Database Management

### Backup Database

```bash
# Create backup directory
mkdir -p /opt/ai-api-automation/backups

# Backup SQLite database
cp /opt/ai-api-automation/backend/test_automation.db \
   /opt/ai-api-automation/backups/test_automation_$(date +%Y%m%d_%H%M%S).db
```

### Restore Database

```bash
# Stop backend service
sudo systemctl stop ai-api-backend

# Restore from backup
cp /opt/ai-api-automation/backups/test_automation_YYYYMMDD_HHMMSS.db \
   /opt/ai-api-automation/backend/test_automation.db

# Start backend service
sudo systemctl start ai-api-backend
```

### Automated Backup Script

Create `/opt/ai-api-automation/scripts/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/ai-api-automation/backups"
DB_FILE="/opt/ai-api-automation/backend/test_automation.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup
cp "$DB_FILE" "$BACKUP_DIR/test_automation_$TIMESTAMP.db"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "test_automation_*.db" -mtime +30 -delete

echo "Backup completed: test_automation_$TIMESTAMP.db"
```

Make executable and schedule:
```bash
chmod +x /opt/ai-api-automation/scripts/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /opt/ai-api-automation/scripts/backup.sh
```

---

## Monitoring and Logs

### View Backend Logs

#### Using systemd (Linux)
```bash
# View recent logs
sudo journalctl -u ai-api-backend -n 100

# Follow logs in real-time
sudo journalctl -u ai-api-backend -f

# View logs for specific date
sudo journalctl -u ai-api-backend --since "2026-03-12"
```

#### Manual Log Files
```bash
# If running manually, redirect output to log file
uvicorn main:app --host 0.0.0.0 --port 8000 >> /var/log/ai-api-backend.log 2>&1
```

### Monitor System Resources

```bash
# Check CPU and memory usage
htop

# Check disk space
df -h

# Check running processes
ps aux | grep uvicorn
ps aux | grep nginx
```

---

## Troubleshooting

### Backend Won't Start

**Issue**: ModuleNotFoundError or ImportError
```bash
# Solution: Ensure virtual environment is activated and dependencies installed
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

**Issue**: Port 8000 already in use
```bash
# Solution: Find and kill process using port 8000
# Linux
sudo lsof -i :8000
sudo kill -9 <PID>

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Issue**: Database locked error
```bash
# Solution: Ensure only one backend instance is running
ps aux | grep uvicorn
sudo systemctl status ai-api-backend
```

### Frontend Build Issues

**Issue**: npm install fails
```bash
# Solution: Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Issue**: Build fails with memory error
```bash
# Solution: Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### API Connection Issues

**Issue**: Frontend can't connect to backend
```bash
# Solution 1: Check backend is running
curl http://localhost:8000/docs

# Solution 2: Update API_BASE in frontend/src/App.jsx
# Ensure it points to correct backend URL

# Solution 3: Check firewall rules
sudo ufw status
```

**Issue**: CORS errors in browser console
```bash
# Solution: Backend already has CORS configured in main.py
# Verify the frontend URL is allowed in CORS origins
# Check main.py for app.add_middleware(CORSMiddleware, ...)
```

### Azure OpenAI Issues

**Issue**: "Invalid API key" error
```bash
# Solution: Verify .env file has correct credentials
cat backend/.env | grep AZURE_OPENAI

# Test API key manually
curl https://your-resource.openai.azure.com/openai/deployments?api-version=2024-02-15-preview \
  -H "api-key: YOUR_API_KEY"
```

**Issue**: "Deployment not found" error
```bash
# Solution: Verify deployment name matches Azure portal
# Check AZURE_OPENAI_DEPLOYMENT_NAME in .env
```

### Email Service Issues

**Issue**: Email not sending
```bash
# Solution 1: Check SMTP credentials in .env
# Solution 2: For Gmail, ensure App Password is used (not regular password)
# Solution 3: Check firewall allows outbound SMTP (port 587)
```

### Permission Issues (Linux)

```bash
# Fix file permissions
sudo chown -R $USER:$USER /opt/ai-api-automation
chmod -R 755 /opt/ai-api-automation

# Fix database permissions
chmod 644 /opt/ai-api-automation/backend/test_automation.db
```

---

## Security Best Practices

### 1. Environment Variables
- Never commit `.env` file to version control
- Use strong, unique passwords and API keys
- Rotate credentials regularly

### 2. Network Security
- Use HTTPS in production (SSL/TLS)
- Configure firewall to allow only necessary ports
- Use VPN or IP whitelisting for admin access

### 3. Application Security
- Keep dependencies updated: `pip list --outdated`, `npm outdated`
- Run security audits: `npm audit`, `pip-audit`
- Implement rate limiting for API endpoints

### 4. Database Security
- Regular backups (automated)
- Restrict database file permissions (chmod 600)
- Consider encryption at rest for sensitive data

---

## Performance Optimization

### Backend Optimization

```bash
# Use multiple workers based on CPU cores
# Formula: (2 x CPU cores) + 1
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# Enable production mode (disable reload)
uvicorn main:app --host 0.0.0.0 --port 8000 --no-access-log
```

### Frontend Optimization

```bash
# Build with production optimizations
npm run build

# Serve with gzip compression (Nginx)
# Add to nginx config:
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

### Database Optimization

```bash
# Vacuum database to reclaim space
sqlite3 test_automation.db "VACUUM;"

# Analyze database for query optimization
sqlite3 test_automation.db "ANALYZE;"
```

---

## Updating the Application

### Update Backend

```bash
cd backend
source venv/bin/activate

# Pull latest code
git pull origin main

# Update dependencies
pip install -r requirements.txt --upgrade

# Restart service
sudo systemctl restart ai-api-backend
```

### Update Frontend

```bash
cd frontend

# Pull latest code
git pull origin main

# Update dependencies
npm install

# Rebuild
npm run build

# Restart web server
sudo systemctl restart nginx
```

---

## Support and Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor application logs for errors
- Check system resource usage

**Weekly:**
- Review database size and performance
- Check for security updates

**Monthly:**
- Update dependencies
- Review and rotate credentials
- Test backup restoration

### Health Check Endpoints

```bash
# Check backend health
curl http://localhost:8000/docs

# Check database connectivity
curl http://localhost:8000/api/mappings

# Check frontend
curl http://localhost:80
```

---

## Quick Reference Commands

### Start Services
```bash
# Backend
cd backend && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend (dev)
cd frontend && npm run dev

# Frontend (production)
sudo systemctl start nginx
```

### Stop Services
```bash
# Backend
sudo systemctl stop ai-api-backend

# Frontend
sudo systemctl stop nginx
```

### View Logs
```bash
# Backend
sudo journalctl -u ai-api-backend -f

# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Backup
```bash
# Database
cp backend/test_automation.db backups/test_automation_$(date +%Y%m%d).db

# Configuration
cp backend/.env backups/.env_$(date +%Y%m%d)
```

---

## Conclusion

This deployment guide covers the complete setup process for the AI API Automation Platform on a virtual machine. For additional support or questions, refer to the project documentation or contact the development team.

**Important URLs:**
- Frontend: http://your-vm-ip or https://your-domain.com
- Backend API: http://your-vm-ip:8000
- API Documentation: http://your-vm-ip:8000/docs

**Default Credentials:**
- No default credentials - configure via .env file

**Support:**
- Check logs first for error details
- Review troubleshooting section
- Verify all environment variables are set correctly
