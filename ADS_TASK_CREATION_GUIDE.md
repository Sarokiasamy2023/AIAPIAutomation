# Azure DevOps Task Creation Guide

## Overview

This guide explains how to automatically create tasks under User Story 427113 in Azure DevOps for failed test scenarios from Excel reports and API validation failures.

## Prerequisites

### 1. Azure DevOps Configuration

Update your `backend/.env` file with Azure DevOps credentials:

```env
# Azure DevOps Configuration
AZURE_DEVOPS_ORG=ehbads
AZURE_DEVOPS_PROJECT=EHBs
AZURE_DEVOPS_PAT=your-personal-access-token
```

**To get your Personal Access Token (PAT):**
1. Go to https://ehbads.hrsa.gov/ads/EHBs/
2. Click on User Settings (top-right) → Personal Access Tokens
3. Create a new token with these permissions:
   - ✅ Work Items: Read, Write, & Manage
   - ✅ Project and Team: Read
4. Copy the token and add it to `.env`

### 2. User Story Information

- **User Story ID**: 427113
- **User Story URL**: https://ehbads.hrsa.gov/ads/EHBs/EHBs/_workitems/edit/427113/

## Features

### ✅ Create Tasks from Excel Report Failures

Automatically creates tasks under user story 427113 for all failures found in the latest Excel test execution report.

### ✅ Create Tasks from API Validation Failures

Creates tasks for specific validation failures that occur during API testing.

### ✅ Automatic Task Creation (Future)

Enable automatic task creation whenever a test fails during execution.

## API Endpoints

### 1. Create Tasks from Excel Report

**Endpoint:** `POST /api/azure-devops/create-tasks-from-excel`

**Request Body:**
```json
{
  "parent_work_item_id": 427113,
  "work_item_type": "Task",
  "area_path": "EHBs\\API Testing",
  "iteration_path": "EHBs\\Sprint 1",
  "assigned_to": "developer@hrsa.gov",
  "attach_report": true
}
```

**Response:**
```json
{
  "status": "success",
  "created_count": 5,
  "failed_count": 0,
  "created_items": [
    {
      "status": "success",
      "message": "Task created successfully under user story 427113",
      "work_item_id": 427150,
      "work_item_url": "https://ehbads.hrsa.gov/ads/EHBs/EHBs/_workitems/edit/427150",
      "title": "Fix Test Failure: User Registration - email",
      "parent_id": 427113,
      "attachment_status": "attached"
    }
  ],
  "message": "Created 5 task(s) under user story 427113, 0 failed"
}
```

### 2. Create Tasks from Validation Failures

**Endpoint:** `POST /api/azure-devops/create-tasks-from-validation`

**Request Body:**
```json
{
  "parent_work_item_id": 427113,
  "failure_ids": [123, 124, 125],
  "work_item_type": "Task",
  "area_path": "EHBs\\API Testing",
  "iteration_path": "EHBs\\Sprint 1",
  "assigned_to": "developer@hrsa.gov",
  "attach_report": true
}
```

**Response:** Same format as above

### 3. Test Azure DevOps Connection

**Endpoint:** `POST /api/azure-devops/test-connection`

**Response:**
```json
{
  "status": "success",
  "message": "Azure DevOps connection successful",
  "organization": "ehbads",
  "project": "EHBs",
  "available_work_item_types": ["Task", "Bug", "User Story", "Issue"]
}
```

## Usage Examples

### Example 1: Create Tasks from Latest Excel Report

```bash
curl -X POST "http://localhost:8000/api/azure-devops/create-tasks-from-excel" \
  -H "Content-Type: application/json" \
  -d '{
    "parent_work_item_id": 427113,
    "work_item_type": "Task",
    "attach_report": true
  }'
```

### Example 2: Create Tasks from Specific Validation Failures

```bash
curl -X POST "http://localhost:8000/api/azure-devops/create-tasks-from-validation" \
  -H "Content-Type: application/json" \
  -d '{
    "parent_work_item_id": 427113,
    "failure_ids": [123, 124, 125],
    "work_item_type": "Task",
    "attach_report": true
  }'
```

### Example 3: Using Python

```python
import requests

# Create tasks from Excel report
response = requests.post(
    "http://localhost:8000/api/azure-devops/create-tasks-from-excel",
    json={
        "parent_work_item_id": 427113,
        "work_item_type": "Task",
        "area_path": "EHBs\\API Testing",
        "assigned_to": "developer@hrsa.gov",
        "attach_report": True
    }
)

result = response.json()
print(f"Created {result['created_count']} tasks")
for item in result['created_items']:
    print(f"- Task {item['work_item_id']}: {item['title']}")
    print(f"  URL: {item['work_item_url']}")
```

## Task Work Item Structure

Each created task includes:

### Title
```
Fix Test Failure: [Scenario Name] - [Endpoint Name]
```

### Description (HTML Table)
```
Test Failure Details
┌─────────────────────┬──────────────────────────────────┐
│ Test Scenario       │ User Registration Validation     │
│ Failed Field        │ email                            │
│ API Endpoint        │ /api/users/register              │
│ Execution Date      │ 2026-03-09 13:00:00             │
│ Expected Value      │ Pass                             │
│ Actual Value        │ Fail                             │
└─────────────────────┴──────────────────────────────────┘

Root Cause Analysis:
Test failed with 5 failures

Action Required:
Investigate and fix the test failure. Update the API or test scenario as needed.
```

### Reproduction Steps
- Test scenario details
- API request information
- Response data
- Suggested actions

### Attachments
- Latest Excel test execution report (if enabled)

### Fields
- **Parent**: User Story 427113
- **Priority**: 2
- **Tags**: Automated Test; API Test Failure
- **Area Path**: (as configured)
- **Iteration Path**: (as configured)
- **Assigned To**: (as configured)

## Automatic Task Creation on Failure

### Future Enhancement

To enable automatic task creation when tests fail:

1. **Configure in `.env`:**
```env
AUTO_CREATE_ADS_TASKS=true
ADS_PARENT_WORK_ITEM_ID=427113
ADS_ASSIGNED_TO=developer@hrsa.gov
```

2. **Tasks will be created automatically when:**
   - API validation fails during test execution
   - Business rule validation fails
   - Schema validation fails

3. **Notification:**
   - Email notification will include links to created tasks
   - Dashboard will show task creation status

## Workflow

### Manual Task Creation from Excel Report

1. **Run Tests** → Generate Excel report in `Reports` folder
2. **Review Failures** → Check the Excel report for failed scenarios
3. **Create Tasks** → Call `/api/azure-devops/create-tasks-from-excel`
4. **Tasks Created** → Tasks appear under User Story 427113 in Azure DevOps
5. **Team Notified** → Assigned developers receive notifications

### Manual Task Creation from API Failures

1. **Run Tests** → Execute API test scenarios
2. **Identify Failures** → Get failure IDs from validation results
3. **Create Tasks** → Call `/api/azure-devops/create-tasks-from-validation`
4. **Tasks Created** → Tasks linked to User Story 427113
5. **Excel Report Attached** → Latest report attached to each task

### Automatic Task Creation (Future)

1. **Test Executes** → API validation runs automatically
2. **Failure Detected** → System detects validation failure
3. **Task Created** → Automatically creates task under User Story 427113
4. **Notification Sent** → Email sent with task link
5. **Dashboard Updated** → Shows task creation status

## Troubleshooting

### Connection Failed

**Error:** "Authentication failed. Check your Personal Access Token (PAT)"

**Solution:**
1. Verify PAT in `.env` file
2. Check PAT hasn't expired
3. Ensure PAT has correct permissions
4. Generate new PAT if needed

### Parent Work Item Not Found

**Error:** "Failed to create work item: 404 - Parent work item not found"

**Solution:**
1. Verify User Story ID 427113 exists
2. Check you have access to the work item
3. Ensure correct project name in `.env`

### No Failures Found

**Message:** "No failures found in the Excel report"

**Solution:**
1. Verify Excel report exists in `Reports` folder
2. Check report contains failure data
3. Run tests to generate new report with failures

### Task Creation Failed

**Error:** "Failed to create work item: Invalid area path"

**Solution:**
1. Verify area path exists in your project
2. Use correct format: `ProjectName\Area\SubArea`
3. Leave area_path empty to use project default

## Best Practices

1. **Review Before Creating**
   - Check Excel report for duplicate failures
   - Verify failures are genuine issues
   - Group similar failures if possible

2. **Use Meaningful Assignments**
   - Assign to appropriate team members
   - Use area paths to organize tasks
   - Set correct iteration/sprint

3. **Attach Reports**
   - Always attach Excel reports for context
   - Include detailed failure information
   - Add comments for clarity

4. **Monitor Task Status**
   - Check Azure DevOps for created tasks
   - Verify tasks are under correct user story
   - Update task status as work progresses

5. **Cleanup**
   - Close duplicate tasks
   - Update task descriptions as needed
   - Link related tasks together

## Integration with Email Reports

Tasks can be created automatically when email reports are sent:

1. Email report sent with failures
2. System creates tasks for each failure
3. Email includes links to created tasks
4. Team receives notification with task IDs

## Support

For issues or questions:
1. Test connection: `POST /api/azure-devops/test-connection`
2. Check backend logs for detailed errors
3. Verify Azure DevOps credentials
4. Ensure User Story 427113 is accessible

---

**Created**: March 2026  
**Version**: 1.0  
**Feature**: Automatic Azure DevOps Task Creation Under User Story
