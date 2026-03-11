# Automatic Bug Creation from API Validation Failures

## Overview

The system now supports **automatic bug creation** in Azure DevOps when API validation failures occur. This feature allows you to link User Stories to API endpoints, and bugs will be automatically created under the linked User Story whenever validation failures are detected.

---

## 🎯 Key Features

### 1. **User Story Linking**
- Link any Azure DevOps User Story to one or more API endpoints
- Configure automatic bug creation settings per endpoint
- Specify work item type (Bug, Task, etc.)
- Set area path, iteration path, and assignee

### 2. **Automatic Bug Creation**
- Bugs are automatically created when validation failures occur
- Bugs are linked as child items under the specified User Story
- Comprehensive failure details included in bug description
- AI-powered root cause analysis (when available)
- Priority and severity auto-assigned based on failure count

### 3. **Duplicate Prevention**
- System checks for existing bugs before creating new ones
- Prevents duplicate bugs for the same failure

### 4. **Tags**
- All auto-created bugs include tags: `Automated Test`, `API Validation Failure`, `O&M`

---

## 📊 Database Schema

### UserStoryLink Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Primary key |
| `endpoint_id` | Integer | Foreign key to API endpoint |
| `user_story_id` | Integer | Azure DevOps User Story ID (e.g., 427113) |
| `auto_create_bugs` | Boolean | Enable/disable automatic bug creation |
| `work_item_type` | String | Type of work item to create (default: "Bug") |
| `area_path` | String | Azure DevOps area path (optional) |
| `iteration_path` | String | Azure DevOps iteration path (optional) |
| `assigned_to` | String | Email of person to assign bugs to (optional) |
| `created_date` | DateTime | When the link was created |
| `updated_date` | DateTime | Last update timestamp |

---

## 🔌 API Endpoints

### 1. Create User Story Link

**POST** `/api/user-story-links`

Link a User Story to an API endpoint for automatic bug creation.

**Request Body:**
```json
{
  "endpoint_id": 1,
  "user_story_id": 427113,
  "auto_create_bugs": true,
  "work_item_type": "Bug",
  "area_path": "EHBs\\API Testing",
  "iteration_path": "EHBs\\Sprint 1",
  "assigned_to": "user@example.com"
}
```

**Response:**
```json
{
  "id": 1,
  "endpoint_id": 1,
  "user_story_id": 427113,
  "auto_create_bugs": true,
  "work_item_type": "Bug",
  "area_path": "EHBs\\API Testing",
  "iteration_path": "EHBs\\Sprint 1",
  "assigned_to": "user@example.com",
  "created_date": "2026-03-09T14:22:00",
  "updated_date": "2026-03-09T14:22:00"
}
```

**PowerShell Example:**
```powershell
$body = @{
    endpoint_id = 1
    user_story_id = 427113
    auto_create_bugs = $true
    work_item_type = "Bug"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/user-story-links" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```

---

### 2. Get User Story Link by Endpoint

**GET** `/api/user-story-links/endpoint/{endpoint_id}`

Retrieve the user story link for a specific endpoint.

**Response:**
```json
{
  "id": 1,
  "endpoint_id": 1,
  "user_story_id": 427113,
  "auto_create_bugs": true,
  "work_item_type": "Bug",
  "area_path": null,
  "iteration_path": null,
  "assigned_to": null,
  "created_date": "2026-03-09T14:22:00",
  "updated_date": "2026-03-09T14:22:00"
}
```

---

### 3. Get All User Story Links

**GET** `/api/user-story-links`

Retrieve all user story links.

**Response:**
```json
[
  {
    "id": 1,
    "endpoint_id": 1,
    "user_story_id": 427113,
    "auto_create_bugs": true,
    "work_item_type": "Bug",
    ...
  },
  {
    "id": 2,
    "endpoint_id": 2,
    "user_story_id": 427113,
    "auto_create_bugs": true,
    "work_item_type": "Bug",
    ...
  }
]
```

---

### 4. Update User Story Link

**PUT** `/api/user-story-links/{link_id}`

Update an existing user story link.

**Request Body:**
```json
{
  "endpoint_id": 1,
  "user_story_id": 427113,
  "auto_create_bugs": false,
  "work_item_type": "Bug",
  "area_path": "EHBs\\API Testing",
  "iteration_path": "EHBs\\Sprint 2",
  "assigned_to": "newuser@example.com"
}
```

---

### 5. Delete User Story Link

**DELETE** `/api/user-story-links/{link_id}`

Remove a user story link (stops automatic bug creation for that endpoint).

**Response:**
```json
{
  "status": "success",
  "message": "User story link deleted"
}
```

---

## 🚀 How It Works

### Step 1: Link User Story to Endpoint

1. Navigate to the API endpoint you want to monitor
2. Click "Link User Story" button (in UI)
3. Enter User Story ID (e.g., 427113)
4. Configure settings:
   - Enable/disable auto-create bugs
   - Set work item type (Bug, Task, etc.)
   - Optional: Set area path, iteration path, assignee
5. Save the link

### Step 2: Run API Validation

When you execute a test scenario for a linked endpoint:

1. **Validation Executes**: System runs all validation checks
2. **Failures Detected**: If any validations fail, the system collects failure details
3. **Bug Auto-Created**: If `auto_create_bugs` is enabled:
   - Bug is created under the linked User Story
   - Bug includes comprehensive failure details
   - Bug is tagged with `Automated Test`, `API Validation Failure`, `O&M`
   - Priority and severity are auto-assigned based on failure count

### Step 3: Review Bugs in Azure DevOps

1. Open User Story 427113 in Azure DevOps
2. View child work items (bugs)
3. Each bug contains:
   - **Title**: `API Validation Failure: [Scenario Name] - [Endpoint Name]`
   - **Description**: HTML table with failure details
   - **Reproduction Steps**: Detailed steps with request/response data
   - **Root Cause**: AI-generated analysis (when available)
   - **Suggested Action**: Specific action items
   - **Priority**: Auto-assigned (2 if >3 failures, 3 otherwise)
   - **Severity**: Auto-assigned (High if >3 failures, Medium otherwise)
   - **Tags**: `Automated Test; API Validation Failure; O&M`

---

## 📝 Bug Structure

### Title Format
```
API Validation Failure: [Scenario Name] - [Endpoint Name]
```

**Example:**
```
API Validation Failure: Business Rule: ProgramType - DSS-Terms And Conditions
```

### Description (HTML Table)

```html
<h3>Test Failure Details</h3>
<table border="1" cellpadding="5" cellspacing="0">
  <tr><td><strong>Test Scenario:</strong></td><td>Business Rule: ProgramType</td></tr>
  <tr><td><strong>Failed Field:</strong></td><td>ProgramType, activeDate, hrsaWideFlag</td></tr>
  <tr><td><strong>API Endpoint:</strong></td><td>DSS-Terms And Conditions</td></tr>
  <tr><td><strong>Execution Date:</strong></td><td>2026-03-09 14:22:00</td></tr>
  <tr><td><strong>Expected Value:</strong></td><td>All validations should pass</td></tr>
  <tr><td><strong>Actual Value:</strong></td><td>5 validation(s) failed</td></tr>
</table>

<h3>Root Cause Analysis</h3>
<p>Validation failed due to incorrect field values in the API response.</p>

<h3>Action Required</h3>
<p>Review and fix the failing validations. Failed: 5, Passed: 3</p>
```

### Reproduction Steps

```html
<h3>Steps to Reproduce:</h3>
<ol>
  <li>Execute test scenario: Business Rule: ProgramType</li>
  <li>Send request to endpoint: DSS-Terms And Conditions</li>
  <li>Observe validation failures</li>
</ol>

<h3>Request Details:</h3>
<pre>
{
  "programType": "DSS",
  "activeDate": "2026-03-09",
  "hrsaWideFlag": true
}
</pre>

<h3>Response Details:</h3>
<pre>
{
  "programType": "INVALID",
  "activeDate": "2026-03-10",
  "hrsaWideFlag": false
}
</pre>

<h3>Suggested Action:</h3>
<p>Review and fix the failing validations. Failed: 5, Passed: 3</p>
```

---

## 🎨 UI Integration (To Be Implemented)

### Endpoint Management Page

Add a "User Story Link" section to each endpoint:

```
┌─────────────────────────────────────────────┐
│ API Endpoint: DSS-Terms And Conditions      │
├─────────────────────────────────────────────┤
│ User Story Link                             │
│                                             │
│ ☑ Auto-create bugs on validation failures  │
│                                             │
│ User Story ID: [427113        ]             │
│ Work Item Type: [Bug          ▼]            │
│ Area Path:     [EHBs\API      ]  (optional) │
│ Iteration:     [Sprint 1      ]  (optional) │
│ Assign To:     [user@email.com]  (optional) │
│                                             │
│ [Save Link]  [Remove Link]                  │
└─────────────────────────────────────────────┘
```

### Test Execution Results

When a bug is auto-created, show notification:

```
✓ Validation completed
  - Passed: 3
  - Failed: 5
  
🐛 Bug automatically created in Azure DevOps
   Bug ID: 427150
   Title: API Validation Failure: Business Rule: ProgramType - DSS-Terms And Conditions
   Link: https://ehbads.hrsa.gov/ads/EHBs/EHBs/_workitems/edit/427150
```

---

## 🔧 Configuration

### Enable Auto-Bug Creation

**Option 1: Via API**
```powershell
$body = @{
    endpoint_id = 1
    user_story_id = 427113
    auto_create_bugs = $true
    work_item_type = "Bug"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/user-story-links" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```

**Option 2: Via UI** (Coming Soon)
1. Navigate to Endpoints page
2. Click on an endpoint
3. Scroll to "User Story Link" section
4. Enter User Story ID and configure settings
5. Click "Save Link"

### Disable Auto-Bug Creation

**Option 1: Update link to disable**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/user-story-links/1" `
  -Method Put `
  -Body (@{
    endpoint_id = 1
    user_story_id = 427113
    auto_create_bugs = $false
    work_item_type = "Bug"
  } | ConvertTo-Json) `
  -ContentType "application/json"
```

**Option 2: Delete link**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/user-story-links/1" `
  -Method Delete
```

---

## 📊 Validation Response with Bug Creation

When a validation fails and a bug is auto-created, the response includes bug creation details:

```json
{
  "execution_id": 123,
  "pass_count": 3,
  "fail_count": 5,
  "results": [...],
  "response_time_ms": 245,
  "status_code": 200,
  "actual_response": {...},
  "expected_response": {...},
  "bug_created": {
    "status": "success",
    "message": "Bug created successfully under user story 427113",
    "work_item_id": 427150,
    "work_item_url": "https://ehbads.hrsa.gov/ads/EHBs/EHBs/_workitems/edit/427150",
    "title": "API Validation Failure: Business Rule: ProgramType - DSS-Terms And Conditions",
    "parent_id": 427113
  }
}
```

---

## 🎯 Priority and Severity Assignment

### Priority
- **Priority 2**: More than 3 failures detected
- **Priority 3**: 3 or fewer failures detected

### Severity
- **2 - High**: More than 3 failures detected
- **3 - Medium**: 3 or fewer failures detected

---

## 🏷️ Tags

All auto-created bugs include the following tags:
- `Automated Test`
- `API Validation Failure`
- `O&M`

---

## 🔍 Example Workflow

### Scenario: Testing DSS-Terms And Conditions Endpoint

1. **Setup**
   ```powershell
   # Link User Story 427113 to endpoint ID 1
   $body = @{
       endpoint_id = 1
       user_story_id = 427113
       auto_create_bugs = $true
       work_item_type = "Bug"
       assigned_to = "developer@example.com"
   } | ConvertTo-Json
   
   Invoke-RestMethod -Uri "http://localhost:8000/api/user-story-links" `
     -Method Post -Body $body -ContentType "application/json"
   ```

2. **Execute Test**
   - Run validation for scenario under endpoint ID 1
   - System detects 5 validation failures

3. **Auto-Bug Creation**
   - Bug 427150 is automatically created
   - Bug is linked to User Story 427113
   - Bug includes all failure details
   - Developer receives assignment notification

4. **Review and Fix**
   - Developer opens Bug 427150 in Azure DevOps
   - Reviews failure details and root cause
   - Fixes the issues
   - Marks bug as resolved

---

## 📋 Benefits

### 1. **Faster Issue Tracking**
- No manual bug creation needed
- Bugs created immediately when failures occur
- All relevant context included automatically

### 2. **Better Traceability**
- All bugs linked to parent User Story
- Easy to track progress on User Story
- Clear audit trail of validation failures

### 3. **Improved Collaboration**
- Bugs automatically assigned to team members
- Comprehensive failure details for developers
- AI-powered root cause analysis helps debugging

### 4. **Reduced Manual Work**
- No need to manually create bugs from test reports
- No need to copy/paste failure details
- Automatic priority and severity assignment

---

## 🚨 Important Notes

1. **One Link Per Endpoint**: Each endpoint can only be linked to one User Story at a time
2. **NTLM Authentication Required**: Ensure Azure DevOps credentials are configured in `.env`
3. **Duplicate Prevention**: System checks for existing bugs before creating new ones
4. **Excel Reports**: Excel report bugs still use the `/api/azure-devops/create-tasks-from-excel` endpoint

---

## 🔄 Migration from Tasks to Bugs

The default work item type has been changed from **Task** to **Bug** for better issue tracking:

- Excel report failures: Create **Bugs** (was Tasks)
- API validation failures: Create **Bugs** automatically
- All bugs include severity field (High/Medium)
- All bugs include O&M tag

---

## 📞 Support

For issues or questions:
1. Check Azure DevOps connection: `POST /api/azure-devops/test-connection`
2. Verify user story link exists: `GET /api/user-story-links/endpoint/{endpoint_id}`
3. Check backend logs for error messages
4. Ensure `.env` file has correct Azure DevOps credentials

---

**Created**: March 9, 2026  
**Version**: 1.0  
**Feature**: Automatic Bug Creation from API Validation Failures
