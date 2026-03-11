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
        tags: Optional[List[str]] = None,
        feature_file_name: Optional[str] = None,
        testing_environment: Optional[str] = None,
        bug_type: str = "Bug - GS Transition",
        classification: str = "DME"
    ) -> Dict:
        """
        Create a bug work item in Azure DevOps from test failure data with comprehensive ADS fields.
        
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
                - base_url: Base URL
                - api_name: API Name
                - environment: Testing environment
                - execution_date: When the test was executed
                - failure_timestamp: Exact failure timestamp
                - test_severity: Test severity level
                - request_body: Request sent (JSON payload)
                - response_body: Response received (JSON payload)
                - expected_results: Expected results description
                - actual_results: Actual results description
                - steps_to_reproduce: Detailed steps to reproduce
            work_item_type: Type of work item (Bug, Task, User Story, etc.)
            area_path: Area path in Azure DevOps
            iteration_path: Iteration path in Azure DevOps
            assigned_to: Email of person to assign to
            tags: Additional custom tags to add
            feature_file_name: Feature file name (e.g., NOFO_API_Automation)
            testing_environment: Testing environment (e.g., UTL16)
            bug_type: Bug type tag (default: "Bug - GS Transition")
            classification: O&M or DME classification (default: "DME")
        
        Returns:
            Dictionary with status and work item details
        """
        try:
            # Check if credentials are configured (either PAT or NTLM)
            if not self.project or not (self.pat or (self.username and self.password)):
                return {"status": "error", "message": "Azure DevOps not configured"}
            
            title = failure_data.get('title', f"Test Failure: {failure_data.get('scenario_name', 'Unknown')}")
            
            # Build comprehensive tags list for ADS
            bug_tags = []
            
            # Add Feature File Name tag
            if feature_file_name:
                bug_tags.append(feature_file_name)
            elif failure_data.get('feature_file_name'):
                bug_tags.append(failure_data['feature_file_name'])
            
            # Add Bug Type tag
            bug_tags.append(bug_type)
            
            # Add Classification tag (DME or O&M)
            bug_tags.append(classification)
            
            # Add Testing Environment tag
            if testing_environment:
                bug_tags.append(testing_environment)
            elif failure_data.get('environment'):
                bug_tags.append(failure_data['environment'])
            
            # Add any custom tags
            if tags:
                bug_tags.extend(tags)
            
            # Add default automated test tag
            bug_tags.append("Automated Test")
            
            description = self._build_bug_description(failure_data)
            repro_steps = self._build_enhanced_repro_steps(failure_data)
            
            fields = [
                {"op": "add", "path": "/fields/System.Title", "value": title},
                {"op": "add", "path": "/fields/System.Description", "value": description},
                {"op": "add", "path": "/fields/Microsoft.VSTS.TCM.ReproSteps", "value": repro_steps},
                {"op": "add", "path": "/fields/System.Tags", "value": "; ".join(bug_tags)},
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
    
    def link_bug_to_user_story(self, bug_id: int, user_story_id: int) -> Dict:
        """
        Link a bug to a user story as a child work item.
        
        Args:
            bug_id: ID of the bug work item
            user_story_id: ID of the user story work item
        
        Returns:
            Dictionary with status and link details
        """
        try:
            # Create parent-child relationship
            patch_document = [
                {
                    "op": "add",
                    "path": "/relations/-",
                    "value": {
                        "rel": "System.LinkTypes.Hierarchy-Reverse",
                        "url": f"{self.base_url}/{self.project}/_apis/wit/workItems/{user_story_id}",
                        "attributes": {
                            "comment": "Linked to User Story"
                        }
                    }
                }
            ]
            
            url = self._build_api_url(f"wit/workitems/{bug_id}?api-version={self.api_version}")
            response = requests.patch(url, headers=self.headers, auth=self.auth, json=patch_document, timeout=15, verify=False)
            
            if response.status_code == 200:
                return {
                    "status": "success",
                    "message": f"Bug {bug_id} linked to User Story {user_story_id}",
                    "bug_id": bug_id,
                    "user_story_id": user_story_id
                }
            else:
                return {
                    "status": "error",
                    "message": f"Failed to link bug: {response.status_code} - {response.text}"
                }
                
        except Exception as e:
            return {"status": "error", "message": f"Failed to link bug to user story: {str(e)}"}
    
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
    
    def _build_enhanced_repro_steps(self, failure_data: Dict) -> str:
        """Build comprehensive reproduction steps with all ADS required fields."""
        import json
        
        # Extract all fields
        api_name = failure_data.get('api_name', failure_data.get('scenario_name', 'Unknown API'))
        base_url = failure_data.get('base_url', 'N/A')
        endpoint = failure_data.get('endpoint', 'Unknown')
        environment = failure_data.get('environment', 'Unknown')
        failure_timestamp = failure_data.get('failure_timestamp', failure_data.get('execution_date', 'N/A'))
        test_severity = failure_data.get('test_severity', failure_data.get('severity', 'Medium'))
        automated_test = "Yes"
        
        # Request and Response payloads
        request_payload = failure_data.get('request_body', failure_data.get('request_payload', {}))
        response_payload = failure_data.get('response_body', failure_data.get('response_payload', {}))
        
        # Check if payloads have actual data
        has_request_data = request_payload and request_payload != {} and str(request_payload).strip() not in ['{}', 'null', 'None', '']
        has_response_data = response_payload and response_payload != {} and str(response_payload).strip() not in ['{}', 'null', 'None', '']
        
        # Format JSON payloads only if they have data
        request_json = ""
        response_json = ""
        
        if has_request_data:
            if isinstance(request_payload, dict):
                request_json = json.dumps(request_payload, indent=2)
            else:
                request_json = str(request_payload)
        
        if has_response_data:
            if isinstance(response_payload, dict):
                response_json = json.dumps(response_payload, indent=2)
            else:
                response_json = str(response_payload)
        
        # Expected and Actual Results
        expected_results = failure_data.get('expected_results', failure_data.get('expected', 'N/A'))
        actual_results = failure_data.get('actual_results', failure_data.get('actual', 'N/A'))
        
        # Steps to reproduce
        steps_to_reproduce = failure_data.get('steps_to_reproduce', '')
        if not steps_to_reproduce:
            scenario = failure_data.get('scenario_name', 'Unknown Scenario')
            steps_to_reproduce = f"""1. Execute test scenario: {scenario}
2. Send API request to: {endpoint}
3. Observe the response
4. Compare actual results with expected results"""
        
        # Build Request Payload section only if data exists
        request_section = ""
        if has_request_data:
            request_section = f"""
<h3 style="color: #0078d4; margin-top: 30px;">📤 Request Payload</h3>
<div style="background-color: #f5f5f5; padding: 15px; border: 1px solid #ddd; border-radius: 4px; margin: 10px 0;">
<pre style="white-space: pre-wrap; font-family: 'Consolas', monospace; font-size: 12px; max-height: 400px; overflow-y: auto;">{request_json[:2000]}{('...' + chr(10) + '[Truncated - See attached JSON file for full payload]') if len(request_json) > 2000 else ''}</pre>
</div>"""
        
        # Build Response Payload section only if data exists
        response_section = ""
        if has_response_data:
            response_section = f"""
<h3 style="color: #0078d4; margin-top: 30px;">📥 Response Payload</h3>
<div style="background-color: #fff4f4; padding: 15px; border: 1px solid #ffcccc; border-radius: 4px; margin: 10px 0;">
<pre style="white-space: pre-wrap; font-family: 'Consolas', monospace; font-size: 12px; max-height: 400px; overflow-y: auto;">{response_json[:2000]}{('...' + chr(10) + '[Truncated - See attached JSON file for full payload]') if len(response_json) > 2000 else ''}</pre>
</div>"""
        
        # Build comprehensive HTML repro steps
        repro_steps = f"""<div style="font-family: 'Segoe UI', Arial, sans-serif;">
<h2 style="color: #0078d4; border-bottom: 2px solid #0078d4; padding-bottom: 8px;">📋 Detailed Reproduction Steps</h2>

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
<tr style="background-color: #f3f2f1;">
    <td style="padding: 10px; font-weight: bold; width: 200px; border: 1px solid #ddd;">API Name</td>
    <td style="padding: 10px; border: 1px solid #ddd;">{api_name}</td>
</tr>
<tr>
    <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Base URL</td>
    <td style="padding: 10px; border: 1px solid #ddd;">{base_url}</td>
</tr>
<tr style="background-color: #f3f2f1;">
    <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Endpoint</td>
    <td style="padding: 10px; border: 1px solid #ddd;">{endpoint}</td>
</tr>
<tr>
    <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Environment</td>
    <td style="padding: 10px; border: 1px solid #ddd;"><strong>{environment}</strong></td>
</tr>
<tr style="background-color: #f3f2f1;">
    <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Failure Timestamp</td>
    <td style="padding: 10px; border: 1px solid #ddd;">{failure_timestamp}</td>
</tr>
<tr>
    <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Test Severity</td>
    <td style="padding: 10px; border: 1px solid #ddd;">{test_severity}</td>
</tr>
<tr style="background-color: #f3f2f1;">
    <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Automated Test</td>
    <td style="padding: 10px; border: 1px solid #ddd;">{automated_test}</td>
</tr>
</table>

<h3 style="color: #0078d4; margin-top: 30px;">📝 Steps to Reproduce</h3>
<div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #0078d4; margin: 10px 0;">
<pre style="white-space: pre-wrap; font-family: 'Consolas', monospace;">{steps_to_reproduce}</pre>
</div>
{request_section}
{response_section}
<h3 style="color: #28a745; margin-top: 30px;">✅ Expected Results</h3>
<div style="background-color: #e7f4e7; padding: 15px; border-left: 4px solid #28a745; margin: 10px 0;">
<p style="margin: 0;">{expected_results}</p>
</div>

<h3 style="color: #dc3545; margin-top: 30px;">❌ Actual Results</h3>
<div style="background-color: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin: 10px 0;">
<p style="margin: 0;">{actual_results}</p>
</div>
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
    
    def get_user_story_details(self, user_story_id: int) -> Dict:
        """
        Get detailed information about a specific user story.
        
        Args:
            user_story_id: The ID of the user story
            
        Returns:
            Dictionary with user story details
        """
        try:
            url = self._build_api_url(f"wit/workitems/{user_story_id}?$expand=all&api-version={self.api_version}")
            response = requests.get(url, headers=self.headers, auth=self.auth, timeout=10, verify=False)
            
            if response.status_code == 200:
                work_item = response.json()
                fields = work_item.get('fields', {})
                
                user_story_data = {
                    'id': work_item.get('id'),
                    'title': fields.get('System.Title', ''),
                    'description': fields.get('System.Description', ''),
                    'acceptance_criteria': fields.get('Microsoft.VSTS.Common.AcceptanceCriteria', ''),
                    'state': fields.get('System.State', ''),
                    'assigned_to': fields.get('System.AssignedTo', {}).get('displayName', 'Unassigned'),
                    'created_date': fields.get('System.CreatedDate', ''),
                    'changed_date': fields.get('System.ChangedDate', ''),
                    'tags': fields.get('System.Tags', ''),
                    'area_path': fields.get('System.AreaPath', ''),
                    'iteration_path': fields.get('System.IterationPath', ''),
                    'priority': fields.get('Microsoft.VSTS.Common.Priority', 3),
                    'story_points': fields.get('Microsoft.VSTS.Scheduling.StoryPoints', 0),
                    'business_value': fields.get('Microsoft.VSTS.Common.BusinessValue', 0),
                    'url': work_item.get('_links', {}).get('html', {}).get('href', ''),
                    'relations': work_item.get('relations', [])
                }
                
                return {
                    "status": "success",
                    "user_story": user_story_data
                }
            else:
                return {"status": "error", "message": f"Failed to get user story: {response.text}"}
                
        except Exception as e:
            return {"status": "error", "message": f"Failed to get user story details: {str(e)}"}
    
    def get_board_user_stories(self, board_name: str = None, iteration_path: str = None) -> Dict:
        """
        Get user stories from a specific board or iteration.
        
        Args:
            board_name: Name of the board (used as Area Path filter)
            iteration_path: Iteration path to filter by (optional)
            
        Returns:
            Dictionary with list of user stories
        """
        try:
            # Build simple WIQL query compatible with on-premises Azure DevOps Server
            url = self._build_api_url(f"wit/wiql?api-version={self.api_version}")
            
            # Use simpler headers for WIQL query
            wiql_headers = self.headers.copy()
            wiql_headers["Content-Type"] = "application/json"
            
            work_items = []
            
            # Try multiple query strategies to find user stories
            if board_name:
                print(f"[DEBUG] Searching for board: {board_name}")
                print(f"[DEBUG] Note: Azure DevOps boards are defined by Area Path, Tags, or Team")
                print(f"[DEBUG] Searching for user stories with '{board_name}' in Area Path or Tags")
                
                # Try different WIQL strategies to filter by board name
                # Strategy 1: Try CONTAINS WORDS on Tags field
                wiql_query = f"SELECT [System.Id] FROM WorkItems WHERE [System.WorkItemType] = 'User Story' AND [System.State] <> 'Removed' AND [System.Tags] CONTAINS WORDS '{board_name}'"
                
                if iteration_path:
                    wiql_query += f" AND [System.IterationPath] = '{iteration_path}'"
                
                print(f"[DEBUG] Trying WIQL with CONTAINS WORDS on Tags")
                print(f"[DEBUG] Query: {wiql_query}")
                
                response = requests.post(url, headers=wiql_headers, auth=self.auth, json={"query": wiql_query}, timeout=30, verify=False)
                print(f"[DEBUG] WIQL Response Status: {response.status_code}")
                
                # If CONTAINS WORDS fails, try simple CONTAINS
                if response.status_code != 200:
                    print(f"[DEBUG] CONTAINS WORDS failed, trying CONTAINS")
                    wiql_query = f"SELECT [System.Id] FROM WorkItems WHERE [System.WorkItemType] = 'User Story' AND [System.State] <> 'Removed' AND [System.Tags] CONTAINS '{board_name}'"
                    
                    if iteration_path:
                        wiql_query += f" AND [System.IterationPath] = '{iteration_path}'"
                    
                    response = requests.post(url, headers=wiql_headers, auth=self.auth, json={"query": wiql_query}, timeout=30, verify=False)
                    print(f"[DEBUG] CONTAINS Response Status: {response.status_code}")
                
                # If both fail, get all and filter client-side (but limit to reasonable number)
                if response.status_code != 200:
                    print(f"[DEBUG] Tag-based queries failed, falling back to client-side filtering")
                    wiql_query = "SELECT [System.Id] FROM WorkItems WHERE [System.WorkItemType] = 'User Story' AND [System.State] <> 'Removed' ORDER BY [System.Id]"
                    
                    if iteration_path:
                        wiql_query += f" AND [System.IterationPath] = '{iteration_path}'"
                    
                    response = requests.post(url, headers=wiql_headers, auth=self.auth, json={"query": wiql_query}, timeout=30, verify=False)
                    print(f"[DEBUG] Fallback Response Status: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    all_work_items = result.get('workItems', [])
                    print(f"[DEBUG] Found {len(all_work_items)} user stories from WIQL query")
                    
                    # Check if WIQL query already filtered results (CONTAINS/CONTAINS WORDS worked)
                    # If we got fewer than 10000 results, likely the filter worked
                    if len(all_work_items) < 10000 and len(all_work_items) > 0:
                        print(f"[DEBUG] WIQL query appears to have filtered results, using them directly")
                        work_items = all_work_items
                    else:
                        # Need to do client-side filtering
                        print(f"[DEBUG] Doing client-side filtering on {len(all_work_items)} user stories")
                        board_lower = board_name.lower().strip()
                        batch_size = 200  # Fetch 200 IDs at once using batch API
                        matched_count = 0
                        
                        # Extract key search terms from board name
                        # e.g., "GS Transition_user Stories" -> ["gs transition", "gs", "transition"]
                        search_terms = [board_lower]
                        
                        # Add individual words as search terms (for partial matching)
                        words = board_lower.replace('_', ' ').split()
                        if len(words) > 1:
                            # Add combinations of consecutive words
                            for i in range(len(words)):
                                search_terms.append(words[i])
                                if i < len(words) - 1:
                                    search_terms.append(f"{words[i]} {words[i+1]}")
                        
                        # Remove duplicates and very short terms
                        search_terms = list(set([term for term in search_terms if len(term) > 2]))
                        
                        print(f"[DEBUG] Filtering for search terms: {search_terms}")
                        
                        # Use batch API to fetch multiple work items at once (much faster)
                        batches_processed = 0
                        for i in range(0, min(len(all_work_items), 10000), batch_size):  # Search up to 10000 items to find matches
                            batch = all_work_items[i:i+batch_size]
                            batch_ids = [item.get('id') for item in batch]
                            batches_processed += 1
                            
                            # Fetch batch of work items in one API call
                            batch_url = self._build_api_url(f"wit/workitems?ids={','.join(map(str, batch_ids))}&fields=System.Id,System.Title,System.AreaPath,System.Tags&api-version={self.api_version}")
                            
                            print(f"[DEBUG] Processing batch {batches_processed} with {len(batch_ids)} items")
                            
                            try:
                                batch_response = requests.get(batch_url, headers=self.headers, auth=self.auth, timeout=30, verify=False)
                                
                                print(f"[DEBUG] Batch API response status: {batch_response.status_code}")
                                
                                if batch_response.status_code == 200:
                                    batch_data = batch_response.json()
                                    items_in_batch = len(batch_data.get('value', []))
                                    print(f"[DEBUG] Batch returned {items_in_batch} work items")
                                    
                                    # Show first item as sample
                                    if items_in_batch > 0 and batches_processed == 1:
                                        sample = batch_data.get('value', [])[0]
                                        sample_fields = sample.get('fields', {})
                                        print(f"[DEBUG] Sample item: area='{sample_fields.get('System.AreaPath', '')}', tags='{sample_fields.get('System.Tags', '')}'")
                                    
                                    for work_item in batch_data.get('value', []):
                                        work_item_id = work_item.get('id')
                                        fields = work_item.get('fields', {})
                                        area_path = fields.get('System.AreaPath', '').lower()
                                        tags = fields.get('System.Tags', '').lower()
                                        
                                        # Debug: Check if we're processing the known GS Transition IDs
                                        if work_item_id in [414237, 420291, 420295, 420297, 420300]:
                                            print(f"[DEBUG] !!! Found GS Transition story {work_item_id}")
                                            print(f"[DEBUG]     Area Path: '{area_path}'")
                                            print(f"[DEBUG]     Tags: '{tags}'")
                                            print(f"[DEBUG]     Search terms: {search_terms}")
                                            print(f"[DEBUG]     Checking if any term in tags...")
                                            for term in search_terms:
                                                print(f"[DEBUG]       '{term}' in '{tags}': {term in tags}")
                                        
                                        # Check if any search term matches area path or tags
                                        matched = False
                                        for term in search_terms:
                                            if term in area_path or term in tags:
                                                matched = True
                                                break
                                        
                                        if matched:
                                            work_items.append({'id': work_item.get('id')})
                                            matched_count += 1
                                            if matched_count <= 5:  # Show first 5 matches
                                                print(f"[DEBUG] ✓ Matched story {work_item.get('id')}: area='{area_path}', tags='{tags}'")
                                else:
                                    print(f"[DEBUG] Batch API failed: {batch_response.text}")
                            except Exception as e:
                                print(f"[DEBUG] Error fetching batch: {str(e)}")
                            
                            # Stop if we found matches
                            if matched_count > 0:
                                print(f"[DEBUG] Found {matched_count} matching stories, stopping search")
                                break
                    
                    print(f"[DEBUG] Total matched user stories: {len(work_items)}")
                else:
                    print(f"[DEBUG] WIQL query failed: {response.status_code} - {response.text}")
                    return {"status": "error", "message": f"WIQL query failed: {response.status_code}"}
            else:
                # No board name specified, get all user stories
                wiql_query = "SELECT [System.Id] FROM WorkItems WHERE [System.WorkItemType] = 'User Story' AND [System.State] <> 'Removed'"
                if iteration_path:
                    wiql_query += f" AND [System.IterationPath] = '{iteration_path}'"
                
                response = requests.post(url, headers=wiql_headers, auth=self.auth, json={"query": wiql_query}, timeout=30, verify=False)
                if response.status_code == 200:
                    result = response.json()
                    work_items = result.get('workItems', [])
            
            # Process all found work items
            print(f"[DEBUG] Processing {len(work_items)} work items to fetch user story details")
            user_stories = []
            for item in work_items[:100]:  # Limit to 100 user stories
                story_id = item.get('id')
                print(f"[DEBUG] Fetching details for user story {story_id}")
                story_details = self.get_user_story_details(story_id)
                if story_details.get('status') == 'success':
                    user_stories.append(story_details.get('user_story'))
                    print(f"[DEBUG] Successfully fetched user story {story_id}")
                else:
                    print(f"[DEBUG] Failed to fetch user story {story_id}: {story_details.get('message')}")
            
            return {
                "status": "success",
                "user_stories": user_stories,
                "count": len(user_stories),
                "board_name_searched": board_name
            }
                
        except Exception as e:
            return {"status": "error", "message": f"Failed to get board user stories: {str(e)}"}
    
    def get_bugs_by_user_story(self, user_story_id: int) -> Dict:
        """
        Get all bugs that are children of a specific user story with detailed fields.
        
        Args:
            user_story_id: The ID of the user story
            
        Returns:
            Dictionary with bug details including lifecycle metrics
        """
        try:
            print(f"[DEBUG] Fetching bugs for user story {user_story_id}")
            # First get all child work items
            children_result = self.get_child_work_items(user_story_id)
            
            if children_result.get('status') != 'success':
                print(f"[DEBUG] Failed to get children: {children_result.get('message')}")
                return children_result
            
            child_ids = [item['id'] for item in children_result.get('work_items', [])]
            print(f"[DEBUG] Found {len(child_ids)} child work items: {child_ids}")
            
            if not child_ids:
                print(f"[DEBUG] No child work items found for user story {user_story_id}")
                return {
                    "status": "success",
                    "bugs": [],
                    "total_count": 0,
                    "message": "No child work items found for this user story. Bugs must be linked as children to appear in reports."
                }
            
            # Get detailed information for each work item
            bugs = []
            for work_item_id in child_ids:
                url = self._build_api_url(f"wit/workitems/{work_item_id}?api-version={self.api_version}")
                response = requests.get(url, headers=self.headers, auth=self.auth, timeout=10, verify=False)
                
                if response.status_code == 200:
                    work_item = response.json()
                    fields = work_item.get('fields', {})
                    work_item_type = fields.get('System.WorkItemType')
                    
                    print(f"[DEBUG] Child {work_item_id} is type: {work_item_type}")
                    
                    # Only include bugs
                    if work_item_type == 'Bug':
                        bug_data = {
                            'id': work_item.get('id'),
                            'title': fields.get('System.Title', ''),
                            'state': fields.get('System.State', ''),
                            'created_date': fields.get('System.CreatedDate', ''),
                            'resolved_date': fields.get('Microsoft.VSTS.Common.ResolvedDate'),
                            'closed_date': fields.get('Microsoft.VSTS.Common.ClosedDate'),
                            'assigned_to': fields.get('System.AssignedTo', {}).get('displayName', 'Unassigned'),
                            'tags': fields.get('System.Tags', ''),
                            'priority': fields.get('Microsoft.VSTS.Common.Priority', 3),
                            'severity': fields.get('Microsoft.VSTS.Common.Severity', '3 - Medium'),
                            'area_path': fields.get('System.AreaPath', ''),
                            'iteration_path': fields.get('System.IterationPath', ''),
                            'description': fields.get('System.Description', ''),
                            'repro_steps': fields.get('Microsoft.VSTS.TCM.ReproSteps', ''),
                            'url': work_item.get('_links', {}).get('html', {}).get('href', '')
                        }
                        bugs.append(bug_data)
                        print(f"[DEBUG] Added bug {work_item_id}: {bug_data['title']}")
            
            print(f"[DEBUG] Total bugs found: {len(bugs)}")
            
            return {
                "status": "success",
                "bugs": bugs,
                "total_count": len(bugs),
                "user_story_id": user_story_id
            }
            
        except Exception as e:
            return {"status": "error", "message": f"Failed to get bugs: {str(e)}", "bugs": []}
    
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
