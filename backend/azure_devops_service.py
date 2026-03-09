import requests
import base64
import json
from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path
import os
from dotenv import load_dotenv
import urllib3

# Disable SSL warnings for on-premises Azure DevOps Server with self-signed certificates
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Try to import NTLM authentication support
try:
    from requests_ntlm import HttpNtlmAuth
    NTLM_AVAILABLE = True
except ImportError:
    NTLM_AVAILABLE = False

load_dotenv()

class AzureDevOpsService:
    def __init__(self):
        self.organization = os.getenv("AZURE_DEVOPS_ORG", "")
        self.collection = os.getenv("AZURE_DEVOPS_COLLECTION", "")
        self.project = os.getenv("AZURE_DEVOPS_PROJECT", "")
        self.pat = os.getenv("AZURE_DEVOPS_PAT", "")
        
        # Support both cloud and on-premises Azure DevOps
        custom_base_url = os.getenv("AZURE_DEVOPS_BASE_URL", "")
        if custom_base_url:
            # On-premises server (e.g., https://ehbads.hrsa.gov/ads/EHBs for collection)
            # Use collection in the URL path for on-premises
            self.base_url = f"{custom_base_url}/{self.collection}" if self.collection else custom_base_url
        else:
            # Cloud server (dev.azure.com)
            self.base_url = f"https://dev.azure.com/{self.organization}"
        
        self.api_version = "7.0"
        
        # Check for NTLM credentials (for on-premises Windows authentication)
        self.username = os.getenv("AZURE_DEVOPS_USERNAME", "")
        self.password = os.getenv("AZURE_DEVOPS_PASSWORD", "")
        self.domain = os.getenv("AZURE_DEVOPS_DOMAIN", "")
        
        # Set up authentication
        self.auth = None
        if self.username and self.password and NTLM_AVAILABLE:
            # Use NTLM authentication for on-premises server
            if self.domain:
                ntlm_user = f"{self.domain}\\{self.username}"
            else:
                ntlm_user = self.username
            self.auth = HttpNtlmAuth(ntlm_user, self.password)
            self.headers = {
                "Content-Type": "application/json-patch+json"
            }
        elif self.pat:
            # Use PAT authentication
            credentials = f":{self.pat}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            self.headers = {
                "Authorization": f"Basic {encoded_credentials}",
                "Content-Type": "application/json-patch+json"
            }
        else:
            self.headers = {}
    
    def _build_api_url(self, api_path: str) -> str:
        """Build the correct API URL for on-premises or cloud Azure DevOps."""
        if os.getenv("AZURE_DEVOPS_BASE_URL"):
            # On-premises: https://ehbads.hrsa.gov/ads/EHBs/EHBs/_apis/{api_path}
            # base_url already includes collection, need to add project
            return f"{self.base_url}/{self.project}/_apis/{api_path}"
        else:
            # Cloud: https://dev.azure.com/{org}/{project}/_apis/{api_path}
            return f"{self.base_url}/{self.project}/_apis/{api_path}"
    
    def test_connection(self) -> Dict:
        """Test Azure DevOps connection and credentials."""
        try:
            if not self.project or not self.pat:
                return {
                    "status": "error",
                    "message": "Azure DevOps credentials not configured. Please set AZURE_DEVOPS_PROJECT and AZURE_DEVOPS_PAT in .env file"
                }
            
            url = self._build_api_url(f"wit/workitemtypes?api-version={self.api_version}")
            
            # Debug info
            debug_info = {
                "url": url,
                "base_url": self.base_url,
                "project": self.project,
                "pat_length": len(self.pat) if self.pat else 0,
                "has_headers": bool(self.headers)
            }
            
            # For on-premises Azure DevOps Server, try with verify=False for self-signed certs
            # Use NTLM auth if available, otherwise use PAT in Authorization header
            response = requests.get(url, headers=self.headers, auth=self.auth, timeout=10, verify=False)
            
            if response.status_code == 200:
                work_item_types = response.json().get('value', [])
                available_types = [wit['name'] for wit in work_item_types]
                return {
                    "status": "success",
                    "message": "Azure DevOps connection successful",
                    "organization": self.organization,
                    "project": self.project,
                    "available_work_item_types": available_types
                }
            elif response.status_code == 401:
                return {
                    "status": "error", 
                    "message": "Authentication failed. Check your Personal Access Token (PAT)",
                    "debug": debug_info,
                    "response_headers": dict(response.headers)
                }
            elif response.status_code == 404:
                return {
                    "status": "error", 
                    "message": f"Project '{self.project}' not found",
                    "debug": debug_info
                }
            else:
                return {
                    "status": "error", 
                    "message": f"Connection failed: {response.status_code}",
                    "debug": debug_info,
                    "response_text": response.text[:500]
                }
                
        except requests.exceptions.Timeout:
            return {"status": "error", "message": "Connection timeout. Check your network or Azure DevOps URL"}
        except Exception as e:
            return {"status": "error", "message": f"Connection failed: {str(e)}"}
    
    def create_task_under_user_story(
        self,
        failure_data: Dict,
        parent_work_item_id: int,
        work_item_type: str = "Task",
        area_path: Optional[str] = None,
        iteration_path: Optional[str] = None,
        assigned_to: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> Dict:
        """
        Create a task work item under a parent user story in Azure DevOps.
        
        Args:
            failure_data: Dictionary containing failure information
            parent_work_item_id: ID of the parent user story (e.g., 427113)
            work_item_type: Type of work item (Task, Bug, etc.)
            area_path: Area path in Azure DevOps
            iteration_path: Iteration path in Azure DevOps
            assigned_to: Email of person to assign to
            tags: List of tags to add
        
        Returns:
            Dictionary with status and work item details
        """
        try:
            # Check if credentials are configured (either PAT or NTLM)
            if not self.project or not (self.pat or (self.username and self.password)):
                return {"status": "error", "message": "Azure DevOps not configured"}
            
            title = failure_data.get('title', f"Fix Test Failure: {failure_data.get('scenario_name', 'Unknown')}")
            
            description = self._build_task_description(failure_data)
            repro_steps = self._build_repro_steps(failure_data)
            
            fields = [
                {"op": "add", "path": "/fields/System.Title", "value": title},
                {"op": "add", "path": "/fields/System.Description", "value": description},
                {"op": "add", "path": "/fields/Microsoft.VSTS.TCM.ReproSteps", "value": repro_steps},
                {"op": "add", "path": "/fields/System.Tags", "value": "; ".join(tags or ["Automated Test", "API Test Failure"])},
            ]
            
            if area_path:
                fields.append({"op": "add", "path": "/fields/System.AreaPath", "value": area_path})
            else:
                fields.append({"op": "add", "path": "/fields/System.AreaPath", "value": self.project})
            
            if iteration_path:
                fields.append({"op": "add", "path": "/fields/System.IterationPath", "value": iteration_path})
            
            if assigned_to:
                fields.append({"op": "add", "path": "/fields/System.AssignedTo", "value": assigned_to})
            
            priority = failure_data.get('priority', 2)
            fields.append({"op": "add", "path": "/fields/Microsoft.VSTS.Common.Priority", "value": priority})
            
            # Add parent link
            fields.append({
                "op": "add",
                "path": "/relations/-",
                "value": {
                    "rel": "System.LinkTypes.Hierarchy-Reverse",
                    "url": self._build_api_url(f"wit/workItems/{parent_work_item_id}"),
                    "attributes": {
                        "comment": "Child task for test failure"
                    }
                }
            })
            
            url = self._build_api_url(f"wit/workitems/${work_item_type}?api-version={self.api_version}")
            response = requests.post(url, headers=self.headers, auth=self.auth, json=fields, timeout=15, verify=False)
            
            if response.status_code == 200 or response.status_code == 201:
                work_item = response.json()
                return {
                    "status": "success",
                    "message": f"{work_item_type} created successfully under user story {parent_work_item_id}",
                    "work_item_id": work_item['id'],
                    "work_item_url": work_item['_links']['html']['href'],
                    "title": title,
                    "parent_id": parent_work_item_id
                }
            else:
                return {
                    "status": "error",
                    "message": f"Failed to create work item: {response.status_code} - {response.text}"
                }
                
        except Exception as e:
            return {"status": "error", "message": f"Failed to create work item: {str(e)}"}
    
    def create_bug_from_failure(
        self,
        failure_data: Dict,
        work_item_type: str = "Bug",
        area_path: Optional[str] = None,
        iteration_path: Optional[str] = None,
        assigned_to: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> Dict:
        """
        Create a bug work item in Azure DevOps from test failure data.
        
        Args:
            failure_data: Dictionary containing failure information
                - title: Bug title
                - scenario_name: Test scenario name
                - field_name: Failed field name
                - expected: Expected value
                - actual: Actual value
                - root_cause: AI-generated root cause
                - suggested_action: Suggested fix
                - endpoint: API endpoint
                - execution_date: When the test was executed
                - request_body: Request sent
                - response_body: Response received
            work_item_type: Type of work item (Bug, Task, User Story, etc.)
            area_path: Area path in Azure DevOps
            iteration_path: Iteration path in Azure DevOps
            assigned_to: Email of person to assign to
            tags: List of tags to add
        
        Returns:
            Dictionary with status and work item details
        """
        try:
            # Check if credentials are configured (either PAT or NTLM)
            if not self.project or not (self.pat or (self.username and self.password)):
                return {"status": "error", "message": "Azure DevOps not configured"}
            
            title = failure_data.get('title', f"Test Failure: {failure_data.get('scenario_name', 'Unknown')}")
            
            description = self._build_bug_description(failure_data)
            repro_steps = self._build_repro_steps(failure_data)
            
            fields = [
                {"op": "add", "path": "/fields/System.Title", "value": title},
                {"op": "add", "path": "/fields/System.Description", "value": description},
                {"op": "add", "path": "/fields/Microsoft.VSTS.TCM.ReproSteps", "value": repro_steps},
                {"op": "add", "path": "/fields/System.Tags", "value": "; ".join(tags or ["Automated Test", "API Test Failure"])},
            ]
            
            if area_path:
                fields.append({"op": "add", "path": "/fields/System.AreaPath", "value": area_path})
            else:
                fields.append({"op": "add", "path": "/fields/System.AreaPath", "value": self.project})
            
            if iteration_path:
                fields.append({"op": "add", "path": "/fields/System.IterationPath", "value": iteration_path})
            
            if assigned_to:
                fields.append({"op": "add", "path": "/fields/System.AssignedTo", "value": assigned_to})
            
            priority = failure_data.get('priority', 2)
            severity = failure_data.get('severity', '3 - Medium')
            fields.append({"op": "add", "path": "/fields/Microsoft.VSTS.Common.Priority", "value": priority})
            fields.append({"op": "add", "path": "/fields/Microsoft.VSTS.Common.Severity", "value": severity})
            
            url = self._build_api_url(f"wit/workitems/${work_item_type}?api-version={self.api_version}")
            response = requests.post(url, headers=self.headers, auth=self.auth, json=fields, timeout=15, verify=False)
            
            if response.status_code == 200 or response.status_code == 201:
                work_item = response.json()
                return {
                    "status": "success",
                    "message": f"{work_item_type} created successfully",
                    "work_item_id": work_item['id'],
                    "work_item_url": work_item['_links']['html']['href'],
                    "title": title
                }
            else:
                return {
                    "status": "error",
                    "message": f"Failed to create work item: {response.status_code} - {response.text}"
                }
                
        except Exception as e:
            return {"status": "error", "message": f"Failed to create work item: {str(e)}"}
    
    def attach_file_to_work_item(self, work_item_id: int, file_path: str, comment: str = "") -> Dict:
        """
        Attach a file (like Excel report) to an existing work item.
        
        Args:
            work_item_id: ID of the work item
            file_path: Path to the file to attach
            comment: Optional comment for the attachment
        
        Returns:
            Dictionary with status and attachment details
        """
        try:
            if not Path(file_path).exists():
                return {"status": "error", "message": f"File not found: {file_path}"}
            
            filename = Path(file_path).name
            
            with open(file_path, 'rb') as file:
                file_content = file.read()
            
            upload_url = self._build_api_url(f"wit/attachments?fileName={filename}&api-version={self.api_version}")
            upload_headers = {
                "Content-Type": "application/octet-stream"
            }
            
            # Add Authorization header only if using PAT (not NTLM)
            if "Authorization" in self.headers:
                upload_headers["Authorization"] = self.headers["Authorization"]
            
            upload_response = requests.post(upload_url, headers=upload_headers, auth=self.auth, data=file_content, timeout=30, verify=False)
            
            if upload_response.status_code != 201:
                return {"status": "error", "message": f"Failed to upload file: {upload_response.text}"}
            
            attachment_ref = upload_response.json()
            
            patch_document = [
                {
                    "op": "add",
                    "path": "/relations/-",
                    "value": {
                        "rel": "AttachedFile",
                        "url": attachment_ref['url'],
                        "attributes": {
                            "comment": comment or f"Test execution report - {filename}"
                        }
                    }
                }
            ]
            
            update_url = self._build_api_url(f"wit/workitems/{work_item_id}?api-version={self.api_version}")
            update_response = requests.patch(update_url, headers=self.headers, auth=self.auth, json=patch_document, timeout=15, verify=False)
            
            if update_response.status_code == 200:
                return {
                    "status": "success",
                    "message": f"File '{filename}' attached successfully to work item {work_item_id}",
                    "attachment_id": attachment_ref['id']
                }
            else:
                return {"status": "error", "message": f"Failed to attach file: {update_response.text}"}
                
        except Exception as e:
            return {"status": "error", "message": f"Failed to attach file: {str(e)}"}
    
    def create_tasks_for_failures(
        self,
        failures: List[Dict],
        parent_work_item_id: int,
        attach_report: bool = True,
        report_path: Optional[str] = None,
        work_item_type: str = "Task",
        area_path: Optional[str] = None,
        iteration_path: Optional[str] = None,
        assigned_to: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> Dict:
        """
        Create multiple task work items under a parent user story from a list of test failures.
        
        Args:
            failures: List of failure data dictionaries
            parent_work_item_id: ID of the parent user story (e.g., 427113)
            attach_report: Whether to attach the Excel report
            report_path: Path to the Excel report file
            work_item_type: Type of work item to create (Task, Bug, etc.)
            area_path: Area path in Azure DevOps
            iteration_path: Iteration path in Azure DevOps
            assigned_to: Email of person to assign to
            tags: List of tags to add to each task (e.g., ["Automated Test", "API Test Failure", "O&M"])
        
        Returns:
            Dictionary with summary of created work items
        """
        created_items = []
        failed_items = []
        
        for failure in failures:
            result = self.create_task_under_user_story(
                failure_data=failure,
                parent_work_item_id=parent_work_item_id,
                work_item_type=work_item_type,
                area_path=area_path,
                iteration_path=iteration_path,
                assigned_to=assigned_to,
                tags=tags
            )
            
            if result['status'] == 'success':
                work_item_id = result['work_item_id']
                created_items.append(result)
                
                if attach_report and report_path and Path(report_path).exists():
                    attach_result = self.attach_file_to_work_item(
                        work_item_id=work_item_id,
                        file_path=report_path,
                        comment=f"Test execution report for {failure.get('scenario_name', 'test failure')}"
                    )
                    if attach_result['status'] == 'success':
                        result['attachment_status'] = 'attached'
                    else:
                        result['attachment_status'] = 'failed'
            else:
                failed_items.append({"failure": failure.get('title', 'Unknown'), "error": result['message']})
        
        return {
            "status": "success" if created_items else "error",
            "created_count": len(created_items),
            "failed_count": len(failed_items),
            "created_items": created_items,
            "failed_items": failed_items,
            "message": f"Created {len(created_items)} task(s) under user story {parent_work_item_id}, {len(failed_items)} failed"
        }
    
    def create_bugs_for_failures(
        self,
        failures: List[Dict],
        attach_report: bool = True,
        report_path: Optional[str] = None,
        work_item_type: str = "Bug",
        area_path: Optional[str] = None,
        iteration_path: Optional[str] = None,
        assigned_to: Optional[str] = None
    ) -> Dict:
        """
        Create multiple bug work items from a list of test failures.
        
        Args:
            failures: List of failure data dictionaries
            attach_report: Whether to attach the Excel report
            report_path: Path to the Excel report file
            work_item_type: Type of work item to create
            area_path: Area path in Azure DevOps
            iteration_path: Iteration path in Azure DevOps
            assigned_to: Email of person to assign to
        
        Returns:
            Dictionary with summary of created work items
        """
        created_items = []
        failed_items = []
        
        for failure in failures:
            result = self.create_bug_from_failure(
                failure_data=failure,
                work_item_type=work_item_type,
                area_path=area_path,
                iteration_path=iteration_path,
                assigned_to=assigned_to
            )
            
            if result['status'] == 'success':
                work_item_id = result['work_item_id']
                created_items.append(result)
                
                if attach_report and report_path and Path(report_path).exists():
                    attach_result = self.attach_file_to_work_item(
                        work_item_id=work_item_id,
                        file_path=report_path,
                        comment=f"Test execution report for {failure.get('scenario_name', 'test failure')}"
                    )
                    if attach_result['status'] == 'success':
                        result['attachment_status'] = 'attached'
                    else:
                        result['attachment_status'] = 'failed'
            else:
                failed_items.append({"failure": failure.get('title', 'Unknown'), "error": result['message']})
        
        return {
            "status": "success" if created_items else "error",
            "created_count": len(created_items),
            "failed_count": len(failed_items),
            "created_items": created_items,
            "failed_items": failed_items,
            "message": f"Created {len(created_items)} work item(s), {len(failed_items)} failed"
        }
    
    def _build_task_description(self, failure_data: Dict) -> str:
        """Build HTML description for the task work item."""
        scenario = failure_data.get('scenario_name', 'Unknown Scenario')
        field = failure_data.get('field_name', 'Unknown Field')
        expected = failure_data.get('expected', 'N/A')
        actual = failure_data.get('actual', 'N/A')
        root_cause = failure_data.get('root_cause', 'Not analyzed')
        endpoint = failure_data.get('endpoint', 'Unknown')
        execution_date = failure_data.get('execution_date', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        
        description = f"""<div>
<h3>Test Failure Details</h3>
<table border="1" cellpadding="5" cellspacing="0">
<tr><td><strong>Test Scenario:</strong></td><td>{scenario}</td></tr>
<tr><td><strong>Failed Field:</strong></td><td>{field}</td></tr>
<tr><td><strong>API Endpoint:</strong></td><td>{endpoint}</td></tr>
<tr><td><strong>Execution Date:</strong></td><td>{execution_date}</td></tr>
<tr><td><strong>Expected Value:</strong></td><td>{expected}</td></tr>
<tr><td><strong>Actual Value:</strong></td><td>{actual}</td></tr>
</table>

<h3>Root Cause Analysis</h3>
<p>{root_cause}</p>

<h3>Action Required</h3>
<p>Investigate and fix the test failure. Update the API or test scenario as needed.</p>
</div>"""
        
        return description
    
    def _build_bug_description(self, failure_data: Dict) -> str:
        """Build HTML description for the bug work item."""
        scenario = failure_data.get('scenario_name', 'Unknown Scenario')
        field = failure_data.get('field_name', 'Unknown Field')
        expected = failure_data.get('expected', 'N/A')
        actual = failure_data.get('actual', 'N/A')
        root_cause = failure_data.get('root_cause', 'Not analyzed')
        endpoint = failure_data.get('endpoint', 'Unknown')
        execution_date = failure_data.get('execution_date', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        
        description = f"""<div>
<h3>Test Failure Details</h3>
<table border="1" cellpadding="5" cellspacing="0">
<tr><td><strong>Test Scenario:</strong></td><td>{scenario}</td></tr>
<tr><td><strong>Failed Field:</strong></td><td>{field}</td></tr>
<tr><td><strong>API Endpoint:</strong></td><td>{endpoint}</td></tr>
<tr><td><strong>Execution Date:</strong></td><td>{execution_date}</td></tr>
<tr><td><strong>Expected Value:</strong></td><td>{expected}</td></tr>
<tr><td><strong>Actual Value:</strong></td><td>{actual}</td></tr>
</table>

<h3>Root Cause Analysis</h3>
<p>{root_cause}</p>
</div>"""
        
        return description
    
    def _build_repro_steps(self, failure_data: Dict) -> str:
        """Build reproduction steps for the bug work item."""
        scenario = failure_data.get('scenario_name', 'Unknown Scenario')
        endpoint = failure_data.get('endpoint', 'Unknown')
        request_body = failure_data.get('request_body', 'N/A')
        response_body = failure_data.get('response_body', 'N/A')
        suggested_action = failure_data.get('suggested_action', 'No suggestion available')
        
        repro_steps = f"""<div>
<h3>Steps to Reproduce:</h3>
<ol>
<li>Execute test scenario: <strong>{scenario}</strong></li>
<li>Send API request to: <strong>{endpoint}</strong></li>
<li>Observe the response</li>
</ol>

<h3>Request Body:</h3>
<pre>{request_body}</pre>

<h3>Response Body:</h3>
<pre>{response_body[:500]}{'...' if len(str(response_body)) > 500 else ''}</pre>

<h3>Suggested Action:</h3>
<p>{suggested_action}</p>
</div>"""
        
        return repro_steps
    
    def get_child_work_items(self, parent_work_item_id: int) -> Dict:
        """
        Get all child work items (tasks) under a parent work item (user story).
        
        Args:
            parent_work_item_id: ID of the parent work item
            
        Returns:
            Dictionary with list of child work items
        """
        try:
            # Get the parent work item with relations
            url = self._build_api_url(f"wit/workitems/{parent_work_item_id}?$expand=relations&api-version={self.api_version}")
            response = requests.get(url, headers=self.headers, auth=self.auth, timeout=10, verify=False)
            
            if response.status_code != 200:
                return {"status": "error", "message": f"Failed to get work item: {response.status_code}", "work_items": []}
            
            work_item = response.json()
            relations = work_item.get('relations', [])
            
            # Find child work items (System.LinkTypes.Hierarchy-Forward)
            child_items = []
            for relation in relations:
                if relation.get('rel') == 'System.LinkTypes.Hierarchy-Forward':
                    # Extract work item ID from URL
                    child_url = relation.get('url', '')
                    if child_url:
                        child_id = child_url.split('/')[-1]
                        
                        # Get child work item details
                        child_detail_url = self._build_api_url(f"wit/workitems/{child_id}?api-version={self.api_version}")
                        child_response = requests.get(child_detail_url, headers=self.headers, auth=self.auth, timeout=10, verify=False)
                        
                        if child_response.status_code == 200:
                            child_data = child_response.json()
                            fields = child_data.get('fields', {})
                            child_items.append({
                                'id': child_data.get('id'),
                                'title': fields.get('System.Title', ''),
                                'state': fields.get('System.State', ''),
                                'work_item_type': fields.get('System.WorkItemType', '')
                            })
            
            return {
                "status": "success",
                "work_items": child_items,
                "count": len(child_items)
            }
            
        except Exception as e:
            return {"status": "error", "message": f"Failed to get child work items: {str(e)}", "work_items": []}
    
    def get_work_item_types(self) -> Dict:
        """Get available work item types for the project."""
        try:
            url = self._build_api_url(f"wit/workitemtypes?api-version={self.api_version}")
            response = requests.get(url, headers=self.headers, auth=self.auth, timeout=10, verify=False)
            
            if response.status_code == 200:
                work_item_types = response.json().get('value', [])
                return {
                    "status": "success",
                    "work_item_types": [{"name": wit['name'], "description": wit.get('description', '')} for wit in work_item_types]
                }
            else:
                return {"status": "error", "message": f"Failed to get work item types: {response.text}"}
        except Exception as e:
            return {"status": "error", "message": f"Failed to get work item types: {str(e)}"}
