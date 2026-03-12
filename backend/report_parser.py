import pandas as pd
import openpyxl
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

class ReportParser:
    """Parse Excel test execution reports and extract summary data."""
    
    def __init__(self, report_path: str):
        self.report_path = Path(report_path)
        self.workbook = None
        self.summary_data = {}
        
    def parse_report(self) -> Dict:
        """
        Parse the Excel report and extract all relevant data.
        
        Returns:
            Dictionary containing parsed report data
        """
        try:
            if not self.report_path.exists():
                return {"error": f"Report file not found: {self.report_path}"}
            
            # Load workbook
            self.workbook = openpyxl.load_workbook(self.report_path, data_only=True)
            excel_file = pd.ExcelFile(self.report_path)
            
            # Parse overall summary
            overall_summary = self._parse_overall_summary(excel_file)
            
            # Parse endpoint sheets
            endpoint_results = self._parse_endpoint_sheets(excel_file)
            
            return {
                "report_date": datetime.now().strftime("%B %d, %Y"),
                "overall_summary": overall_summary,
                "endpoint_results": endpoint_results,
                "total_endpoints": len(endpoint_results),
                "report_filename": self.report_path.name
            }
            
        except Exception as e:
            return {"error": f"Failed to parse report: {str(e)}"}
    
    def _parse_overall_summary(self, excel_file) -> Dict:
        """Parse the Overall Summary sheet."""
        try:
            # Check if 'Overall Summary' sheet exists
            if 'Overall Summary' not in excel_file.sheet_names:
                print(f"Warning: 'Overall Summary' sheet not found. Available sheets: {excel_file.sheet_names}")
                # Try to calculate summary from other sheets
                return self._calculate_summary_from_sheets(excel_file)
            
            df = pd.read_excel(excel_file, sheet_name='Overall Summary')
            
            # Extract metrics from the summary sheet
            summary = {
                "total_executions": 0,
                "total_passed": 0,
                "total_failed": 0,
                "success_rate": 0.0,
                "status_breakdown": [],
                "report_type": "test_execution"  # Default type
            }
            
            # Try to find metrics in the dataframe
            for idx, row in df.iterrows():
                if pd.notna(row.iloc[0]):
                    metric_name = str(row.iloc[0]).strip()
                    
                    # Test Execution Report metrics
                    if "Total Executions" in metric_name or "Total Tests" in metric_name:
                        summary["total_executions"] = int(row.iloc[1]) if pd.notna(row.iloc[1]) else 0
                    elif "Total Passed" in metric_name or "Passed" in metric_name:
                        summary["total_passed"] = int(row.iloc[1]) if pd.notna(row.iloc[1]) else 0
                    elif "Total Failed" in metric_name or "Failed" in metric_name:
                        summary["total_failed"] = int(row.iloc[1]) if pd.notna(row.iloc[1]) else 0
                    elif "Success Rate" in metric_name:
                        summary["success_rate"] = float(row.iloc[1]) if pd.notna(row.iloc[1]) else 0.0
                    
                    # Validation Report metrics
                    elif "Total Announcements Received" in metric_name:
                        summary["report_type"] = "validation"
                        summary["total_executions"] = int(row.iloc[1]) if pd.notna(row.iloc[1]) else 0
                    elif "Fields Read" in metric_name:
                        summary["total_fields"] = int(row.iloc[1]) if pd.notna(row.iloc[1]) else 0
                    elif "Fields Correct" in metric_name:
                        summary["total_passed"] = int(row.iloc[1]) if pd.notna(row.iloc[1]) else 0
                    elif "Fields Incorrect" in metric_name:
                        summary["total_failed"] = int(row.iloc[1]) if pd.notna(row.iloc[1]) else 0
                    elif "% Correct" in metric_name:
                        val = str(row.iloc[1]).replace('%', '').strip()
                        summary["success_rate"] = float(val) if val else 0.0
            
            # Calculate success rate if not found
            if summary["success_rate"] == 0:
                if summary["report_type"] == "validation" and summary.get("total_fields", 0) > 0:
                    summary["success_rate"] = round((summary["total_passed"] / summary["total_fields"]) * 100, 2)
                elif summary["total_executions"] > 0:
                    summary["success_rate"] = round((summary["total_passed"] / summary["total_executions"]) * 100, 2)
            
            return summary
            
        except Exception as e:
            print(f"Error parsing overall summary: {str(e)}")
            return {
                "total_executions": 0,
                "total_passed": 0,
                "total_failed": 0,
                "success_rate": 0.0,
                "status_breakdown": [],
                "report_type": "unknown"
            }
    
    def _calculate_summary_from_sheets(self, excel_file) -> Dict:
        """Calculate summary metrics from individual endpoint sheets when Overall Summary is missing."""
        try:
            summary = {
                "total_executions": 0,
                "total_passed": 0,
                "total_failed": 0,
                "success_rate": 0.0,
                "status_breakdown": []
            }
            
            # Iterate through all sheets and aggregate data
            for sheet_name in excel_file.sheet_names:
                try:
                    df = pd.read_excel(excel_file, sheet_name=sheet_name)
                    
                    # Look for status columns
                    if 'Status' in df.columns or 'status' in df.columns:
                        status_col = 'Status' if 'Status' in df.columns else 'status'
                        passed = len(df[df[status_col].str.lower() == 'pass'])
                        failed = len(df[df[status_col].str.lower() == 'fail'])
                        
                        summary["total_executions"] += (passed + failed)
                        summary["total_passed"] += passed
                        summary["total_failed"] += failed
                except Exception as e:
                    print(f"Error parsing sheet {sheet_name}: {str(e)}")
                    continue
            
            # Calculate success rate
            if summary["total_executions"] > 0:
                summary["success_rate"] = round((summary["total_passed"] / summary["total_executions"]) * 100, 2)
            
            return summary
            
        except Exception as e:
            print(f"Error calculating summary from sheets: {str(e)}")
            return {
                "total_executions": 0,
                "total_passed": 0,
                "total_failed": 0,
                "success_rate": 0.0,
                "status_breakdown": []
            }
    
    def _parse_endpoint_sheets(self, excel_file) -> List[Dict]:
        """Parse individual endpoint sheets."""
        endpoint_results = []
        
        try:
            # Get all sheet names except 'Overall Summary'
            sheet_names = [sheet for sheet in excel_file.sheet_names if sheet != 'Overall Summary']
            
            for sheet_name in sheet_names:
                try:
                    df = pd.read_excel(excel_file, sheet_name=sheet_name)
                    
                    endpoint_data = {
                        "endpoint_name": sheet_name,
                        "method": None,
                        "path": None,
                        "scenarios": []
                    }
                    
                    # Extract endpoint details and scenarios
                    for idx, row in df.iterrows():
                        # Look for Method
                        if pd.notna(row.iloc[0]) and "Method" in str(row.iloc[0]):
                            endpoint_data["method"] = str(row.iloc[1]) if pd.notna(row.iloc[1]) else "N/A"
                        
                        # Look for Path
                        elif pd.notna(row.iloc[0]) and "Path" in str(row.iloc[0]):
                            endpoint_data["path"] = str(row.iloc[1]) if pd.notna(row.iloc[1]) else "N/A"
                        
                        # Look for scenario data
                        elif pd.notna(row.iloc[0]) and "Business Rule" in str(row.iloc[0]):
                            # Safely convert values to appropriate types
                            def safe_int(value):
                                try:
                                    if pd.notna(value):
                                        return int(float(value))
                                    return 0
                                except (ValueError, TypeError):
                                    return 0
                            
                            scenario = {
                                "name": str(row.iloc[0]),
                                "description": str(row.iloc[1]) if pd.notna(row.iloc[1]) and len(row) > 1 else "",
                                "status": str(row.iloc[2]).upper() if pd.notna(row.iloc[2]) and len(row) > 2 else "UNKNOWN",
                                "pass_count": safe_int(row.iloc[3]) if len(row) > 3 else 0,
                                "fail_count": safe_int(row.iloc[4]) if len(row) > 4 else 0,
                                "response_time": safe_int(row.iloc[5]) if len(row) > 5 else 0,
                                "execution_date": str(row.iloc[6]) if pd.notna(row.iloc[6]) and len(row) > 6 else ""
                            }
                            endpoint_data["scenarios"].append(scenario)
                    
                    if endpoint_data["scenarios"]:
                        endpoint_results.append(endpoint_data)
                        
                except Exception as e:
                    print(f"Error parsing sheet {sheet_name}: {str(e)}")
                    continue
            
            return endpoint_results
            
        except Exception as e:
            print(f"Error parsing endpoint sheets: {str(e)}")
            return []
    
    def generate_email_summary(self) -> Dict:
        """
        Generate email-ready summary data from the parsed report.
        
        Returns:
            Dictionary formatted for email generation
        """
        parsed_data = self.parse_report()
        
        if "error" in parsed_data:
            return {
                "success_count": 0,
                "failure_count": 0,
                "total_count": 0,
                "success_rate": 0,
                "metrics": {},
                "issues": [],
                "passed_scenarios": [],
                "notes": parsed_data["error"],
                "endpoint_details": []
            }
        
        overall = parsed_data.get("overall_summary", {})
        endpoints = parsed_data.get("endpoint_results", [])
        
        # Deduplicate and collect scenarios
        seen_scenarios = set()
        issues = []
        passed_scenarios = []
        
        for endpoint in endpoints:
            for scenario in endpoint.get("scenarios", []):
                scenario_key = f"{endpoint['endpoint_name']}|{scenario['name']}"
                
                # Skip duplicates
                if scenario_key in seen_scenarios:
                    continue
                seen_scenarios.add(scenario_key)
                
                scenario_data = {
                    "endpoint": endpoint["endpoint_name"],
                    "scenario": scenario["name"],
                    "description": scenario["description"],
                    "fail_count": scenario["fail_count"],
                    "pass_count": scenario["pass_count"],
                    "response_time": scenario["response_time"],
                    "status": scenario["status"]
                }
                
                if scenario["status"] == "FAIL":
                    issues.append(scenario_data)
                elif scenario["status"] == "PASS":
                    passed_scenarios.append(scenario_data)
        
        # Calculate metrics
        total_scenarios = len(seen_scenarios)
        avg_response_time = 0
        response_times = []
        
        for endpoint in endpoints:
            for scenario in endpoint.get("scenarios", []):
                if scenario["response_time"] > 0:
                    response_times.append(scenario["response_time"])
        
        if response_times:
            avg_response_time = round(sum(response_times) / len(response_times), 2)
        
        return {
            "success_count": overall.get("total_passed", 0),
            "failure_count": overall.get("total_failed", 0),
            "total_count": overall.get("total_executions", 0),
            "success_rate": overall.get("success_rate", 0),
            "metrics": {
                "Total Endpoints Tested": parsed_data.get("total_endpoints", 0),
                "Total Test Scenarios": total_scenarios,
                "Average Response Time (ms)": avg_response_time,
                "Passed Scenarios": len(passed_scenarios),
                "Failed Scenarios": len(issues)
            },
            "issues": issues,
            "passed_scenarios": passed_scenarios,
            "notes": f"Report generated from {parsed_data.get('report_filename', 'test report')}",
            "endpoint_details": endpoints
        }
