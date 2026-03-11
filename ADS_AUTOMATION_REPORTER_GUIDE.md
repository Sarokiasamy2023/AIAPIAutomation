# Azure DevOps Automation Reporter Guide

## Overview

The **Azure DevOps Automation Reporter** is a comprehensive reporting system that generates executive-level daily status reports based on bugs linked to user stories in Azure DevOps. The system provides detailed analytics, visualizations, and lifecycle metrics for leadership presentations.

---

## 🎯 Key Features

### 1. **Automated Bug Retrieval**
- Connects to Azure DevOps using NTLM authentication
- Queries all bugs that are children of specific user stories
- Retrieves comprehensive bug details including state, priority, severity, and dates

### 2. **Lifecycle Metrics**
- **Days in Cycle**: Calculated as (ResolvedDate - CreatedDate) for closed bugs
- **Age**: Calculated as (CurrentDate - CreatedDate) for active bugs
- Average resolution time across all bugs
- Average age of active bugs

### 3. **API Categorization**
Automatically categorizes bugs into API blocks:
- **Announcement API**
- **Application API**
- **Terms and Conditions API**
- **Awards API**
- **DSS API**
- **Other**

### 4. **Executive-Level Reporting**
- Single-page executive summary with key metrics
- Multiple tabs for different views (Executive Summary, Overview, API Blocks, Bug Lifetime, Detailed Analysis)
- Professional HTML report with charts and visualizations
- Pass/Fail breakdown for each API block
- Priority and severity distribution charts

### 5. **Visual Analytics**
- Bar charts for bug distribution by state, category, priority, and severity
- Metric cards with gradient backgrounds
- Color-coded badges for bug states
- Responsive design for all screen sizes

---

## 🚀 API Endpoints

### 1. Generate Automation Report

**POST** `/api/azure-devops/generate-report`

Generate a comprehensive HTML report for a specific user story.

**Request Body:**
```json
{
  "user_story_id": 427113,
  "include_test_results": true,
  "test_results": {
    "total_tests": 150,
    "passed": 142,
    "failed": 8
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Report generated successfully for user story 427113",
  "bug_count": 25,
  "active_bugs": 8,
  "resolved_bugs": 15,
  "report_path": "Reports/ADS_Reports/ADS_Report_US427113_20260310_091500.html",
  "report_filename": "ADS_Report_US427113_20260310_091500.html",
  "html_report": "<html>...</html>",
  "metrics": {
    "total_bugs": 25,
    "active_bugs": 8,
    "resolved_bugs": 15,
    "closed_bugs": 2,
    "avg_age_active": 12.5,
    "avg_cycle_time": 8.3,
    "by_category": {
      "Announcement": 5,
      "Application": 8,
      "Terms and Conditions": 7,
      "Awards": 3,
      "Other": 2
    }
  }
}
```

**PowerShell Example:**
```powershell
$body = @{
    user_story_id = 427113
    include_test_results = $true
    test_results = @{
        total_tests = 150
        passed = 142
        failed = 8
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/azure-devops/generate-report" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```

---

### 2. Get Bugs by User Story

**GET** `/api/azure-devops/bugs/{user_story_id}`

Retrieve all bugs linked to a specific user story.

**Example:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/azure-devops/bugs/427113" -Method Get
```

**Response:**
```json
{
  "status": "success",
  "bugs": [
    {
      "id": 427140,
      "title": "Fix Test Failure: Business Rule: ProgramType - DSS-Terms And Conditions",
      "state": "Active",
      "created_date": "2026-03-09T14:22:00Z",
      "resolved_date": null,
      "closed_date": null,
      "assigned_to": "John Doe",
      "tags": "Automated Test; API Validation Failure; O&M",
      "priority": 2,
      "severity": "2 - High",
      "area_path": "EHBs\\API Testing",
      "iteration_path": "EHBs\\Sprint 1",
      "url": "https://ehbads.hrsa.gov/ads/EHBs/_workitems/edit/427140"
    }
  ],
  "total_count": 25,
  "user_story_id": 427113
}
```

---

## 📊 Report Structure

### Executive Summary Tab
- **Overview**: High-level narrative of bug status
- **Key Metrics**: Total bugs, active bugs, resolved bugs, average cycle time
- **Test Execution Metrics** (if provided): Total tests, passed, failed, success rate

### Overview Tab
- **Bugs by State**: Bar chart showing distribution across Active, Resolved, Closed, etc.
- **Bugs by Category**: Bar chart showing distribution across API blocks

### API Blocks Tab
- **Per-API Breakdown**: Individual sections for each API category
- **Active vs Resolved**: Statistics for each API block
- **Top 10 Bugs**: Table showing the most important bugs per category

### Bug Lifetime Tab
- **Comprehensive Table**: All bugs with lifecycle metrics
- **Sortable Columns**: Bug ID, Title, Category, State, Created Date, Days in Cycle, Age, Assigned To
- **Direct Links**: Click bug IDs to open in Azure DevOps

### Detailed Analysis Tab
- **Priority Distribution**: Bar chart showing P1, P2, P3, P4 bugs
- **Severity Distribution**: Bar chart showing severity levels

---

## 🎨 Report Features

### Visual Design
- **Gradient Headers**: Professional purple gradient design
- **Tabbed Navigation**: Easy switching between different views
- **Responsive Layout**: Works on all screen sizes
- **Color-Coded Badges**: Visual indicators for bug states
- **Metric Cards**: Gradient cards for key performance indicators

### Interactive Elements
- **Tab Switching**: JavaScript-powered tab navigation
- **Hover Effects**: Interactive table rows and cards
- **Clickable Links**: Direct links to Azure DevOps work items

### Professional Styling
- **Executive-Level Design**: Suitable for leadership presentations
- **Clean Typography**: Segoe UI font family
- **Consistent Color Scheme**: Purple/blue gradient theme
- **Proper Spacing**: Well-organized layout with clear sections

---

## 📋 Bug Categorization Logic

The system categorizes bugs based on keywords in the title and tags:

| Category | Keywords |
|----------|----------|
| Announcement API | announcement, announcements |
| Application API | application, applications |
| Terms and Conditions API | terms, conditions, terms and conditions, termsandconditions |
| Awards API | awards, award |
| DSS API | dss |
| Other | (fallback for uncategorized bugs) |

---

## 🔄 Workflow

### Step 1: User Initiates Report Generation
- User clicks "Generate Report" button in UI
- Enters User Story ID (e.g., 427113)
- Optionally includes test execution results

### Step 2: System Retrieves Bugs
- Connects to Azure DevOps via NTLM authentication
- Queries all child work items of the user story
- Filters to include only bugs
- Retrieves detailed fields for each bug

### Step 3: Processing & Analysis
- Calculates lifecycle metrics (age, days in cycle)
- Categorizes bugs into API blocks
- Aggregates statistics (by state, priority, severity, category)
- Computes averages (avg age, avg cycle time)

### Step 4: Report Generation
- Generates comprehensive HTML report
- Creates visualizations (charts, tables, cards)
- Saves report to `Reports/ADS_Reports/` folder
- Returns report data and metrics to UI

### Step 5: Report Delivery
- User can view report in browser
- Report can be downloaded or shared
- Report can be attached to emails

---

## 📈 Metrics Explained

### Total Bugs
Total number of bugs linked to the user story.

### Active Bugs
Bugs in states other than Resolved or Closed (e.g., Active, New, In Progress).

### Resolved Bugs
Bugs that have been resolved but not yet closed.

### Closed Bugs
Bugs that have been completely closed.

### Average Age (Active)
Average number of days active bugs have been open.
- **Formula**: `(CurrentDate - CreatedDate)` for all active bugs

### Average Cycle Time
Average number of days it takes to resolve/close a bug.
- **Formula**: `(ResolvedDate - CreatedDate)` for all resolved/closed bugs

### Days in Cycle
For resolved/closed bugs: Number of days from creation to resolution/closure.

### Age
For active bugs: Number of days since creation.

---

## 🎯 Use Cases

### 1. Daily Standup Reports
Generate a quick status report for daily team meetings showing current bug status and progress.

### 2. Sprint Reviews
Create comprehensive reports at the end of each sprint to show bug resolution progress.

### 3. Leadership Presentations
Generate executive-level reports with visualizations for stakeholder meetings.

### 4. Trend Analysis
Track bug lifecycle metrics over time to identify process improvements.

### 5. API Quality Monitoring
Monitor bug distribution across different API blocks to identify problem areas.

---

## 🔧 Configuration

### Azure DevOps Connection
Ensure `.env` file has correct credentials:
```env
AZURE_DEVOPS_BASE_URL=https://ehbads.hrsa.gov/ads
AZURE_DEVOPS_COLLECTION=EHBs
AZURE_DEVOPS_PROJECT=EHBs
AZURE_DEVOPS_USERNAME=your_username
AZURE_DEVOPS_PASSWORD=your_password
AZURE_DEVOPS_DOMAIN=HRSA
```

### Report Storage
Reports are saved to: `Reports/ADS_Reports/`

Filename format: `ADS_Report_US{user_story_id}_{timestamp}.html`

Example: `ADS_Report_US427113_20260310_091500.html`

---

## 🧪 Testing

### Test Report Generation
```powershell
# Simple report without test results
$body = @{
    user_story_id = 427113
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/azure-devops/generate-report" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"

# Open the generated report
Start-Process $response.report_path
```

### Test with Test Results
```powershell
$body = @{
    user_story_id = 427113
    include_test_results = $true
    test_results = @{
        total_tests = 150
        passed = 142
        failed = 8
    }
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/azure-devops/generate-report" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"

Write-Host "Report generated: $($response.report_filename)"
Write-Host "Total bugs: $($response.bug_count)"
Write-Host "Active: $($response.active_bugs)"
Write-Host "Resolved: $($response.resolved_bugs)"
```

### Get Bugs Only
```powershell
$bugs = Invoke-RestMethod -Uri "http://localhost:8000/api/azure-devops/bugs/427113" -Method Get

Write-Host "Found $($bugs.total_count) bugs"
$bugs.bugs | Format-Table id, title, state, priority -AutoSize
```

---

## 📝 Sample Report Output

The generated HTML report includes:

### Header Section
- Report title with user story ID
- Generation timestamp
- Professional gradient design

### Tabbed Content
1. **Executive Summary**
   - Overview narrative
   - Key metric cards (Total, Active, Resolved, Avg Cycle Time)
   - Test execution metrics (if provided)

2. **Overview**
   - Bug distribution by state (bar chart)
   - Bug distribution by category (bar chart)

3. **API Blocks**
   - Individual sections for each API
   - Active vs Resolved statistics
   - Top 10 bugs per API in table format

4. **Bug Lifetime**
   - Comprehensive table of all bugs
   - Lifecycle metrics (Days in Cycle, Age)
   - Sortable and clickable

5. **Detailed Analysis**
   - Priority distribution chart
   - Severity distribution chart

### Footer
- Copyright and branding information

---

## 🚀 Integration with UI

### Frontend Button
Add a "Generate ADS Report" button to the UI:

```javascript
async function generateADSReport(userStoryId) {
    const response = await fetch('http://localhost:8000/api/azure-devops/generate-report', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_story_id: userStoryId,
            include_test_results: true,
            test_results: {
                total_tests: 150,
                passed: 142,
                failed: 8
            }
        })
    });
    
    const data = await response.json();
    
    // Open report in new window
    const reportWindow = window.open();
    reportWindow.document.write(data.html_report);
    
    // Show success message
    alert(`Report generated! ${data.bug_count} bugs analyzed.`);
}
```

---

## 🎓 Best Practices

### 1. Regular Report Generation
Generate reports daily or at the end of each sprint for consistent tracking.

### 2. Include Test Results
Always include test execution metrics for comprehensive status reporting.

### 3. Share with Stakeholders
Export and share HTML reports with leadership for visibility.

### 4. Track Trends
Save reports over time to analyze trends in bug resolution and API quality.

### 5. Use for Sprint Planning
Review bug lifetime metrics to improve sprint planning and estimation.

---

## 🔍 Troubleshooting

### No Bugs Found
- Verify user story ID is correct
- Check that bugs are properly linked as child items
- Ensure Azure DevOps connection is working

### Report Not Generating
- Check backend logs for errors
- Verify Azure DevOps credentials in `.env`
- Ensure `Reports/ADS_Reports/` folder exists

### Missing Metrics
- Verify bugs have proper dates (CreatedDate, ResolvedDate)
- Check that bug fields are populated in Azure DevOps

---

## 📞 Support

For issues or questions:
1. Check Azure DevOps connection: `POST /api/azure-devops/test-connection`
2. Verify bug retrieval: `GET /api/azure-devops/bugs/{user_story_id}`
3. Review backend console logs
4. Ensure all dependencies are installed

---

**Created**: March 10, 2026  
**Version**: 1.0  
**Feature**: Azure DevOps Automation Reporter
