# Azure DevOps Integration Guide

## Overview

This guide explains how to integrate Azure DevOps (ADS) with the API Test Platform to automatically create work items (bugs/tasks) from test failures and attach test execution reports.

## What Information You Need from Azure DevOps

### 1. **Organization Name**
- Your Azure DevOps organization URL: `https://dev.azure.com/{organization-name}`
- Example: If your URL is `https://dev.azure.com/contoso`, your organization name is `contoso`

### 2. **Project Name**
- The name of your Azure DevOps project where you want to create work items
- Example: `MyAPIProject`

### 3. **Personal Access Token (PAT)**
- A secure token that authenticates API requests to Azure DevOps
- **Required Permissions (Scopes):**
  - ✅ **Work Items** - Read, Write, & Manage
  - ✅ **Project and Team** - Read
  
### 4. **Optional Configuration:**
- **Area Path** - Organizational structure for work items (e.g., `MyProject\API\Backend`)
- **Iteration Path** - Sprint or iteration (e.g., `MyProject\Sprint 1`)
- **Assigned To** - Email address of the person to assign bugs to
- **Work Item Type** - Bug, Task, User Story, Issue, etc. (default: Bug)

---

## How to Get Your Azure DevOps Credentials

### Step 1: Get Your Organization and Project Name

1. Log in to Azure DevOps: https://dev.azure.com
2. Your URL will look like: `https://dev.azure.com/{organization-name}/{project-name}`
3. Note down both the **organization name** and **project name**

### Step 2: Create a Personal Access Token (PAT)

1. Click on **User Settings** (icon in top-right corner)
2. Select **Personal Access Tokens**
3. Click **+ New Token**
4. Configure the token:
   - **Name**: `API Test Platform Integration`
   - **Organization**: Select your organization
   - **Expiration**: Choose expiration date (90 days, 1 year, or custom)
   - **Scopes**: Select **Custom defined**
   - Check these permissions:
     - ✅ **Work Items**: Read, Write, & Manage
     - ✅ **Project and Team**: Read
5. Click **Create**
6. **IMPORTANT**: Copy the token immediately - you won't be able to see it again!

### Step 3: Find Area Path and Iteration Path (Optional)

1. Go to your Azure DevOps project
2. Navigate to **Project Settings** (bottom-left)
3. Under **Boards**, click **Project configuration**
4. Click **Areas** to see available area paths
5. Click **Iterations** to see available iteration paths
6. Note the full path (e.g., `MyProject\API\Backend`)

---

## Configuration Setup

### 1. Update `.env` File

Edit `backend/.env` and add your Azure DevOps credentials:

```env
# Azure DevOps Configuration
AZURE_DEVOPS_ORG=your-organization-name
AZURE_DEVOPS_PROJECT=your-project-name
AZURE_DEVOPS_PAT=your-personal-access-token
```

**Example:**
```env
AZURE_DEVOPS_ORG=contoso
AZURE_DEVOPS_PROJECT=APITestingProject
AZURE_DEVOPS_PAT=abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx
```

### 2. Restart Backend Server

After updating the `.env` file, restart the backend server to load the new configuration.

---

## Features

### ✅ Automatic Bug Creation from Test Failures

The system can automatically create Azure DevOps work items when tests fail, including:

- **Title**: Descriptive bug title with scenario and field name
- **Description**: Detailed HTML table with:
  - Test scenario name
  - Failed field
  - API endpoint
  - Execution date
  - Expected vs Actual values
  - AI-generated root cause analysis
  
- **Reproduction Steps**: Complete steps including:
  - Test scenario details
  - API request body
  - API response body
  - Suggested actions for fixing

- **Attachments**: Automatically attach the latest Excel test report

- **Metadata**:
  - Priority (default: 2)
  - Severity (default: 3 - Medium)
  - Tags (Automated Test, API Test Failure)
  - Area Path (if configured)
  - Iteration Path (if configured)
  - Assigned To (if configured)

### ✅ Batch Bug Creation

Create multiple bugs at once from a list of test failures.

### ✅ Report Attachment

Automatically attach the latest Excel report from the `Reports` folder to each work item.

---

## API Endpoints

### Test Connection
```http
POST /api/azure-devops/test-connection
```

**Response:**
```json
{
  "status": "success",
  "message": "Azure DevOps connection successful",
  "organization": "contoso",
  "project": "APITestingProject",
  "available_work_item_types": ["Bug", "Task", "User Story", "Issue"]
}
```

### Get Work Item Types
```http
GET /api/azure-devops/work-item-types
```

Returns available work item types for your project.

### Get Failed Validations
```http
GET /api/azure-devops/failed-validations
```

Returns list of recent test failures that can be converted to bugs.

**Response:**
```json
{
  "total_failures": 5,
  "failures": [
    {
      "id": 123,
      "scenario_name": "User Registration Validation",
      "field_name": "email",
      "expected": "valid@email.com",
      "actual": "invalid-email",
      "root_cause": "Email validation regex not working",
      "endpoint": "User Registration API",
      "timestamp": "2026-03-06T10:00:00",
      "execution_date": "2026-03-06T09:55:00"
    }
  ]
}
```

### Create Bugs from Failures
```http
POST /api/azure-devops/create-bugs
Content-Type: application/json

{
  "failure_ids": [123, 124, 125],
  "work_item_type": "Bug",
  "area_path": "MyProject\\API\\Backend",
  "iteration_path": "MyProject\\Sprint 1",
  "assigned_to": "developer@company.com",
  "attach_report": true
}
```

**Response:**
```json
{
  "status": "success",
  "created_count": 3,
  "failed_count": 0,
  "created_items": [
    {
      "status": "success",
      "message": "Bug created successfully",
      "work_item_id": 12345,
      "work_item_url": "https://dev.azure.com/contoso/APITestingProject/_workitems/edit/12345",
      "title": "API Test Failure: User Registration - email",
      "attachment_status": "attached"
    }
  ],
  "message": "Created 3 work item(s), 0 failed"
}
```

---

## Usage Workflow

### Manual Bug Creation

1. **Run your API tests** through the platform
2. **Navigate to Dashboard** to see test results
3. **Identify failed tests** you want to create bugs for
4. **Call the API** to create bugs:
   ```bash
   POST /api/azure-devops/create-bugs
   ```
5. **Bugs are created** in Azure DevOps with full details
6. **Reports are attached** automatically

### Automatic Bug Creation (Future Enhancement)

You can integrate automatic bug creation into your test execution workflow:

1. After test execution completes
2. System identifies all failures
3. Automatically creates bugs in Azure DevOps
4. Sends email notification with bug IDs

---

## What Gets Created in Azure DevOps

### Bug Work Item Structure

**Title:**
```
API Test Failure: User Registration Validation - email
```

**Description (HTML Table):**
```
Test Failure Details
┌─────────────────────┬──────────────────────────────────┐
│ Test Scenario       │ User Registration Validation     │
│ Failed Field        │ email                            │
│ API Endpoint        │ /api/users/register              │
│ Execution Date      │ 2026-03-06 10:00:00             │
│ Expected Value      │ valid@email.com                  │
│ Actual Value        │ invalid-email                    │
└─────────────────────┴──────────────────────────────────┘

Root Cause Analysis:
Email validation regex is not properly configured...
```

**Reproduction Steps:**
```
1. Execute test scenario: User Registration Validation
2. Send API request to: /api/users/register
3. Observe the response

Request Body:
{
  "email": "test@example.com",
  "password": "SecurePass123"
}

Response Body:
{
  "error": "Invalid email format"
}

Suggested Action:
Update email validation regex to RFC 5322 standard
```

**Attachments:**
- Latest Excel test execution report

**Fields:**
- Priority: 2
- Severity: 3 - Medium
- Tags: Automated Test; API Test Failure
- Area Path: (as configured)
- Iteration Path: (as configured)
- Assigned To: (as configured)

---

## Troubleshooting

### Connection Failed

**Error:** "Authentication failed. Check your Personal Access Token (PAT)"

**Solution:**
1. Verify your PAT is correct in `.env` file
2. Check PAT hasn't expired
3. Ensure PAT has correct permissions (Work Items: Read, Write, & Manage)
4. Generate a new PAT if needed

---

### Project Not Found

**Error:** "Project 'MyProject' not found in organization 'contoso'"

**Solution:**
1. Verify organization name is correct
2. Verify project name is correct (case-sensitive)
3. Ensure you have access to the project
4. Check project exists in Azure DevOps

---

### Work Item Creation Failed

**Error:** "Failed to create work item: 400 - Invalid area path"

**Solution:**
1. Verify area path exists in your project
2. Use correct format: `ProjectName\Area\SubArea`
3. Leave area_path empty to use project default
4. Check iteration path format if specified

---

### File Attachment Failed

**Error:** "Failed to attach file: File not found"

**Solution:**
1. Ensure Reports folder contains at least one .xlsx file
2. Check file permissions
3. Verify file isn't locked by another process
4. Try with `attach_report: false` to create bug without attachment

---

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use PAT with minimum required permissions**
3. **Set PAT expiration** to reasonable timeframe (90 days recommended)
4. **Rotate PATs regularly** for security
5. **Store PATs securely** - treat them like passwords
6. **Revoke unused PATs** in Azure DevOps settings

---

## Advanced Configuration

### Custom Work Item Types

If your project uses custom work item types:

1. Call `/api/azure-devops/work-item-types` to see available types
2. Use the exact name in `work_item_type` parameter
3. Example: "Defect", "Incident", "Problem"

### Custom Fields

To add custom fields to work items, modify `azure_devops_service.py`:

```python
fields.append({
    "op": "add",
    "path": "/fields/Custom.FieldName",
    "value": "Custom Value"
})
```

### Area and Iteration Paths

Format: `ProjectName\Level1\Level2\Level3`

Examples:
- `APIProject\Backend\Authentication`
- `APIProject\Sprint 1`
- `APIProject\Release 2.0\Sprint 3`

---

## Integration with Email Reports

You can combine Azure DevOps integration with email reports:

1. Tests run automatically
2. Failures are detected
3. Bugs created in Azure DevOps
4. Email sent with:
   - Test results summary
   - Links to created bugs
   - Attached Excel report

---

## Next Steps

1. **Configure credentials** in `.env` file
2. **Test connection** using the API endpoint
3. **Run some tests** to generate failures
4. **Create your first bug** from a test failure
5. **Verify in Azure DevOps** that the bug was created correctly
6. **Customize** area paths, iterations, and assignments as needed

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Verify all credentials are correct
3. Test connection using `/api/azure-devops/test-connection`
4. Check backend console logs for detailed error messages

---

**Created**: March 2026  
**Version**: 1.0  
**Feature**: Azure DevOps Integration for Automated Bug Creation
