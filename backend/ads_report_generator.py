"""
Azure DevOps Automation Reporter
Generates executive-level daily status reports based on bugs linked to user stories.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json
from collections import defaultdict


class ADSReportGenerator:
    """Generate comprehensive Azure DevOps status reports with visualizations."""
    
    def __init__(self):
        self.api_categories = {
            'Announcement': ['announcement', 'announcements'],
            'Application': ['application', 'applications'],
            'Terms and Conditions': ['terms', 'conditions', 'terms and conditions', 'termsandconditions'],
            'Awards': ['awards', 'award'],
            'DSS': ['dss'],
            'Other': []
        }
    
    def categorize_bug(self, bug: Dict) -> str:
        """Categorize bug based on title and tags."""
        title_lower = bug.get('title', '').lower()
        tags_lower = bug.get('tags', '').lower()
        
        for category, keywords in self.api_categories.items():
            if category == 'Other':
                continue
            for keyword in keywords:
                if keyword in title_lower or keyword in tags_lower:
                    return category
        
        return 'Other'
    
    def calculate_bug_metrics(self, bug: Dict) -> Dict:
        """Calculate lifecycle metrics for a bug."""
        created_date = datetime.fromisoformat(bug['created_date'].replace('Z', '+00:00'))
        current_date = datetime.now(created_date.tzinfo)
        
        metrics = {
            'created_date': created_date,
            'age_days': (current_date - created_date).days,
            'days_in_cycle': None,
            'is_active': True,
            'lifecycle_status': 'Active'
        }
        
        # Check if bug is resolved or closed
        if bug.get('resolved_date'):
            resolved_date = datetime.fromisoformat(bug['resolved_date'].replace('Z', '+00:00'))
            metrics['days_in_cycle'] = (resolved_date - created_date).days
            metrics['is_active'] = False
            metrics['lifecycle_status'] = 'Resolved'
        elif bug.get('closed_date'):
            closed_date = datetime.fromisoformat(bug['closed_date'].replace('Z', '+00:00'))
            metrics['days_in_cycle'] = (closed_date - created_date).days
            metrics['is_active'] = False
            metrics['lifecycle_status'] = 'Closed'
        
        return metrics
    
    def process_bugs(self, bugs: List[Dict]) -> Dict:
        """Process bugs and generate comprehensive metrics."""
        categorized_bugs = defaultdict(list)
        total_metrics = {
            'total_bugs': len(bugs),
            'active_bugs': 0,
            'resolved_bugs': 0,
            'closed_bugs': 0,
            'avg_age_active': 0,
            'avg_cycle_time': 0,
            'by_state': defaultdict(int),
            'by_priority': defaultdict(int),
            'by_severity': defaultdict(int),
            'by_category': defaultdict(int)
        }
        
        active_ages = []
        cycle_times = []
        
        for bug in bugs:
            # Calculate metrics
            metrics = self.calculate_bug_metrics(bug)
            bug['metrics'] = metrics
            
            # Categorize
            category = self.categorize_bug(bug)
            bug['category'] = category
            categorized_bugs[category].append(bug)
            
            # Aggregate metrics
            total_metrics['by_state'][bug['state']] += 1
            total_metrics['by_priority'][bug.get('priority', 3)] += 1
            total_metrics['by_severity'][bug.get('severity', '3 - Medium')] += 1
            total_metrics['by_category'][category] += 1
            
            if metrics['is_active']:
                total_metrics['active_bugs'] += 1
                active_ages.append(metrics['age_days'])
            else:
                if bug['state'] == 'Resolved':
                    total_metrics['resolved_bugs'] += 1
                else:
                    total_metrics['closed_bugs'] += 1
                
                if metrics['days_in_cycle'] is not None:
                    cycle_times.append(metrics['days_in_cycle'])
        
        # Calculate averages
        if active_ages:
            total_metrics['avg_age_active'] = sum(active_ages) / len(active_ages)
        if cycle_times:
            total_metrics['avg_cycle_time'] = sum(cycle_times) / len(cycle_times)
        
        return {
            'categorized_bugs': dict(categorized_bugs),
            'metrics': total_metrics,
            'bugs': bugs
        }
    
    def generate_html_report(self, processed_data: Dict, user_story_id: int, test_results: Optional[Dict] = None) -> str:
        """Generate a comprehensive HTML report with charts and visualizations."""
        
        metrics = processed_data['metrics']
        categorized_bugs = processed_data['categorized_bugs']
        bugs = processed_data['bugs']
        
        # Generate report timestamp
        report_date = datetime.now().strftime('%B %d, %Y at %I:%M %p')
        
        html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Azure DevOps Automation Report - User Story {user_story_id}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            color: #333;
        }}
        
        .container {{
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            overflow: hidden;
        }}
        
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }}
        
        .header h1 {{
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 600;
        }}
        
        .header .subtitle {{
            font-size: 1.1em;
            opacity: 0.95;
        }}
        
        .header .report-meta {{
            margin-top: 20px;
            font-size: 0.95em;
            opacity: 0.9;
        }}
        
        .tabs {{
            display: flex;
            background: #f8f9fa;
            border-bottom: 2px solid #e9ecef;
            overflow-x: auto;
        }}
        
        .tab {{
            padding: 18px 30px;
            cursor: pointer;
            border: none;
            background: none;
            font-size: 1em;
            font-weight: 500;
            color: #6c757d;
            transition: all 0.3s;
            white-space: nowrap;
        }}
        
        .tab:hover {{
            background: #e9ecef;
            color: #495057;
        }}
        
        .tab.active {{
            color: #667eea;
            border-bottom: 3px solid #667eea;
            background: white;
        }}
        
        .tab-content {{
            display: none;
            padding: 40px;
            animation: fadeIn 0.3s;
        }}
        
        .tab-content.active {{
            display: block;
        }}
        
        @keyframes fadeIn {{
            from {{ opacity: 0; transform: translateY(10px); }}
            to {{ opacity: 1; transform: translateY(0); }}
        }}
        
        .metrics-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        
        .metric-card {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }}
        
        .metric-card.success {{
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        }}
        
        .metric-card.warning {{
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }}
        
        .metric-card.info {{
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }}
        
        .metric-label {{
            font-size: 0.9em;
            opacity: 0.9;
            margin-bottom: 8px;
        }}
        
        .metric-value {{
            font-size: 2.5em;
            font-weight: 700;
        }}
        
        .metric-subtext {{
            font-size: 0.85em;
            opacity: 0.85;
            margin-top: 5px;
        }}
        
        .section {{
            margin-bottom: 40px;
        }}
        
        .section-title {{
            font-size: 1.8em;
            color: #667eea;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #667eea;
            display: flex;
            align-items: center;
        }}
        
        .section-title::before {{
            content: '📊';
            margin-right: 10px;
        }}
        
        .chart-container {{
            background: #f8f9fa;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }}
        
        .bar-chart {{
            display: flex;
            flex-direction: column;
            gap: 15px;
        }}
        
        .bar-item {{
            display: flex;
            align-items: center;
            gap: 15px;
        }}
        
        .bar-label {{
            min-width: 180px;
            font-weight: 500;
            color: #495057;
        }}
        
        .bar-container {{
            flex: 1;
            background: #e9ecef;
            border-radius: 20px;
            height: 30px;
            position: relative;
            overflow: hidden;
        }}
        
        .bar-fill {{
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            transition: width 0.5s ease;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 10px;
            color: white;
            font-weight: 600;
            font-size: 0.9em;
        }}
        
        .bar-fill.success {{
            background: linear-gradient(90deg, #11998e 0%, #38ef7d 100%);
        }}
        
        .bar-fill.warning {{
            background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
        }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        
        thead {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }}
        
        th {{
            padding: 15px;
            text-align: left;
            font-weight: 600;
        }}
        
        td {{
            padding: 12px 15px;
            border-bottom: 1px solid #e9ecef;
        }}
        
        tr:hover {{
            background: #f8f9fa;
        }}
        
        .badge {{
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
        }}
        
        .badge.active {{
            background: #ffc107;
            color: #000;
        }}
        
        .badge.resolved {{
            background: #28a745;
            color: white;
        }}
        
        .badge.closed {{
            background: #6c757d;
            color: white;
        }}
        
        .badge.new {{
            background: #17a2b8;
            color: white;
        }}
        
        .priority-high {{
            color: #dc3545;
            font-weight: 600;
        }}
        
        .priority-medium {{
            color: #ffc107;
            font-weight: 600;
        }}
        
        .priority-low {{
            color: #28a745;
            font-weight: 600;
        }}
        
        .executive-summary {{
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            border-left: 5px solid #667eea;
        }}
        
        .executive-summary h3 {{
            color: #667eea;
            margin-bottom: 15px;
        }}
        
        .executive-summary p {{
            line-height: 1.8;
            color: #495057;
            margin-bottom: 10px;
        }}
        
        .pie-chart {{
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 30px 0;
        }}
        
        .pie-chart svg {{
            max-width: 400px;
            height: auto;
        }}
        
        .legend {{
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-top: 20px;
            justify-content: center;
        }}
        
        .legend-item {{
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        
        .legend-color {{
            width: 20px;
            height: 20px;
            border-radius: 4px;
        }}
        
        .api-block {{
            background: white;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            transition: all 0.3s;
        }}
        
        .api-block:hover {{
            border-color: #667eea;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
        }}
        
        .api-block-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }}
        
        .api-block-title {{
            font-size: 1.3em;
            font-weight: 600;
            color: #667eea;
        }}
        
        .api-block-stats {{
            display: flex;
            gap: 20px;
        }}
        
        .stat {{
            text-align: center;
        }}
        
        .stat-value {{
            font-size: 1.5em;
            font-weight: 700;
        }}
        
        .stat-label {{
            font-size: 0.85em;
            color: #6c757d;
        }}
        
        .footer {{
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 0.9em;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Azure DevOps Automation Report</h1>
            <div class="subtitle">User Story #{user_story_id} - Daily Status Report</div>
            <div class="report-meta">Generated on {report_date}</div>
        </div>
        
        <div class="tabs">
            <button class="tab active" onclick="showTab('executive')">Executive Summary</button>
            <button class="tab" onclick="showTab('overview')">Overview</button>
            <button class="tab" onclick="showTab('api-blocks')">API Blocks</button>
            <button class="tab" onclick="showTab('lifetime')">Bug Lifetime</button>
            <button class="tab" onclick="showTab('details')">Detailed Analysis</button>
        </div>
        
        <!-- Executive Summary Tab -->
        <div id="executive" class="tab-content active">
            <div class="section">
                <div class="section-title">Executive Summary</div>
                
                <div class="executive-summary">
                    <h3>📋 Overview</h3>
                    <p>
                        This report provides a comprehensive analysis of <strong>{metrics['total_bugs']} bugs</strong> 
                        linked to User Story #{user_story_id}. The bugs are categorized across multiple API blocks 
                        with detailed lifecycle metrics and execution status.
                    </p>
                    <p>
                        <strong>Current Status:</strong> {metrics['active_bugs']} active bugs, 
                        {metrics['resolved_bugs']} resolved, and {metrics['closed_bugs']} closed.
                        Average age of active bugs: <strong>{metrics['avg_age_active']:.1f} days</strong>.
                        Average resolution time: <strong>{metrics['avg_cycle_time']:.1f} days</strong>.
                    </p>
                </div>
                
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-label">Total Bugs</div>
                        <div class="metric-value">{metrics['total_bugs']}</div>
                        <div class="metric-subtext">Across all API blocks</div>
                    </div>
                    <div class="metric-card warning">
                        <div class="metric-label">Active Bugs</div>
                        <div class="metric-value">{metrics['active_bugs']}</div>
                        <div class="metric-subtext">Requiring attention</div>
                    </div>
                    <div class="metric-card success">
                        <div class="metric-label">Resolved Bugs</div>
                        <div class="metric-value">{metrics['resolved_bugs']}</div>
                        <div class="metric-subtext">Successfully fixed</div>
                    </div>
                    <div class="metric-card info">
                        <div class="metric-label">Avg Cycle Time</div>
                        <div class="metric-value">{metrics['avg_cycle_time']:.1f}</div>
                        <div class="metric-subtext">Days to resolution</div>
                    </div>
                </div>
"""
        
        # Add test execution metrics if provided
        if test_results:
            html += self._generate_test_execution_section(test_results)
        
        html += """
            </div>
        </div>
        
        <!-- Overview Tab -->
        <div id="overview" class="tab-content">
            <div class="section">
                <div class="section-title">Bug Distribution Overview</div>
                
                <div class="chart-container">
                    <h3 style="margin-bottom: 20px;">Bugs by State</h3>
                    <div class="bar-chart">
"""
        
        # Generate state distribution chart
        max_count = max(metrics['by_state'].values()) if metrics['by_state'] else 1
        for state, count in sorted(metrics['by_state'].items(), key=lambda x: x[1], reverse=True):
            percentage = (count / max_count) * 100
            bar_class = 'success' if state in ['Resolved', 'Closed'] else 'warning' if state == 'Active' else ''
            html += f"""
                        <div class="bar-item">
                            <div class="bar-label">{state}</div>
                            <div class="bar-container">
                                <div class="bar-fill {bar_class}" style="width: {percentage}%">{count}</div>
                            </div>
                        </div>
"""
        
        html += """
                    </div>
                </div>
                
                <div class="chart-container">
                    <h3 style="margin-bottom: 20px;">Bugs by Category</h3>
                    <div class="bar-chart">
"""
        
        # Generate category distribution chart
        max_count = max(metrics['by_category'].values()) if metrics['by_category'] else 1
        for category, count in sorted(metrics['by_category'].items(), key=lambda x: x[1], reverse=True):
            percentage = (count / max_count) * 100
            html += f"""
                        <div class="bar-item">
                            <div class="bar-label">{category} API</div>
                            <div class="bar-container">
                                <div class="bar-fill" style="width: {percentage}%">{count}</div>
                            </div>
                        </div>
"""
        
        html += """
                    </div>
                </div>
            </div>
        </div>
        
        <!-- API Blocks Tab -->
        <div id="api-blocks" class="tab-content">
            <div class="section">
                <div class="section-title">API Block Breakdown</div>
"""
        
        # Generate API block sections
        for category, category_bugs in categorized_bugs.items():
            active_count = sum(1 for b in category_bugs if b['metrics']['is_active'])
            resolved_count = sum(1 for b in category_bugs if not b['metrics']['is_active'])
            
            html += f"""
                <div class="api-block">
                    <div class="api-block-header">
                        <div class="api-block-title">🔹 {category} API</div>
                        <div class="api-block-stats">
                            <div class="stat">
                                <div class="stat-value" style="color: #ffc107;">{active_count}</div>
                                <div class="stat-label">Active</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value" style="color: #28a745;">{resolved_count}</div>
                                <div class="stat-label">Resolved</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value" style="color: #667eea;">{len(category_bugs)}</div>
                                <div class="stat-label">Total</div>
                            </div>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Bug ID</th>
                                <th>Title</th>
                                <th>State</th>
                                <th>Priority</th>
                                <th>Age/Cycle</th>
                            </tr>
                        </thead>
                        <tbody>
"""
            
            for bug in category_bugs[:10]:  # Show top 10 bugs per category
                state_badge = 'active' if bug['metrics']['is_active'] else 'resolved' if bug['state'] == 'Resolved' else 'closed'
                priority_class = 'priority-high' if bug.get('priority', 3) <= 2 else 'priority-medium' if bug.get('priority', 3) == 3 else 'priority-low'
                
                days_display = f"{bug['metrics']['age_days']} days (Active)" if bug['metrics']['is_active'] else f"{bug['metrics']['days_in_cycle']} days (Cycle)"
                
                html += f"""
                            <tr>
                                <td><a href="{bug.get('url', '#')}" target="_blank">#{bug['id']}</a></td>
                                <td>{bug['title'][:80]}...</td>
                                <td><span class="badge {state_badge}">{bug['state']}</span></td>
                                <td class="{priority_class}">P{bug.get('priority', 3)}</td>
                                <td>{days_display}</td>
                            </tr>
"""
            
            html += """
                        </tbody>
                    </table>
                </div>
"""
        
        html += """
            </div>
        </div>
        
        <!-- Bug Lifetime Tab -->
        <div id="lifetime" class="tab-content">
            <div class="section">
                <div class="section-title">Bug Lifetime Analysis</div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Bug ID</th>
                            <th>Title</th>
                            <th>Category</th>
                            <th>State</th>
                            <th>Created Date</th>
                            <th>Days in Cycle</th>
                            <th>Age (Active)</th>
                            <th>Assigned To</th>
                        </tr>
                    </thead>
                    <tbody>
"""
        
        # Sort bugs by age/cycle time
        sorted_bugs = sorted(bugs, key=lambda x: x['metrics']['age_days'], reverse=True)
        
        for bug in sorted_bugs:
            state_badge = 'active' if bug['metrics']['is_active'] else 'resolved' if bug['state'] == 'Resolved' else 'closed'
            created_str = bug['metrics']['created_date'].strftime('%Y-%m-%d')
            cycle_days = bug['metrics']['days_in_cycle'] if bug['metrics']['days_in_cycle'] is not None else '-'
            age_days = bug['metrics']['age_days'] if bug['metrics']['is_active'] else '-'
            
            html += f"""
                        <tr>
                            <td><a href="{bug.get('url', '#')}" target="_blank">#{bug['id']}</a></td>
                            <td>{bug['title'][:60]}...</td>
                            <td>{bug['category']}</td>
                            <td><span class="badge {state_badge}">{bug['state']}</span></td>
                            <td>{created_str}</td>
                            <td>{cycle_days}</td>
                            <td>{age_days}</td>
                            <td>{bug.get('assigned_to', 'Unassigned')}</td>
                        </tr>
"""
        
        html += """
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Detailed Analysis Tab -->
        <div id="details" class="tab-content">
            <div class="section">
                <div class="section-title">Detailed Bug Analysis</div>
                
                <div class="chart-container">
                    <h3 style="margin-bottom: 20px;">Priority Distribution</h3>
                    <div class="bar-chart">
"""
        
        # Generate priority distribution
        priority_labels = {1: 'P1 - Critical', 2: 'P2 - High', 3: 'P3 - Medium', 4: 'P4 - Low'}
        max_count = max(metrics['by_priority'].values()) if metrics['by_priority'] else 1
        for priority in sorted(metrics['by_priority'].keys()):
            count = metrics['by_priority'][priority]
            percentage = (count / max_count) * 100
            bar_class = 'warning' if priority <= 2 else ''
            html += f"""
                        <div class="bar-item">
                            <div class="bar-label">{priority_labels.get(priority, f'P{priority}')}</div>
                            <div class="bar-container">
                                <div class="bar-fill {bar_class}" style="width: {percentage}%">{count}</div>
                            </div>
                        </div>
"""
        
        html += """
                    </div>
                </div>
                
                <div class="chart-container">
                    <h3 style="margin-bottom: 20px;">Severity Distribution</h3>
                    <div class="bar-chart">
"""
        
        # Generate severity distribution
        max_count = max(metrics['by_severity'].values()) if metrics['by_severity'] else 1
        for severity, count in sorted(metrics['by_severity'].items(), key=lambda x: x[0]):
            percentage = (count / max_count) * 100
            bar_class = 'warning' if '1' in severity or '2' in severity else ''
            html += f"""
                        <div class="bar-item">
                            <div class="bar-label">{severity}</div>
                            <div class="bar-container">
                                <div class="bar-fill {bar_class}" style="width: {percentage}%">{count}</div>
                            </div>
                        </div>
"""
        
        html += """
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Azure DevOps Automation Reporter | Generated by GS API Test Platform</p>
            <p>© 2026 All Rights Reserved</p>
        </div>
    </div>
    
    <script>
        function showTab(tabName) {
            // Hide all tab contents
            const contents = document.querySelectorAll('.tab-content');
            contents.forEach(content => content.classList.remove('active'));
            
            // Remove active class from all tabs
            const tabs = document.querySelectorAll('.tab');
            tabs.forEach(tab => tab.classList.remove('active'));
            
            // Show selected tab content
            document.getElementById(tabName).classList.add('active');
            
            // Add active class to clicked tab
            event.target.classList.add('active');
        }
    </script>
</body>
</html>
"""
        
        return html
    
    def _generate_test_execution_section(self, test_results: Dict) -> str:
        """Generate test execution metrics section."""
        total_tests = test_results.get('total_tests', 0)
        passed = test_results.get('passed', 0)
        failed = test_results.get('failed', 0)
        pass_rate = (passed / total_tests * 100) if total_tests > 0 else 0
        
        return f"""
                <div class="section">
                    <div class="section-title">Test Execution Metrics</div>
                    
                    <div class="metrics-grid">
                        <div class="metric-card info">
                            <div class="metric-label">Total Tests</div>
                            <div class="metric-value">{total_tests}</div>
                            <div class="metric-subtext">Executed today</div>
                        </div>
                        <div class="metric-card success">
                            <div class="metric-label">Passed</div>
                            <div class="metric-value">{passed}</div>
                            <div class="metric-subtext">{pass_rate:.1f}% success rate</div>
                        </div>
                        <div class="metric-card warning">
                            <div class="metric-label">Failed</div>
                            <div class="metric-value">{failed}</div>
                            <div class="metric-subtext">Requires attention</div>
                        </div>
                    </div>
                </div>
"""
