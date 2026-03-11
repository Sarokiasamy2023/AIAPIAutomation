# UI Integration Guide - ADS Reporter

## ✅ Complete Integration

The Azure DevOps Automation Reporter has been fully integrated into the UI with a dedicated tab.

---

## 🚀 How to Access

### Step 1: Restart Servers
```powershell
.\start.bat
```

### Step 2: Open the Application
Navigate to: **http://localhost:5000**

### Step 3: Click on "ADS Reporter" Tab
You'll see a new tab in the navigation bar called **"ADS Reporter"**

---

## 📋 Using the ADS Reporter UI

### Interface Components

#### 1. **User Story ID Input**
- **Required field**
- Enter the Azure DevOps User Story ID (e.g., 427113)
- This is the parent user story that contains the bugs you want to report on

#### 2. **Include Test Execution Results** (Optional)
- Checkbox to include test metrics in the report
- When checked, you can enter:
  - **Total Tests**: Total number of tests executed
  - **Passed**: Number of tests that passed
  - **Failed**: Number of tests that failed

#### 3. **Action Buttons**

**👁️ Preview Bugs**
- Click to see a preview of bugs before generating the full report
- Shows a table with:
  - Bug ID (clickable link to Azure DevOps)
  - Title
  - State (Active, Resolved, Closed)
  - Priority
  - Assigned To
- Displays up to 10 bugs in preview

**📊 Generate Report**
- Click to generate the comprehensive HTML report
- Report opens automatically in a new browser window
- Report is also saved to `Reports/ADS_Reports/` folder

---

## 🎯 Step-by-Step Workflow

### Example: Generate Report for User Story 427113

1. **Enter User Story ID**
   ```
   User Story ID: 427113
   ```

2. **Optional: Add Test Results**
   - ☑ Check "Include Test Execution Results"
   - Total Tests: `150`
   - Passed: `142`
   - Failed: `8`

3. **Preview Bugs** (Optional)
   - Click "👁️ Preview Bugs" button
   - Review the bug list
   - Verify this is the correct user story

4. **Generate Report**
   - Click "📊 Generate Report" button
   - Wait for generation (usually 5-10 seconds)
   - Report opens in new window automatically

5. **View Report**
   - Report displays with 5 tabs:
     - Executive Summary
     - Overview
     - API Blocks
     - Bug Lifetime
     - Detailed Analysis
   - Navigate between tabs to see different views

6. **Download Report** (Optional)
   - Click "💾 Download Report" button
   - Save HTML file for sharing or archiving

---

## 📊 Report Features

### Executive Summary Tab
- High-level overview narrative
- 4 metric cards:
  - Total Bugs
  - Active Bugs
  - Resolved Bugs
  - Average Cycle Time
- Test execution metrics (if provided)

### Overview Tab
- Bar chart: Bugs by State
- Bar chart: Bugs by Category

### API Blocks Tab
- Individual sections for each API category:
  - Announcement API
  - Application API
  - Terms and Conditions API
  - Awards API
  - DSS API
  - Other
- Active vs Resolved statistics per API
- Top 10 bugs per category

### Bug Lifetime Tab
- Comprehensive table of all bugs
- Columns:
  - Bug ID (clickable)
  - Title
  - Category
  - State
  - Created Date
  - Days in Cycle
  - Age (Active)
  - Assigned To

### Detailed Analysis Tab
- Priority distribution chart (P1-P4)
- Severity distribution chart

---

## 🎨 UI Features

### Visual Feedback
- **Loading States**: Buttons show loading spinner when processing
- **Error Messages**: Red alert box displays any errors
- **Success Messages**: Green alert box shows successful report generation
- **Disabled States**: Buttons are disabled when User Story ID is empty

### Metric Cards
After report generation, you'll see:
- **Total Bugs**: Purple gradient card
- **Active Bugs**: Pink/red gradient card
- **Resolved Bugs**: Green gradient card
- **Avg Cycle Time**: Blue gradient card

### Bug Preview Table
- Alternating row colors for readability
- Clickable bug IDs that open Azure DevOps
- Color-coded state badges:
  - **Active**: Yellow badge
  - **Resolved**: Green badge
  - **Closed**: Gray badge

### Category Breakdown
- Grid layout showing bugs per API category
- Count and category name for each API block

---

## 💡 Tips & Best Practices

### 1. **Use Preview First**
Always click "Preview Bugs" before generating the full report to verify you have the correct user story.

### 2. **Include Test Results**
For comprehensive reports, include test execution metrics to show the complete picture.

### 3. **Save Reports Regularly**
Download and archive reports for historical tracking and trend analysis.

### 4. **Share with Leadership**
The generated HTML reports are designed for executive presentations - they can be opened in any browser.

### 5. **Check Bug Count**
If preview shows 0 bugs, verify:
- User Story ID is correct
- Bugs are properly linked as child items in Azure DevOps
- Azure DevOps connection is working

---

## 🔧 Troubleshooting

### "No bugs found for user story"
**Cause**: User story has no child bugs  
**Solution**: 
- Verify the user story ID is correct
- Check Azure DevOps to ensure bugs are linked as children
- Try a different user story ID

### "Failed to retrieve bugs"
**Cause**: Azure DevOps connection issue  
**Solution**:
- Check backend console for detailed error
- Verify `.env` file has correct credentials
- Test connection: `POST /api/azure-devops/test-connection`

### Report doesn't open automatically
**Cause**: Browser popup blocker  
**Solution**:
- Allow popups from localhost:5000
- Click "Download Report" button instead
- Open report manually from `Reports/ADS_Reports/` folder

### Preview shows wrong bugs
**Cause**: Incorrect user story ID  
**Solution**:
- Double-check the user story ID
- Verify in Azure DevOps which bugs are linked

---

## 📁 File Locations

### Generated Reports
```
Reports/ADS_Reports/ADS_Report_US{user_story_id}_{timestamp}.html
```

**Example:**
```
Reports/ADS_Reports/ADS_Report_US427113_20260310_092500.html
```

### Frontend Component
```
frontend/src/ADSReporterTab.jsx
```

### Backend Service
```
backend/ads_report_generator.py
backend/azure_devops_service.py (get_bugs_by_user_story method)
```

---

## 🎯 Quick Reference

### API Endpoints Used
- `POST /api/azure-devops/generate-report` - Generate report
- `GET /api/azure-devops/bugs/{user_story_id}` - Preview bugs

### Required Input
- User Story ID (number)

### Optional Input
- Test Results (checkbox + 3 numbers)

### Output
- HTML report (opens in new window)
- Report saved to disk
- Metrics summary displayed in UI

---

## 📞 Support

### Common Issues

**Q: How do I find my User Story ID?**  
A: Open the user story in Azure DevOps - the ID is in the URL and title (e.g., #427113)

**Q: Can I generate reports for multiple user stories?**  
A: Yes, enter different user story IDs one at a time. Each generates a separate report.

**Q: How long does report generation take?**  
A: Usually 5-10 seconds, depending on the number of bugs.

**Q: Can I customize the report categories?**  
A: Yes, edit `backend/ads_report_generator.py` and modify the `api_categories` dictionary.

**Q: Where are the reports saved?**  
A: `Reports/ADS_Reports/` folder with timestamped filenames.

---

## ✨ Features Summary

✅ User Story ID input field  
✅ Optional test results input  
✅ Bug preview functionality  
✅ One-click report generation  
✅ Automatic report opening in new window  
✅ Download report button  
✅ Visual metric cards  
✅ Error handling and user feedback  
✅ Loading states and disabled buttons  
✅ Responsive design  
✅ Professional styling  

---

**Created**: March 10, 2026  
**Version**: 1.0  
**Component**: ADS Reporter UI Integration
