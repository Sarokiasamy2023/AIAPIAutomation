# Email Reports Feature Guide

## Overview

The Email Reports feature allows you to automatically send test execution reports via email on a scheduled basis or manually on-demand. Reports include comprehensive test results, metrics, and issues with professional HTML formatting.

## Features

✅ **Manual Report Sending** - Send reports immediately with a button click  
✅ **Scheduled Reports** - Configure daily automated reports at specific times  
✅ **Professional Email Format** - Beautiful HTML emails with metrics and charts  
✅ **Excel Attachments** - Automatically attach the latest Excel report  
✅ **Multiple Recipients** - Send to multiple email addresses  
✅ **Schedule Management** - Create, edit, activate/deactivate, and delete schedules  
✅ **Connection Testing** - Verify email configuration before sending  

## Setup Instructions

### 1. Install Dependencies

Run the following command in the `backend` directory:

```bash
pip install -r requirements.txt
```

This will install the new `apscheduler` package required for email scheduling.

### 2. Configure Email Settings

Edit the `backend/.env` file and add your email credentials:

```env
# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SENDER_EMAIL=your-email@gmail.com
SENDER_NAME=API Test Platform
```

#### For Gmail Users:

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to Google Account Settings → Security
   - Under "Signing in to Google", select "App passwords"
   - Generate a new app password for "Mail"
   - Use this 16-character password in `SMTP_PASSWORD`

#### For Other Email Providers:

- **Outlook/Office 365**: 
  - SMTP_SERVER: `smtp.office365.com`
  - SMTP_PORT: `587`
  
- **Yahoo Mail**:
  - SMTP_SERVER: `smtp.mail.yahoo.com`
  - SMTP_PORT: `587`

- **Custom SMTP Server**: Update the settings according to your provider

### 3. Restart the Backend Server

After updating the `.env` file, restart the backend server:

```bash
cd backend
python main.py
```

Or use your existing start script.

### 4. Access the Email Reports Tab

1. Open the frontend application (http://localhost:5000)
2. Click on the **"Email Reports"** tab in the navigation
3. Test your email configuration using the "Test Connection" button

## Usage Guide

### Sending Reports Manually

1. Navigate to the **Email Reports** tab
2. In the "Send Report Now" section:
   - Enter recipient email addresses (comma-separated)
   - Customize the report type if needed
   - Check/uncheck "Include Excel report attachment"
   - Click **"Send Report Now"**

### Setting Up Scheduled Reports

1. Click the **"Add Schedule"** button
2. Fill in the schedule details:
   - **Recipients**: Enter email addresses separated by commas
   - **Schedule Time**: Select the time (24-hour format, e.g., 09:00 for 9 AM)
   - **Report Type**: Customize the report name (e.g., "Daily Test Report")
   - **Active**: Check to enable the schedule immediately
3. Click **"Create"**

The scheduler will automatically send reports at the specified time every day.

### Managing Schedules

- **Activate/Deactivate**: Click the green/yellow icon to toggle schedule status
- **Edit**: Click the edit icon to modify schedule settings
- **Delete**: Click the trash icon to remove a schedule

### Report Content

Each email report includes:

1. **Executive Summary**
   - Overall status badge (Excellent/Good/Needs Attention)
   - Success rate progress bar
   - Total tests executed, passed, and failed

2. **Detailed Metrics**
   - Average response time
   - Total test scenarios
   - Active endpoints

3. **Issues & Risks**
   - List of failed test cases
   - Expected vs actual values
   - Root cause analysis (if available)

4. **Next Steps & Recommendations**
   - Action items based on test results
   - Suggested improvements

5. **Excel Attachment** (optional)
   - Latest report from the Reports folder
   - Detailed test execution results

## API Endpoints

The following API endpoints are available for programmatic access:

### Send Report Immediately
```http
POST /api/email/send-report
Content-Type: application/json

{
  "recipients": ["email1@example.com", "email2@example.com"],
  "report_type": "Manual Test Report",
  "include_attachment": true
}
```

### Test Email Connection
```http
POST /api/email/test-connection
```

### Get All Schedules
```http
GET /api/email/schedules
```

### Create Schedule
```http
POST /api/email/schedules
Content-Type: application/json

{
  "recipients": ["email@example.com"],
  "schedule_time": "09:00",
  "report_type": "Daily Test Report",
  "is_active": true
}
```

### Update Schedule
```http
PUT /api/email/schedules/{schedule_id}
Content-Type: application/json

{
  "recipients": ["newemail@example.com"],
  "schedule_time": "10:00",
  "is_active": true
}
```

### Delete Schedule
```http
DELETE /api/email/schedules/{schedule_id}
```

### Get Latest Report Info
```http
GET /api/email/latest-report
```

## Troubleshooting

### Email Not Sending

1. **Check Email Configuration**
   - Verify credentials in `.env` file
   - Use the "Test Connection" button in the UI
   - Check if 2FA is enabled (required for Gmail)

2. **Check Report File**
   - Ensure there's at least one `.xlsx` file in the `Reports` folder
   - The system automatically picks the most recent file

3. **Check Server Logs**
   - Look for error messages in the backend console
   - Common issues: authentication failures, network errors

### Schedule Not Running

1. **Verify Schedule is Active**
   - Check the green "Active" badge on the schedule
   - Inactive schedules won't send emails

2. **Check Time Format**
   - Use 24-hour format (e.g., 14:00 for 2 PM)
   - Ensure the time is in the future

3. **Restart Backend**
   - Schedules are loaded on startup
   - Restart the backend after creating schedules

### Gmail App Password Issues

1. Enable 2-Factor Authentication first
2. Generate a new App Password specifically for this application
3. Use the 16-character password (no spaces) in `.env`
4. Don't use your regular Gmail password

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use App Passwords** instead of regular passwords
3. **Limit recipient list** to authorized personnel only
4. **Review schedules regularly** to ensure they're still needed
5. **Test in development** before deploying to production

## Advanced Configuration

### Custom SMTP Settings

You can customize SMTP settings in the `.env` file:

```env
SMTP_SERVER=your-smtp-server.com
SMTP_PORT=587
SMTP_USERNAME=your-username
SMTP_PASSWORD=your-password
SENDER_EMAIL=noreply@yourcompany.com
SENDER_NAME=Your Company Test Platform
```

### Email Template Customization

To customize the email template, edit the `_build_email_body` method in `backend/email_service.py`. The template uses HTML with inline CSS for maximum email client compatibility.

## Integration with Existing Workflow

The email reporting feature integrates seamlessly with your existing test execution workflow:

1. **After Test Execution**: Reports are automatically generated and saved to the `Reports` folder
2. **Scheduled Sending**: The scheduler picks up the latest report and sends it at the configured time
3. **Manual Sending**: You can send the latest report anytime via the UI or API

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend console logs for detailed error messages
3. Verify email configuration using the "Test Connection" feature
4. Ensure all dependencies are installed correctly

---

**Created**: March 2026  
**Version**: 1.0  
**Feature**: Automated Email Reporting System
