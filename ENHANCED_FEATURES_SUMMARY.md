# Enhanced Azure DevOps Task Creation - Feature Summary

## Overview

The Azure DevOps task creation system has been significantly enhanced with the following capabilities:

1. ✅ **Excel Report Attachment to User Story**
2. ✅ **Duplicate Task Prevention**
3. ✅ **AI-Powered Root Cause Analysis**
4. ✅ **Comprehensive Multi-Sheet Excel Parsing**
5. ✅ **Meaningful Task Descriptions**

---

## 🎯 Key Enhancements

### 1. Excel Report Attached to User Story (Not Individual Tasks)

**What Changed:**
- Excel report is now attached **once** to the parent User Story (427113)
- Individual tasks reference the report but don't have duplicate attachments
- Reduces clutter and improves organization

**Benefits:**
- Single source of truth for test execution data
- Easier to find and review the complete report
- Reduces storage and improves performance

**Implementation:**
```python
# Attach Excel report to the parent User Story first
attach_result = azure_devops_service.attach_file_to_work_item(
    work_item_id=request.parent_work_item_id,
    file_path=latest_report,
    comment=f"Test Execution Report - {datetime.now()} - {len(failures_data)} failures detected"
)
```

---

### 2. Duplicate Task Prevention

**What Changed:**
- System checks existing child tasks under User Story 427113 before creating new ones
- Tasks with identical titles are automatically skipped
- Provides summary of skipped duplicates

**How It Works:**
```python
# Get existing tasks under the user story
existing_tasks = azure_devops_service.get_child_work_items(request.parent_work_item_id)
existing_task_titles = set(task.get('title', '') for task in existing_tasks.get('work_items', []))

# Check for duplicates before creating
if task_title in existing_task_titles:
    skipped_duplicates.append(task_title)
    continue
```

**Response Includes:**
```json
{
  "created_count": 3,
  "skipped_count": 2,
  "skipped_duplicates": [
    "Fix Test Failure: Business Rule X - Endpoint Y",
    "Fix Test Failure: Validation Z - Endpoint A"
  ],
  "message": "Created 3 task(s) under user story 427113 (Skipped 2 duplicates)"
}
```

---

### 3. AI-Powered Root Cause Analysis

**What Changed:**
- Uses Azure OpenAI (GPT-4) to analyze each failure
- Generates intelligent root cause analysis (2-3 sentences)
- Provides specific, actionable remediation steps

**Root Cause Analysis:**
```python
root_cause_prompt = f"""Analyze this test failure and provide root cause:
Scenario: {scenario_name}
Endpoint: {endpoint_name}
Description: {description}
Failed: {fail_count} times
Passed: {pass_count} times
Response Time: {response_time}ms

Provide a concise root cause analysis (2-3 sentences)."""

# AI generates intelligent analysis
root_cause = ai_response.choices[0].message.content.strip()
```

**Example Output:**
> "The test failure appears to be caused by inconsistent validation logic in the ProgramType field. The API is rejecting valid DSS-Terms And Conditions values intermittently, suggesting a race condition or caching issue. The 60% failure rate indicates the problem is environment-specific rather than a code defect."

**Suggested Actions:**
```python
suggested_action_prompt = f"""Based on this test failure, provide specific action items:
Scenario: {scenario_name}
Endpoint: {endpoint_name}
Root Cause: {root_cause}

Provide 2-3 specific action items to fix this issue."""
```

**Example Output:**
> "1. Review the ProgramType validation logic in the DSS-Terms And Conditions endpoint
> 2. Check for caching issues or race conditions in the validation service
> 3. Add logging to track when valid values are incorrectly rejected"

---

### 4. Comprehensive Multi-Sheet Excel Parsing

**What Changed:**
- Reads **ALL** sheets from Excel report (not just summary)
- Extracts detailed failure information from each endpoint sheet
- Deduplicates scenarios across sheets
- Captures pass/fail counts, response times, and execution dates

**Data Extracted:**
- Overall Summary metrics
- Individual endpoint results
- Scenario-level details:
  - Scenario name and description
  - Pass/fail counts
  - Response times
  - Execution timestamps
  - Status (PASS/FAIL)

**Parser Enhancement:**
```python
# Parse all sheets
sheet_names = [sheet for sheet in excel_file.sheet_names if sheet != 'Overall Summary']

for sheet_name in sheet_names:
    df = pd.read_excel(excel_file, sheet_name=sheet_name)
    # Extract endpoint and scenario data
    # Deduplicate across sheets
```

---

### 5. Meaningful Task Descriptions

**What Changed:**
- Task descriptions now include comprehensive failure context
- HTML-formatted tables with all relevant data
- Clear sections for root cause, reproduction steps, and actions

**Task Structure:**

#### Title
```
Fix Test Failure: Business Rule: ProgramType - DSS-Terms And Conditions
```

#### Description (HTML Table)
```html
<h3>Test Failure Details</h3>
<table border="1" cellpadding="5" cellspacing="0">
  <tr><td><strong>Test Scenario:</strong></td><td>Business Rule: ProgramType</td></tr>
  <tr><td><strong>Failed Field:</strong></td><td>ProgramType validation</td></tr>
  <tr><td><strong>API Endpoint:</strong></td><td>DSS-Terms And Conditions</td></tr>
  <tr><td><strong>Execution Date:</strong></td><td>2026-03-09 14:05:00</td></tr>
  <tr><td><strong>Expected Value:</strong></td><td>All validations should pass</td></tr>
  <tr><td><strong>Actual Value:</strong></td><td>15 validation failures detected</td></tr>
</table>

<h3>Root Cause Analysis</h3>
<p>[AI-generated root cause analysis]</p>

<h3>Action Required</h3>
<p>Investigate and fix the test failure. Update the API or test scenario as needed.</p>
```

#### Reproduction Steps
```html
<h3>Steps to Reproduce:</h3>
<ol>
  <li>Execute test scenario: Business Rule: ProgramType</li>
  <li>Send request to endpoint: DSS-Terms And Conditions</li>
  <li>Observe validation failures</li>
</ol>

<h3>Request Details:</h3>
<p>See attached Excel report for detailed request/response data</p>

<h3>Response Details:</h3>
<pre>
Scenario: Business Rule: ProgramType
Status: FAIL
Pass Count: 10
Fail Count: 15
Response Time: 245ms
</pre>

<h3>Suggested Action:</h3>
<p>[AI-generated specific action items]</p>
```

#### Fields
- **Priority**: Automatically set based on failure count
  - Priority 2: > 5 failures
  - Priority 3: ≤ 5 failures
- **Tags**: "Automated Test; API Test Failure"
- **Area Path**: Project name (EHBs)
- **Parent Link**: User Story 427113

---

## 🚀 How to Use

### Step 1: Restart Backend
```powershell
.\start.bat
```

### Step 2: Create Tasks from Excel Report
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/azure-devops/create-tasks-from-excel" `
  -Method Post `
  -Body (@{
    parent_work_item_id = 427113
    attach_report = $true
  } | ConvertTo-Json) `
  -ContentType "application/json"
```

### Step 3: Review Results

**Success Response:**
```json
{
  "status": "success",
  "created_count": 5,
  "failed_count": 0,
  "skipped_count": 2,
  "created_items": [
    {
      "status": "success",
      "work_item_id": 427150,
      "work_item_url": "https://ehbads.hrsa.gov/ads/EHBs/EHBs/_workitems/edit/427150",
      "title": "Fix Test Failure: Business Rule: ProgramType - DSS-Terms And Conditions",
      "parent_id": 427113
    }
  ],
  "skipped_duplicates": [
    "Fix Test Failure: Existing Task 1",
    "Fix Test Failure: Existing Task 2"
  ],
  "message": "Created 5 task(s) under user story 427113 (Skipped 2 duplicates)"
}
```

---

## 📊 What You'll See in Azure DevOps

### User Story 427113
- **Attachments**: Excel test execution report
- **Child Tasks**: All created tasks linked as children
- **Comments**: Timestamp and failure count

### Each Task
- **Title**: Clear, descriptive failure identification
- **Description**: Comprehensive HTML-formatted failure details
- **Reproduction Steps**: AI-generated steps with context
- **Priority**: Auto-assigned based on severity
- **Tags**: Automated Test, API Test Failure
- **Parent**: Linked to User Story 427113

---

## 🔍 Duplicate Detection Logic

### How Duplicates Are Identified
1. Fetch all existing child tasks under User Story 427113
2. Extract titles from existing tasks
3. Compare new task titles against existing titles
4. Skip creation if exact match found

### What Counts as a Duplicate
- **Exact title match**: `Fix Test Failure: [Scenario] - [Endpoint]`
- Case-sensitive comparison
- Only checks active tasks (not removed/deleted)

### Handling Duplicates
- Skipped tasks are reported in the response
- No error thrown - graceful handling
- Summary includes count of skipped duplicates

---

## 🤖 AI Integration

### Azure OpenAI Configuration
- **Model**: GPT-4
- **Temperature**: 0.3 (focused, deterministic)
- **Max Tokens**: 
  - Root Cause: 200 tokens
  - Suggested Actions: 250 tokens

### Fallback Behavior
If AI service is unavailable:
- Uses template-based root cause
- Provides generic but useful action items
- Ensures task creation continues

### Example AI Analysis

**Input:**
```
Scenario: Business Rule: activeDate Valid and Not Future-Dated
Endpoint: DSS-Terms And Conditions
Failed: 8 times
Passed: 12 times
Response Time: 180ms
```

**AI Root Cause:**
> "The activeDate validation is failing intermittently due to timezone handling issues. The API is comparing dates without normalizing to UTC, causing valid dates to be rejected when the server timezone differs from the request timezone. The 40% failure rate correlates with requests made during specific hours."

**AI Suggested Actions:**
> "1. Update the activeDate validation logic to normalize all dates to UTC before comparison
> 2. Add unit tests covering different timezone scenarios
> 3. Review the date parsing logic in the DSS-Terms And Conditions endpoint"

---

## 📈 Benefits Summary

| Feature | Before | After |
|---------|--------|-------|
| **Excel Attachments** | Attached to every task | Attached once to User Story |
| **Duplicate Tasks** | Created every time | Automatically skipped |
| **Root Cause** | Generic template | AI-powered analysis |
| **Descriptions** | Basic failure info | Comprehensive HTML details |
| **Action Items** | Manual review needed | Specific AI-generated steps |
| **Excel Parsing** | Summary sheet only | All sheets with deduplication |
| **Priority** | Fixed priority | Auto-assigned by severity |

---

## 🔧 Technical Details

### New Methods Added

**Azure DevOps Service:**
- `get_child_work_items(parent_work_item_id)` - Fetch existing child tasks

**Main API:**
- Enhanced `create_tasks_from_excel_failures()` with:
  - Duplicate detection
  - AI root cause analysis
  - AI suggested actions
  - Excel attachment to User Story
  - Comprehensive failure data extraction

### Dependencies
- `requests-ntlm` - NTLM authentication for on-premises Azure DevOps
- `urllib3` - SSL certificate handling
- Azure OpenAI - AI-powered analysis

---

## 🎯 Next Steps

1. **Restart the backend server**
2. **Test the connection**:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:8000/api/azure-devops/test-connection" -Method Post
   ```
3. **Create tasks from your Excel report**
4. **Verify in Azure DevOps**:
   - Check User Story 427113 for Excel attachment
   - Review created child tasks
   - Verify no duplicates were created

---

## 📝 Notes

- Excel report must be in `Reports` folder
- System uses the **latest** Excel file by modification date
- AI analysis requires Azure OpenAI credentials in `.env`
- NTLM authentication required for on-premises Azure DevOps Server
- All API calls use SSL verification bypass for self-signed certificates

---

**Created**: March 9, 2026  
**Version**: 2.0  
**Features**: AI-Powered Task Creation with Duplicate Prevention
