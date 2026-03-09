# Testing Guide - Bug Creation & Excel Attachment

## Quick Test Commands

### 1. Test Azure DevOps Connection
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/azure-devops/test-connection" -Method Post
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Successfully connected to Azure DevOps",
  "organization": "EHBs",
  "project": "EHBs",
  "base_url": "https://ehbads.hrsa.gov/ads"
}
```

---

### 2. Create Bugs from Excel Report (with Attachment)
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/azure-devops/create-tasks-from-excel" `
  -Method Post `
  -Body (@{
    parent_work_item_id = 427113
    attach_report = $true
  } | ConvertTo-Json) `
  -ContentType "application/json"
```

**Expected Response:**
```json
{
  "status": "success",
  "created_count": 3,
  "failed_count": 0,
  "created_items": [
    {
      "status": "success",
      "work_item_id": 427140,
      "work_item_url": "https://ehbads.hrsa.gov/ads/EHBs/_workitems/edit/427140",
      "title": "Fix Test Failure: Business Rule: ProgramType - DSS-Terms And Conditions",
      "parent_id": 427113
    }
  ],
  "skipped_duplicates": [],
  "skipped_count": 0,
  "excel_attachment": {
    "status": "success",
    "message": "File attached successfully to work item 427113"
  }
}
```

**Check in Azure DevOps:**
- Open User Story 427113
- Click on "Attachments" tab
- Verify Excel report is attached
- Check child bugs are created

---

### 3. Link User Story to API Endpoint
```powershell
$body = @{
    endpoint_id = 1
    user_story_id = 427113
    auto_create_bugs = $true
    work_item_type = "Bug"
    assigned_to = "your.email@example.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/user-story-links" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```

**Expected Response:**
```json
{
  "id": 1,
  "endpoint_id": 1,
  "user_story_id": 427113,
  "auto_create_bugs": true,
  "work_item_type": "Bug",
  "area_path": null,
  "iteration_path": null,
  "assigned_to": "your.email@example.com",
  "created_date": "2026-03-09T14:39:00",
  "updated_date": "2026-03-09T14:39:00"
}
```

---

### 4. Get User Story Link for Endpoint
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/user-story-links/endpoint/1" -Method Get
```

---

### 5. Test Email Connection (Optional)
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/email/test-connection" -Method Post
```

---

## Troubleshooting

### Excel Not Attached to User Story

**Check the response for `excel_attachment` field:**
```json
"excel_attachment": {
  "status": "success",
  "message": "File attached successfully to work item 427113"
}
```

If this field is missing or shows an error:
1. Check that `attach_report` is set to `$true`
2. Verify Excel file exists in `Reports` folder
3. Check backend console for error messages
4. Verify Azure DevOps credentials in `.env`

**Manual Verification:**
1. Open https://ehbads.hrsa.gov/ads/EHBs/_workitems/edit/427113
2. Click "Attachments" tab
3. Look for the Excel file with timestamp

---

### Email Connection Issues

Azure Communication Services SMTP requires:
- **Server**: smtp.azurecomm.net
- **Port**: 587
- **TLS**: Required
- **Authentication**: Username/Password from Azure portal

**Test email connection:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/email/test-connection" -Method Post
```

If authentication fails:
1. Verify credentials in Azure Communication Services portal
2. Check if the service is enabled
3. Ensure the sender email domain matches your Azure Communication Services resource

---

### Bugs Not Auto-Created on Validation Failure

**Prerequisites:**
1. User story link must exist for the endpoint
2. `auto_create_bugs` must be `true`
3. Validation must actually fail

**Check if link exists:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/user-story-links/endpoint/1" -Method Get
```

**Execute a test scenario:**
- Run validation for a scenario under the linked endpoint
- Check response for `bug_created` field
- If validation passes, no bug is created (expected behavior)

---

## What's Been Fixed

### 1. ✅ Excel Attachment to User Story
- Excel report now attaches to User Story 427113
- Attachment result included in API response
- Console logging added for debugging

### 2. ✅ .env File Cleaned Up
- Removed unused `AZURE_DEVOPS_PAT` field
- Using NTLM authentication only
- Added comments for clarity

### 3. ✅ Work Item Type Changed to Bug
- Default changed from Task to Bug
- All created items are now Bugs
- Includes severity field (High/Medium)

### 4. ✅ Auto-Bug Creation on Validation Failures
- Bugs auto-created when validation fails
- Only for endpoints with user story links
- Comprehensive failure details included

---

## Configuration Summary

### .env File (Cleaned)
```env
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://dmiai.openai.azure.com
AZURE_OPENAI_API_KEY=***
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

# Email Configuration (Azure Communication Services)
SMTP_SERVER=smtp.azurecomm.net
SMTP_PORT=587
SMTP_USERNAME=HRSAEHBs_OM_Database
SMTP_PASSWORD=***
SENDER_EMAIL=DoNotReply@***.azurecomm.net
SENDER_NAME=HRSA-EHBS-OM-DB

# Azure DevOps Configuration (On-Premises Server with NTLM Authentication)
AZURE_DEVOPS_BASE_URL=https://ehbads.hrsa.gov/ads
AZURE_DEVOPS_COLLECTION=EHBs
AZURE_DEVOPS_PROJECT=EHBs
AZURE_DEVOPS_USERNAME=rkodakalla
AZURE_DEVOPS_PASSWORD=***
AZURE_DEVOPS_DOMAIN=HRSA
```

---

## Next Steps

1. **Restart Backend**: Close and restart `.\start.bat`
2. **Test Excel Attachment**: Run the create-tasks-from-excel command
3. **Verify in Azure DevOps**: Check User Story 427113 for attachments
4. **Link Endpoints**: Create user story links for automatic bug creation
5. **Test Validation**: Run test scenarios to trigger auto-bug creation

---

**Created**: March 9, 2026  
**Status**: Ready for Testing
