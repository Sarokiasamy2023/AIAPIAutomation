import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
import os
from dotenv import load_dotenv
from chart_generator import ChartGenerator

load_dotenv()

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.sender_email = os.getenv("SENDER_EMAIL", self.smtp_username)
        self.sender_name = os.getenv("SENDER_NAME", "API Test Platform")
    
    def sendReportEmail(
        self,
        results: Dict,
        recipients: List[str],
        report_type: str = "Test Execution Report",
        attachment_path: Optional[str] = None
    ) -> Dict:
        """
        Send a professional email report with test execution results.
        
        Args:
            results: Dictionary containing test execution data
                - success_count: Number of successful tests
                - failure_count: Number of failed tests
                - total_count: Total number of tests
                - success_rate: Success rate percentage
                - metrics: Additional metrics
                - issues: List of issues found
                - notes: Additional notes
            recipients: List of email addresses to send the report to
            report_type: Type of report (default: "Test Execution Report")
            attachment_path: Optional path to Excel report file
        
        Returns:
            Dictionary with status and message
        """
        try:
            if not recipients:
                return {"status": "error", "message": "No recipients provided"}
            
            if not self.smtp_username or not self.smtp_password:
                return {"status": "error", "message": "Email credentials not configured"}
            
            subject = self._build_subject(report_type)
            body = self._build_email_body(results, recipients)
            
            msg = MIMEMultipart()
            msg['From'] = f"{self.sender_name} <{self.sender_email}>"
            msg['To'] = ", ".join(recipients)
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'html'))
            
            if attachment_path and Path(attachment_path).exists():
                self._attach_file(msg, attachment_path)
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            return {
                "status": "success",
                "message": f"Report sent successfully to {len(recipients)} recipient(s)",
                "recipients": recipients,
                "sent_at": datetime.now().isoformat()
            }
            
        except smtplib.SMTPAuthenticationError:
            return {"status": "error", "message": "Email authentication failed. Check credentials."}
        except smtplib.SMTPException as e:
            return {"status": "error", "message": f"SMTP error: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"Failed to send email: {str(e)}"}
    
    def _build_subject(self, report_type: str) -> str:
        """Build email subject line with report type and date."""
        current_date = datetime.now().strftime("%Y-%m-%d")
        return f"{report_type} - {current_date}"
    
    def _build_email_body(self, results: Dict, recipients: List[str]) -> str:
        """Generate a clean, professional HTML email body."""
        
        # Detect report type
        report_type = results.get('overall_summary', {}).get('report_type', 'test_execution')
        
        # Extract metrics based on report type
        if report_type == 'validation':
            # Validation report metrics
            overall = results.get('overall_summary', {})
            success_count = overall.get('total_passed', 0)  # Fields Correct
            failure_count = overall.get('total_failed', 0)  # Fields Incorrect
            total_count = overall.get('total_fields', 0)  # Total Fields
            total_announcements = overall.get('total_executions', 0)  # Announcements
            success_rate = overall.get('success_rate', 0)
            report_label = "Field Validation Report"
            test_label = "Fields Validated"
        else:
            # Test execution report metrics
            success_count = results.get('success_count', 0)
            failure_count = results.get('failure_count', 0)
            total_count = results.get('total_count', 0)
            total_announcements = 0
            success_rate = results.get('success_rate', 0)
            report_label = "Test Execution Report"
            test_label = "Tests Executed"
        
        metrics = results.get('metrics', {})
        issues = results.get('issues', [])
        notes = results.get('notes', '')
        
        status_color = "#28a745" if success_rate >= 80 else "#ffc107" if success_rate >= 50 else "#dc3545"
        status_text = "Excellent" if success_rate >= 80 else "Good" if success_rate >= 50 else "Needs Attention"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white !important;
                    padding: 30px;
                    border-radius: 10px 10px 0 0;
                    text-align: center;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 28px;
                    color: white !important;
                    font-weight: bold;
                }}
                .header p {{
                    margin: 10px 0 0 0;
                    opacity: 1;
                    color: white !important;
                }}
                .content {{
                    background: #ffffff;
                    padding: 30px;
                    border: 1px solid #e0e0e0;
                    border-top: none;
                }}
                .summary {{
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }}
                .metrics {{
                    display: table;
                    width: 100%;
                    margin: 20px 0;
                }}
                .metric-row {{
                    display: table-row;
                }}
                .metric-label {{
                    display: table-cell;
                    padding: 12px;
                    font-weight: 600;
                    border-bottom: 1px solid #e0e0e0;
                    width: 50%;
                }}
                .metric-value {{
                    display: table-cell;
                    padding: 12px;
                    text-align: right;
                    border-bottom: 1px solid #e0e0e0;
                    font-weight: 500;
                }}
                .status-badge {{
                    display: inline-block;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: bold;
                    color: white;
                    background-color: {status_color};
                }}
                .issues {{
                    background: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }}
                .issue-item {{
                    padding: 8px 0;
                    border-bottom: 1px solid #f0e5b8;
                }}
                .issue-item:last-child {{
                    border-bottom: none;
                }}
                .next-steps {{
                    background: #e7f3ff;
                    border-left: 4px solid #2196F3;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }}
                .footer {{
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 0 0 10px 10px;
                    text-align: center;
                    color: #666;
                    font-size: 14px;
                    border: 1px solid #e0e0e0;
                    border-top: none;
                }}
                .progress-bar {{
                    width: 100%;
                    height: 30px;
                    background: #e0e0e0;
                    border-radius: 15px;
                    overflow: hidden;
                    margin: 15px 0;
                }}
                .progress-fill {{
                    height: 100%;
                    background: {status_color};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    transition: width 0.3s ease;
                }}
            </style>
        </head>
        <body>
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #4a69bd; padding: 30px; border-radius: 10px 10px 0 0;">
                <tr>
                    <td style="text-align: center;">
                        <h1 style="margin: 0; font-size: 28px; color: #ffffff; font-weight: bold; font-family: Arial, sans-serif;">🔍 API Test Execution Report</h1>
                        <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; font-family: Arial, sans-serif;">{datetime.now().strftime("%B %d, %Y at %I:%M %p")}</p>
                    </td>
                </tr>
            </table>
            
            <div class="content">
                <p>This is your automated test execution report for the API Testing Platform. Below is a comprehensive summary of the latest test results.</p>
                
                <div class="summary">
                    <h2 style="margin-top: 0; color: #667eea;">📊 Executive Summary</h2>
                    <p>Overall Status: <span class="status-badge">{status_text}</span></p>
                    
                    <table style="width: 100%; margin: 20px 0;">
                        <tr>
                            <td style="width: 50%; vertical-align: top;">
                                <div class="metrics">"""
        
        # Add announcements row for validation reports
        if report_type == 'validation':
            html_body += f"""
                                    <div class="metric-row">
                                        <div class="metric-label">📋 Total Announcements</div>
                                        <div class="metric-value">{total_announcements}</div>
                                    </div>"""
        
        html_body += f"""
                                    <div class="metric-row">
                                        <div class="metric-label">{test_label}</div>
                                        <div class="metric-value">{total_count}</div>
                                    </div>
                                    <div class="metric-row">
                                        <div class="metric-label">✅ Correct/Passed</div>
                                        <div class="metric-value" style="color: #28a745;">{success_count}</div>
                                    </div>
                                    <div class="metric-row">
                                        <div class="metric-label">❌ Incorrect/Failed</div>
                                        <div class="metric-value" style="color: #dc3545;">{failure_count}</div>
                                    </div>
                                    <div class="metric-row">
                                        <div class="metric-label">Success Rate</div>
                                        <div class="metric-value" style="color: {status_color};">{success_rate}%</div>
                                    </div>
                                </div>
                            </td>
                            <td style="width: 50%; text-align: center; vertical-align: top;">
        """
        
        # Generate and embed HTML/CSS pie chart (works in all email clients)
        pie_chart_html = ChartGenerator.generate_html_pie_chart(success_count, failure_count)
        html_body += f"""
                                {pie_chart_html}
                            </td>
                        </tr>
                    </table>
                </div>
        """
        
        if metrics:
            html_body += """
                <h3 style="color: #667eea;">📈 Detailed Metrics</h3>
                <div class="metrics">
            """
            for key, value in metrics.items():
                html_body += f"""
                    <div class="metric-row">
                        <div class="metric-label">{key}</div>
                        <div class="metric-value">{value}</div>
                    </div>
                """
            html_body += "</div>"
        
        # Add endpoint details if available
        endpoint_details = results.get('endpoint_details', [])
        if endpoint_details:
            html_body += """
                <h3 style="color: #667eea;">🔌 Endpoint Test Results</h3>
            """
            for endpoint in endpoint_details:
                endpoint_name = endpoint.get('endpoint_name', 'Unknown Endpoint')
                scenarios = endpoint.get('scenarios', [])
                
                if scenarios:
                    passed_scenarios = sum(1 for s in scenarios if s.get('status') == 'PASS')
                    failed_scenarios = sum(1 for s in scenarios if s.get('status') == 'FAIL')
                    total_scenarios = len(scenarios)
                    
                    endpoint_status_color = "#28a745" if failed_scenarios == 0 else "#dc3545"
                    
                    html_body += f"""
                        <div style="background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid {endpoint_status_color}; border-radius: 4px;">
                            <h4 style="margin: 0 0 10px 0; color: #333;">{endpoint_name}</h4>
                            <p style="margin: 5px 0;"><strong>Method:</strong> {endpoint.get('method', 'N/A')} | <strong>Path:</strong> {endpoint.get('path', 'N/A')}</p>
                            <p style="margin: 5px 0;"><strong>Scenarios:</strong> {total_scenarios} total | ✅ {passed_scenarios} passed | ❌ {failed_scenarios} failed</p>
                    """
                    
                    # Show failed scenarios
                    failed = [s for s in scenarios if s.get('status') == 'FAIL']
                    if failed:
                        html_body += "<p style='margin: 10px 0 5px 0; font-weight: bold; color: #dc3545;'>Failed Scenarios:</p><ul style='margin: 5px 0;'>"
                        for scenario in failed[:3]:
                            html_body += f"<li>{scenario.get('name', 'Unknown')} - {scenario.get('description', '')[:100]}</li>"
                        if len(failed) > 3:
                            html_body += f"<li><em>... and {len(failed) - 3} more (see report)</em></li>"
                        html_body += "</ul>"
                    
                    html_body += "</div>"
        
        # Add passed scenarios section
        passed_scenarios = results.get('passed_scenarios', [])
        if passed_scenarios:
            html_body += f"""
                <h3 style="color: #28a745;">✅ Passed Test Scenarios ({len(passed_scenarios)})</h3>
                <div style="background: #f0f9f4; padding: 15px; border-radius: 5px; margin: 15px 0;">
            """
            for scenario in passed_scenarios[:5]:
                endpoint = scenario.get('endpoint', 'Unknown')
                scenario_name = scenario.get('scenario', 'Unknown')
                response_time = scenario.get('response_time', 0)
                html_body += f"""
                    <div style="padding: 8px 0; border-bottom: 1px solid #d4edda;">
                        <strong style="color: #155724;">{endpoint}</strong><br>
                        <span style="font-size: 13px; color: #666;">{scenario_name}</span>
                        <span style="float: right; color: #28a745; font-size: 12px;">⚡ {response_time}ms</span>
                    </div>
                """
            
            if len(passed_scenarios) > 5:
                html_body += f'<p style="margin: 10px 0 0 0; font-style: italic; color: #666;">... and {len(passed_scenarios) - 5} more passed scenarios</p>'
            
            html_body += "</div>"
        
        # Add failed scenarios section
        if issues:
            html_body += f"""
                <h3 style="color: #dc3545;">❌ Failed Test Scenarios ({len(issues)})</h3>
                <div style="background: #fff3f3; padding: 15px; border-radius: 5px; margin: 15px 0;">
            """
            for issue in issues[:5]:
                if isinstance(issue, dict):
                    endpoint = issue.get('endpoint', 'Unknown Endpoint')
                    scenario = issue.get('scenario', 'Unknown Scenario')
                    description = issue.get('description', '')
                    fail_count = issue.get('fail_count', 0)
                    pass_count = issue.get('pass_count', 0)
                    
                    if 'field' in issue:
                        # Old format
                        issue_text = f"<strong>{issue.get('field', 'Unknown')}:</strong> {issue.get('message', 'No details')}"
                        html_body += f'<div style="padding: 8px 0; border-bottom: 1px solid #f5c6cb;">• {issue_text}</div>'
                    else:
                        # New format from report parser
                        html_body += f"""
                            <div style="padding: 10px 0; border-bottom: 1px solid #f5c6cb;">
                                <strong style="color: #721c24;">{endpoint}</strong><br>
                                <span style="font-size: 13px; color: #666;">{scenario}</span><br>
                                <span style="font-size: 12px; color: #856404;">{description[:120]}{'...' if len(description) > 120 else ''}</span><br>
                                <span style="font-size: 11px; color: #dc3545;">Failed: {fail_count} | Passed: {pass_count}</span>
                            </div>
                        """
                else:
                    html_body += f'<div style="padding: 8px 0; border-bottom: 1px solid #f5c6cb;">• {str(issue)}</div>'
            
            if len(issues) > 5:
                html_body += f'<p style="margin: 10px 0 0 0; font-style: italic; color: #666;">... and {len(issues) - 5} more failed scenarios (see attached report)</p>'
            
            html_body += "</div>"
        
        html_body += """
                <h3 style="color: #2196F3;">🎯 Next Steps & Recommendations</h3>
                <div class="next-steps">
        """
        
        if failure_count > 0:
            html_body += f"""
                    <p><strong>Action Required:</strong></p>
                    <ul>
                        <li>Review the {failure_count} failed test case(s) in the attached report</li>
                        <li>Investigate root causes for failures</li>
                        <li>Update test scenarios or fix API issues as needed</li>
                        <li>Re-run tests after fixes are applied</li>
                    </ul>
            """
        else:
            html_body += """
                    <p><strong>Great Job! All tests passed successfully.</strong></p>
                    <ul>
                        <li>Continue monitoring API performance</li>
                        <li>Consider adding more test scenarios for edge cases</li>
                        <li>Review and update test data regularly</li>
                    </ul>
            """
        
        if notes:
            html_body += f"<p><strong>Additional Notes:</strong> {notes}</p>"
        
        html_body += """
                </div>
                
                <p style="margin-top: 30px;">For detailed analysis, please refer to the attached Excel report or access the dashboard at your convenience.</p>
                
                <p>If you have any questions or need assistance, please don't hesitate to reach out.</p>
                
                <p style="margin-top: 20px;">Best regards,<br>
                <strong>API Test Automation Platform</strong></p>
            </div>
            
            <div class="footer">
                <p>This is an automated report generated by the API Testing Platform.</p>
                <p style="margin: 5px 0;">© 2026 API Test Platform. All rights reserved.</p>
            </div>
        </body>
        </html>
        """
        
        return html_body
    
    def _attach_file(self, msg: MIMEMultipart, file_path: str):
        """Attach a file to the email message."""
        try:
            with open(file_path, "rb") as attachment:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(attachment.read())
            
            encoders.encode_base64(part)
            filename = Path(file_path).name
            part.add_header(
                "Content-Disposition",
                f"attachment; filename= {filename}",
            )
            msg.attach(part)
        except Exception as e:
            print(f"Warning: Could not attach file {file_path}: {str(e)}")
    
    def test_connection(self) -> Dict:
        """Test SMTP connection and credentials."""
        try:
            if not self.smtp_username or not self.smtp_password:
                return {"status": "error", "message": "Email credentials not configured"}
            
            print(f"Testing SMTP connection to {self.smtp_server}:{self.smtp_port}")
            print(f"Username: {self.smtp_username}")
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=15) as server:
                server.set_debuglevel(1)  # Enable debug output
                print("Starting TLS...")
                server.starttls()
                print("Attempting login...")
                server.login(self.smtp_username, self.smtp_password)
                print("Login successful!")
            
            return {"status": "success", "message": "Email configuration is valid"}
        except smtplib.SMTPAuthenticationError as e:
            error_msg = f"Authentication failed: {str(e)}"
            print(f"Auth error: {error_msg}")
            return {"status": "error", "message": "Authentication failed. Check username and password."}
        except smtplib.SMTPException as e:
            error_msg = f"SMTP error: {str(e)}"
            print(f"SMTP error: {error_msg}")
            return {"status": "error", "message": error_msg}
        except Exception as e:
            error_msg = f"Connection failed: {str(e)}"
            print(f"Connection error: {error_msg}")
            return {"status": "error", "message": error_msg}
