# Installing Python Dependencies Globally on Server

## Issue
When running `start.bat` on the server, you may encounter:
```
ModuleNotFoundError: No module named 'sqlalchemy'
```

This happens because the server doesn't use a virtual environment and dependencies need to be installed globally.

## Solution

### Install All Python Dependencies Globally

Run this command in PowerShell as Administrator on the server:

```powershell
cd "Y:\AIAPIAutomation\backend"
pip install -r requirements.txt
```

### Verify Installation

Check that all packages are installed:

```powershell
pip list
```

You should see all these packages:
- fastapi
- uvicorn
- sqlalchemy
- pandas
- openpyxl
- openai
- python-multipart
- python-dotenv
- requests
- jsonschema
- httpx
- apscheduler
- urllib3
- requests-ntlm
- python-dateutil

### If pip is not found

If you get "pip is not recognized", install it:

```powershell
python -m ensurepip --upgrade
python -m pip install --upgrade pip
```

Then run the requirements installation again.

## Alternative: Install Packages One by One

If the requirements.txt installation fails, install each package individually:

```powershell
pip install fastapi==0.115.0
pip install uvicorn==0.32.0
pip install sqlalchemy==2.0.36
pip install pandas==2.2.3
pip install openpyxl==3.1.5
pip install openai==1.12.0
pip install python-multipart==0.0.12
pip install python-dotenv==1.0.0
pip install requests==2.31.0
pip install jsonschema==4.20.0
pip install httpx==0.27.0
pip install apscheduler==3.10.4
pip install urllib3==2.0.7
pip install requests-ntlm==1.2.0
pip install python-dateutil==2.8.2
```

## After Installation

Once all dependencies are installed, run:

```powershell
start.bat
```

The backend should now start without errors.

## Troubleshooting

### Permission Denied
If you get permission errors, run PowerShell as Administrator.

### Multiple Python Versions
If you have multiple Python versions, ensure you're using Python 3.9+:

```powershell
python --version
```

If needed, use the full path to the correct Python:

```powershell
C:\Python314\Scripts\pip.exe install -r requirements.txt
```

### Package Conflicts
If you encounter version conflicts, upgrade pip first:

```powershell
python -m pip install --upgrade pip
```

Then try installing requirements again.
