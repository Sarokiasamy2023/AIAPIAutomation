"""
Enhanced Azure DevOps Automation Reporter
Generates executive-level reports with advanced visualizations, User Story details, and modern styling.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json
from collections import defaultdict
from html import escape as html_escape


class EnhancedADSReportGenerator:
    """Generate comprehensive Azure DevOps status reports with advanced visualizations."""
    
    def __init__(self):
        self.api_categories = {
            'Announcement': ['announcement', 'announcements'],
            'Application': ['application', 'applications'],
            'Terms and Conditions': ['terms', 'conditions', 'terms and conditions', 'termsandconditions'],
            'Awards': ['awards', 'award'],
            'DSS': ['dss'],
            'Other': []
        }
        
        self.chart_colors = [
            '#667eea', '#764ba2', '#f093fb', '#f5576c',
            '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
            '#fa709a', '#fee140', '#30cfd0', '#330867'
        ]
        
        # O&M categorization
        self.om_keywords = ['o&m', 'o & m', 'operations', 'maintenance']
        
        # Environment categorization
        self.environment_keywords = {
            'Dev': ['dev', 'development', 'local'],
            'Test': ['test', 'testing', 'qa', 'uat', 'staging'],
            'Prod': ['prod', 'production', 'live']
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
    
    def categorize_om(self, bug: Dict) -> str:
        """Categorize bug as O&M or DME based on tags and title."""
        title = bug.get('title', '').lower()
        tags = bug.get('tags', '').lower()
        
        # O&M keywords
        om_keywords = ['o&m', 'o & m', 'operations', 'maintenance', 'support', 'operational']
        
        # Check if any O&M keyword is in title or tags
        for keyword in om_keywords:
            if keyword in title or keyword in tags:
                return 'O&M'
        
        return 'DME'
    
    def categorize_environment(self, bug: Dict) -> str:
        """Categorize bug by environment based on title and tags."""
        title_lower = bug.get('title', '').lower()
        tags_lower = bug.get('tags', '').lower()
        combined = f"{title_lower} {tags_lower}"
        
        for env, keywords in self.environment_keywords.items():
            for keyword in keywords:
                if keyword in combined:
                    return env
        
        return 'Unknown'
    
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
            'by_category': defaultdict(int),
            'by_om': defaultdict(int),
            'by_environment': defaultdict(int),
            'trend_data': []
        }
        
        active_ages = []
        cycle_times = []
        bugs_by_date = defaultdict(int)
        
        for bug in bugs:
            metrics = self.calculate_bug_metrics(bug)
            bug['metrics'] = metrics
            
            category = self.categorize_bug(bug)
            bug['category'] = category
            categorized_bugs[category].append(bug)
            
            # O&M categorization
            om_category = self.categorize_om(bug)
            bug['om_category'] = om_category
            
            # Environment categorization
            environment = self.categorize_environment(bug)
            bug['environment'] = environment
            
            total_metrics['by_state'][bug['state']] += 1
            total_metrics['by_priority'][bug.get('priority', 3)] += 1
            total_metrics['by_severity'][bug.get('severity', '3 - Medium')] += 1
            total_metrics['by_category'][category] += 1
            total_metrics['by_om'][om_category] += 1
            total_metrics['by_environment'][environment] += 1
            
            # Track creation date for trend
            created_date_str = metrics['created_date'].strftime('%Y-%m-%d')
            bugs_by_date[created_date_str] += 1
            
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
        
        if active_ages:
            total_metrics['avg_age_active'] = sum(active_ages) / len(active_ages)
        if cycle_times:
            total_metrics['avg_cycle_time'] = sum(cycle_times) / len(cycle_times)
        
        # Generate trend data (last 30 days)
        total_metrics['trend_data'] = sorted(bugs_by_date.items())
        
        return {
            'categorized_bugs': dict(categorized_bugs),
            'metrics': total_metrics,
            'bugs': bugs
        }
    
    def generate_pie_chart_svg(self, data: Dict, title: str, width: int = 400, height: int = 400) -> str:
        """Generate SVG pie chart."""
        if not data or sum(data.values()) == 0:
            return ""
        
        total = sum(data.values())
        cx, cy = width / 2, height / 2
        radius = min(width, height) / 2 - 40
        
        svg_parts = [f'<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}">']
        svg_parts.append(f'<text x="{cx}" y="30" text-anchor="middle" font-size="18" font-weight="bold" fill="#333">{title}</text>')
        
        start_angle = 0
        for idx, (label, value) in enumerate(sorted(data.items(), key=lambda x: x[1], reverse=True)):
            percentage = value / total
            angle = percentage * 360
            
            # Calculate arc path
            end_angle = start_angle + angle
            start_rad = start_angle * 3.14159 / 180
            end_rad = end_angle * 3.14159 / 180
            
            x1 = cx + radius * math.cos(start_rad)
            y1 = cy + radius * math.sin(start_rad)
            x2 = cx + radius * math.cos(end_rad)
            y2 = cy + radius * math.sin(end_rad)
            
            large_arc = 1 if angle > 180 else 0
            
            color = self.chart_colors[idx % len(self.chart_colors)]
            
            path = f'M {cx},{cy} L {x1},{y1} A {radius},{radius} 0 {large_arc},1 {x2},{y2} Z'
            svg_parts.append(f'<path d="{path}" fill="{color}" stroke="white" stroke-width="2"/>')
            
            # Add label
            mid_angle = (start_angle + end_angle) / 2
            mid_rad = mid_angle * 3.14159 / 180
            label_x = cx + (radius * 0.7) * math.cos(mid_rad)
            label_y = cy + (radius * 0.7) * math.sin(mid_rad)
            
            if percentage > 0.05:  # Only show label if slice is > 5%
                svg_parts.append(f'<text x="{label_x}" y="{label_y}" text-anchor="middle" font-size="12" font-weight="bold" fill="white">{value}</text>')
            
            start_angle = end_angle
        
        svg_parts.append('</svg>')
        return ''.join(svg_parts)
    
    def strip_html(self, text: str) -> str:
        """Strip HTML tags from text."""
        if not text:
            return ""
        # Simple HTML stripping
        import re
        clean = re.compile('<.*?>')
        return re.sub(clean, '', text)
    
    def generate_html_report(self, processed_data: Dict, user_story: Optional[Dict] = None, test_results: Optional[Dict] = None, show_user_story_details: bool = True) -> str:
        """Generate a comprehensive HTML report with advanced visualizations."""
        
        metrics = processed_data['metrics']
        categorized_bugs = processed_data['categorized_bugs']
        bugs = processed_data['bugs']
        
        report_date = datetime.now().strftime('%B %d, %Y at %I:%M %p')
        
        # Clean user story description and acceptance criteria
        if user_story:
            description = self.strip_html(user_story.get('description', ''))
            acceptance_criteria = self.strip_html(user_story.get('acceptance_criteria', ''))
        else:
            description = ''
            acceptance_criteria = ''
            show_user_story_details = False
        
        report_title = f"User Story {user_story['id']}" if user_story else "Board Report"
        
        html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Azure DevOps Report - {report_title}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
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
            max-width: 1600px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
            animation: slideIn 0.5s ease-out;
        }}
        
        @keyframes slideIn {{
            from {{ opacity: 0; transform: translateY(30px); }}
            to {{ opacity: 1; transform: translateY(0); }}
        }}
        
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 50px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }}
        
        .header::before {{
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: pulse 15s ease-in-out infinite;
        }}
        
        @keyframes pulse {{
            0%, 100% {{ transform: scale(1); }}
            50% {{ transform: scale(1.1); }}
        }}
        
        .header h1 {{
            font-size: 3em;
            margin-bottom: 15px;
            font-weight: 700;
            position: relative;
            z-index: 1;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }}
        
        .header .subtitle {{
            font-size: 1.3em;
            opacity: 0.95;
            position: relative;
            z-index: 1;
        }}
        
        .header .report-meta {{
            margin-top: 25px;
            font-size: 1em;
            opacity: 0.9;
            position: relative;
            z-index: 1;
        }}
        
        .user-story-section {{
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 40px;
            border-bottom: 3px solid #667eea;
        }}
        
        .user-story-header {{
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 30px;
            flex-wrap: wrap;
            gap: 20px;
        }}
        
        .user-story-title {{
            flex: 1;
            min-width: 300px;
        }}
        
        .user-story-title h2 {{
            color: #667eea;
            font-size: 2em;
            margin-bottom: 10px;
        }}
        
        .user-story-title .story-id {{
            color: #6c757d;
            font-size: 1.1em;
        }}
        
        .user-story-meta {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
        }}
        
        .meta-item {{
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            text-align: center;
        }}
        
        .meta-label {{
            font-size: 0.85em;
            color: #6c757d;
            margin-bottom: 5px;
        }}
        
        .meta-value {{
            font-size: 1.3em;
            font-weight: 700;
            color: #667eea;
        }}
        
        .user-story-details {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-top: 20px;
        }}
        
        @media (max-width: 968px) {{
            .user-story-details {{
                grid-template-columns: 1fr;
            }}
        }}
        
        .detail-box {{
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        
        .detail-box h3 {{
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.3em;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }}
        
        .detail-box p {{
            line-height: 1.8;
            color: #495057;
            white-space: pre-wrap;
        }}
        
        .tags {{
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
        }}
        
        .tag {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
        }}
        
        .tabs {{
            display: flex;
            background: #f8f9fa;
            border-bottom: 3px solid #e9ecef;
            overflow-x: auto;
            position: sticky;
            top: 0;
            z-index: 100;
        }}
        
        .tab {{
            padding: 20px 35px;
            cursor: pointer;
            border: none;
            background: none;
            font-size: 1.05em;
            font-weight: 600;
            color: #6c757d;
            transition: all 0.3s;
            white-space: nowrap;
            position: relative;
        }}
        
        .tab:hover {{
            background: #e9ecef;
            color: #495057;
        }}
        
        .tab.active {{
            color: #667eea;
            background: white;
        }}
        
        .tab.active::after {{
            content: '';
            position: absolute;
            bottom: -3px;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }}
        
        .tab-content {{
            display: none;
            padding: 50px;
            animation: fadeIn 0.4s;
        }}
        
        .tab-content.active {{
            display: block;
        }}
        
        @keyframes fadeIn {{
            from {{ opacity: 0; transform: translateY(20px); }}
            to {{ opacity: 1; transform: translateY(0); }}
        }}
        
        .metrics-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
        }}
        
        .metric-card {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
            transition: transform 0.3s, box-shadow 0.3s;
            position: relative;
            overflow: hidden;
        }}
        
        .metric-card::before {{
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        }}
        
        .metric-card:hover {{
            transform: translateY(-5px);
            box-shadow: 0 12px 35px rgba(102, 126, 234, 0.5);
        }}
        
        .metric-card.success {{
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            box-shadow: 0 8px 25px rgba(17, 153, 142, 0.4);
        }}
        
        .metric-card.warning {{
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            box-shadow: 0 8px 25px rgba(240, 147, 251, 0.4);
        }}
        
        .metric-card.info {{
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            box-shadow: 0 8px 25px rgba(79, 172, 254, 0.4);
        }}
        
        .metric-label {{
            font-size: 0.95em;
            opacity: 0.9;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
        }}
        
        .metric-value {{
            font-size: 3em;
            font-weight: 700;
            position: relative;
            z-index: 1;
        }}
        
        .metric-subtext {{
            font-size: 0.9em;
            opacity: 0.85;
            margin-top: 8px;
            position: relative;
            z-index: 1;
        }}
        
        .section {{
            margin-bottom: 50px;
        }}
        
        .section-title {{
            font-size: 2em;
            color: #667eea;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 3px solid #667eea;
            display: flex;
            align-items: center;
        }}
        
        .section-title::before {{
            content: '📊';
            margin-right: 15px;
            font-size: 1.2em;
        }}
        
        .chart-container {{
            background: #f8f9fa;
            padding: 35px;
            border-radius: 12px;
            margin-bottom: 35px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }}
        
        .chart-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 30px;
            margin-bottom: 30px;
        }}
        
        .chart-box {{
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        
        .chart-box h3 {{
            color: #667eea;
            margin-bottom: 20px;
            font-size: 1.3em;
        }}
        
        canvas {{
            max-height: 300px;
        }}
        
        .bar-chart {{
            display: flex;
            flex-direction: column;
            gap: 18px;
        }}
        
        .bar-item {{
            display: flex;
            align-items: center;
            gap: 18px;
        }}
        
        .bar-label {{
            min-width: 200px;
            font-weight: 600;
            color: #495057;
        }}
        
        .bar-container {{
            flex: 1;
            background: #e9ecef;
            border-radius: 25px;
            height: 35px;
            position: relative;
            overflow: hidden;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }}
        
        .bar-fill {{
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            border-radius: 25px;
            transition: width 0.8s ease;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 15px;
            color: white;
            font-weight: 700;
            font-size: 0.95em;
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
        }}
        
        .bar-fill.success {{
            background: linear-gradient(90deg, #11998e 0%, #38ef7d 100%);
            box-shadow: 0 2px 8px rgba(17, 153, 142, 0.4);
        }}
        
        .bar-fill.warning {{
            background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
            box-shadow: 0 2px 8px rgba(240, 147, 251, 0.4);
        }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }}
        
        thead {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }}
        
        th {{
            padding: 18px;
            text-align: left;
            font-weight: 700;
            font-size: 1.05em;
        }}
        
        td {{
            padding: 15px 18px;
            border-bottom: 1px solid #e9ecef;
        }}
        
        tr:hover {{
            background: #f8f9fa;
            transition: background 0.2s;
        }}
        
        .badge {{
            display: inline-block;
            padding: 6px 14px;
            border-radius: 25px;
            font-size: 0.85em;
            font-weight: 700;
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
            font-weight: 700;
        }}
        
        .priority-medium {{
            color: #ffc107;
            font-weight: 700;
        }}
        
        .priority-low {{
            color: #28a745;
            font-weight: 700;
        }}
        
        .executive-summary {{
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 35px;
            border-radius: 12px;
            margin-bottom: 35px;
            border-left: 6px solid #667eea;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }}
        
        .executive-summary h3 {{
            color: #667eea;
            margin-bottom: 18px;
            font-size: 1.5em;
        }}
        
        .executive-summary p {{
            line-height: 2;
            color: #495057;
            margin-bottom: 12px;
            font-size: 1.05em;
        }}
        
        .api-block {{
            background: white;
            border: 3px solid #e9ecef;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 25px;
            transition: all 0.3s;
        }}
        
        .api-block:hover {{
            border-color: #667eea;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
            transform: translateY(-3px);
        }}
        
        .api-block-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 15px;
        }}
        
        .api-block-title {{
            font-size: 1.5em;
            font-weight: 700;
            color: #667eea;
        }}
        
        .api-block-stats {{
            display: flex;
            gap: 25px;
        }}
        
        .stat {{
            text-align: center;
        }}
        
        .stat-value {{
            font-size: 1.8em;
            font-weight: 700;
        }}
        
        .stat-label {{
            font-size: 0.9em;
            color: #6c757d;
            margin-top: 3px;
        }}
        
        .footer {{
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #6c757d;
            font-size: 0.95em;
            border-top: 3px solid #e9ecef;
        }}
        
        .footer p {{
            margin: 5px 0;
        }}
        
        @media print {{
            body {{
                background: white;
                padding: 0;
            }}
            
            .container {{
                box-shadow: none;
            }}
            
            .tab {{
                display: none;
            }}
            
            .tab-content {{
                display: block !important;
                page-break-after: always;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Azure DevOps Automation Report</h1>
            <div class="subtitle">{report_title} - Comprehensive Status Report</div>
            <div class="report-meta">Generated on {report_date}</div>
        </div>
"""
        
        # Only show User Story section if requested and user_story exists
        if show_user_story_details and user_story:
            html += f"""
        <!-- User Story Section -->
        <div class="user-story-section">
            <div class="user-story-header">
                <div class="user-story-title">
                    <h2>{html_escape(user_story['title'])}</h2>
                    <div class="story-id">User Story #{user_story['id']}</div>
                </div>
                
                <div class="user-story-meta">
                    <div class="meta-item">
                        <div class="meta-label">State</div>
                        <div class="meta-value">{user_story['state']}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Story Points</div>
                        <div class="meta-value">{user_story.get('story_points', 0)}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Priority</div>
                        <div class="meta-value">P{user_story.get('priority', 3)}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Business Value</div>
                        <div class="meta-value">{user_story.get('business_value', 0)}</div>
                    </div>
                </div>
            </div>
"""
            
            # Only show description and acceptance criteria if they have content
            if description or acceptance_criteria:
                html += """
            <div class="user-story-details">
"""
                if description:
                    html += f"""
                <div class="detail-box">
                    <h3>📝 Description</h3>
                    <p>{description[:500]}{'...' if len(description) > 500 else ''}</p>
                </div>
"""
                
                if acceptance_criteria:
                    html += f"""
                <div class="detail-box">
                    <h3>✅ Acceptance Criteria</h3>
                    <p>{acceptance_criteria[:500]}{'...' if len(acceptance_criteria) > 500 else ''}</p>
                </div>
"""
                
                html += """
            </div>
"""
            
            # Tags and metadata
            html += """
            <div class="detail-box" style="margin-top: 20px;">
                <h3>🏷️ Tags & Metadata</h3>
                <div class="tags">
"""
            
            # Add tags
            if user_story.get('tags'):
                for tag in user_story['tags'].split(';'):
                    html += f'<span class="tag">{html_escape(tag.strip())}</span>'
            
            html += f"""
                </div>
                <p style="margin-top: 15px;"><strong>Assigned To:</strong> {user_story.get('assigned_to', 'Unassigned')}</p>
                <p><strong>Area Path:</strong> {user_story.get('area_path', 'N/A')}</p>
                <p><strong>Iteration:</strong> {user_story.get('iteration_path', 'N/A')}</p>
            </div>
        </div>
"""
        
        html += """
        
        <div class="tabs">
            <button class="tab active" onclick="showTab('executive')">Executive Summary</button>
            <button class="tab" onclick="showTab('overview')">Overview</button>
            <button class="tab" onclick="showTab('charts')">Visual Analytics</button>
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
"""
        
        if user_story:
            html += f"""
                    <p>
                        This comprehensive report analyzes <strong>{metrics['total_bugs']} bugs</strong> linked to 
                        User Story #{user_story['id']}: "{html_escape(user_story['title'])}". 
                        The bugs are categorized across multiple API blocks with detailed lifecycle metrics and execution status.
                    </p>
                    <p>
                        <strong>Current Status:</strong> {metrics['active_bugs']} active bugs requiring attention, 
                        {metrics['resolved_bugs']} resolved bugs, and {metrics['closed_bugs']} closed bugs.
                    </p>
                    <p>
                        <strong>Performance Metrics:</strong> Average age of active bugs is <strong>{metrics['avg_age_active']:.1f} days</strong>, 
                        with an average resolution time of <strong>{metrics['avg_cycle_time']:.1f} days</strong>.
                    </p>
                    <p>
                        <strong>User Story Progress:</strong> This user story has <strong>{user_story.get('story_points', 0)} story points</strong> 
                        and is currently in <strong>{user_story['state']}</strong> state with a business value of <strong>{user_story.get('business_value', 0)}</strong>.
                    </p>
"""
        else:
            html += f"""
                    <p>
                        This comprehensive report analyzes <strong>{metrics['total_bugs']} bugs</strong> across the Azure DevOps board. 
                        The bugs are categorized across multiple API blocks with detailed lifecycle metrics and execution status.
                    </p>
                    <p>
                        <strong>Current Status:</strong> {metrics['active_bugs']} active bugs requiring attention, 
                        {metrics['resolved_bugs']} resolved bugs, and {metrics['closed_bugs']} closed bugs.
                    </p>
                    <p>
                        <strong>Performance Metrics:</strong> Average age of active bugs is <strong>{metrics['avg_age_active']:.1f} days</strong>, 
                        with an average resolution time of <strong>{metrics['avg_cycle_time']:.1f} days</strong>.
                    </p>
"""
        
        html += f"""
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
                
                <div class="section" style="margin-top: 40px;">
                    <h3 style="color: #667eea; font-size: 1.5em; margin-bottom: 20px;">🏷️ O&M Classification</h3>
                    <div class="metrics-grid">
                        <div class="metric-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                            <div class="metric-label">O&M Bugs</div>
                            <div class="metric-value">{metrics['by_om'].get('O&M', 0)}</div>
                            <div class="metric-subtext">Operations & Maintenance</div>
                        </div>
                        <div class="metric-card" style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);">
                            <div class="metric-label">DME Bugs</div>
                            <div class="metric-value">{metrics['by_om'].get('DME', 0)}</div>
                            <div class="metric-subtext">Development, Maintenance & Enhancement</div>
                        </div>
                    </div>
                </div>
                
                <div class="section" style="margin-top: 40px;">
                    <h3 style="color: #667eea; font-size: 1.5em; margin-bottom: 20px;">🌍 Environment Distribution</h3>
                    <div class="metrics-grid">
                        <div class="metric-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                            <div class="metric-label">Dev Environment</div>
                            <div class="metric-value">{metrics['by_environment'].get('Dev', 0)}</div>
                            <div class="metric-subtext">Development</div>
                        </div>
                        <div class="metric-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                            <div class="metric-label">Test Environment</div>
                            <div class="metric-value">{metrics['by_environment'].get('Test', 0)}</div>
                            <div class="metric-subtext">Testing/QA/UAT</div>
                        </div>
                        <div class="metric-card" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);">
                            <div class="metric-label">Prod Environment</div>
                            <div class="metric-value">{metrics['by_environment'].get('Prod', 0)}</div>
                            <div class="metric-subtext">Production</div>
                        </div>
                        <div class="metric-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                            <div class="metric-label">Unknown Environment</div>
                            <div class="metric-value">{metrics['by_environment'].get('Unknown', 0)}</div>
                            <div class="metric-subtext">Not specified</div>
                        </div>
                    </div>
                </div>
"""
        
        if test_results:
            html += self._generate_test_execution_section(test_results)
        
        html += """
            </div>
        </div>
"""
        
        # Continue with other tabs...
        html += self._generate_overview_tab(metrics)
        html += self._generate_charts_tab(metrics, categorized_bugs)
        html += self._generate_api_blocks_tab(categorized_bugs)
        html += self._generate_lifetime_tab(bugs)
        html += self._generate_details_tab(metrics)
        
        html += """
        <div class="footer">
            <p><strong>Azure DevOps Automation Reporter</strong> | Generated by GS API Test Platform</p>
            <p>© 2026 All Rights Reserved | Confidential Information</p>
        </div>
    </div>
    
    <script>
        function showTab(tabName) {
            const contents = document.querySelectorAll('.tab-content');
            contents.forEach(content => content.classList.remove('active'));
            
            const tabs = document.querySelectorAll('.tab');
            tabs.forEach(tab => tab.classList.remove('active'));
            
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
        }
        
        // Initialize charts
        window.addEventListener('load', function() {
            initializeCharts();
        });
        
        function initializeCharts() {
            // State distribution chart
            const stateCtx = document.getElementById('stateChart');
            if (stateCtx) {
                new Chart(stateCtx, {
                    type: 'doughnut',
                    data: {
                        labels: """ + json.dumps(list(metrics['by_state'].keys())) + """,
                        datasets: [{
                            data: """ + json.dumps(list(metrics['by_state'].values())) + """,
                            backgroundColor: [
                                '#667eea', '#f5576c', '#38ef7d', '#ffc107', '#17a2b8'
                            ],
                            borderWidth: 3,
                            borderColor: '#fff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    padding: 15,
                                    font: { size: 12, weight: 'bold' }
                                }
                            }
                        }
                    }
                });
            }
            
            // Category distribution chart
            const categoryCtx = document.getElementById('categoryChart');
            if (categoryCtx) {
                new Chart(categoryCtx, {
                    type: 'bar',
                    data: {
                        labels: """ + json.dumps(list(metrics['by_category'].keys())) + """,
                        datasets: [{
                            label: 'Bugs by Category',
                            data: """ + json.dumps(list(metrics['by_category'].values())) + """,
                            backgroundColor: 'rgba(102, 126, 234, 0.8)',
                            borderColor: '#667eea',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { stepSize: 1 }
                            }
                        }
                    }
                });
            }
            
            // Priority distribution chart
            const priorityCtx = document.getElementById('priorityChart');
            if (priorityCtx) {
                new Chart(priorityCtx, {
                    type: 'pie',
                    data: {
                        labels: ['P1 - Critical', 'P2 - High', 'P3 - Medium', 'P4 - Low'],
                        datasets: [{
                            data: [
                                """ + str(metrics['by_priority'].get(1, 0)) + """,
                                """ + str(metrics['by_priority'].get(2, 0)) + """,
                                """ + str(metrics['by_priority'].get(3, 0)) + """,
                                """ + str(metrics['by_priority'].get(4, 0)) + """
                            ],
                            backgroundColor: [
                                '#dc3545', '#ffc107', '#17a2b8', '#28a745'
                            ],
                            borderWidth: 3,
                            borderColor: '#fff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    padding: 15,
                                    font: { size: 12, weight: 'bold' }
                                }
                            }
                        }
                    }
                });
            }
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
    
    def _generate_overview_tab(self, metrics: Dict) -> str:
        """Generate overview tab content."""
        html = """
        <div id="overview" class="tab-content">
            <div class="section">
                <div class="section-title">Bug Distribution Overview</div>
                
                <div class="chart-container">
                    <h3 style="margin-bottom: 20px;">Bugs by State</h3>
                    <div class="bar-chart">
"""
        
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
"""
        return html
    
    def _generate_charts_tab(self, metrics: Dict, categorized_bugs: Dict) -> str:
        """Generate charts tab with advanced visualizations."""
        return """
        <div id="charts" class="tab-content">
            <div class="section">
                <div class="section-title">Visual Analytics</div>
                
                <div class="chart-grid">
                    <div class="chart-box">
                        <h3>Bug State Distribution</h3>
                        <canvas id="stateChart"></canvas>
                    </div>
                    
                    <div class="chart-box">
                        <h3>Category Distribution</h3>
                        <canvas id="categoryChart"></canvas>
                    </div>
                    
                    <div class="chart-box">
                        <h3>Priority Distribution</h3>
                        <canvas id="priorityChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
"""
    
    def _generate_api_blocks_tab(self, categorized_bugs: Dict) -> str:
        """Generate API blocks tab content."""
        html = """
        <div id="api-blocks" class="tab-content">
            <div class="section">
                <div class="section-title">API Block Breakdown</div>
"""
        
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
            
            for bug in category_bugs[:15]:
                state_badge = 'active' if bug['metrics']['is_active'] else 'resolved' if bug['state'] == 'Resolved' else 'closed'
                priority_class = 'priority-high' if bug.get('priority', 3) <= 2 else 'priority-medium' if bug.get('priority', 3) == 3 else 'priority-low'
                days_display = f"{bug['metrics']['age_days']} days (Active)" if bug['metrics']['is_active'] else f"{bug['metrics']['days_in_cycle']} days (Cycle)"
                
                html += f"""
                            <tr>
                                <td><a href="{bug.get('url', '#')}" target="_blank" style="color: #667eea; font-weight: 600;">#{bug['id']}</a></td>
                                <td>{html_escape(bug['title'][:80])}...</td>
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
"""
        return html
    
    def _generate_lifetime_tab(self, bugs: List[Dict]) -> str:
        """Generate bug lifetime tab content."""
        html = """
        <div id="lifetime" class="tab-content">
            <div class="section">
                <div class="section-title">Bug Lifetime Analysis</div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Bug ID</th>
                            <th>Title</th>
                            <th>Category</th>
                            <th>O&M</th>
                            <th>Environment</th>
                            <th>State</th>
                            <th>Created Date</th>
                            <th>Days in Cycle</th>
                            <th>Age (Active)</th>
                            <th>Assigned To</th>
                        </tr>
                    </thead>
                    <tbody>
"""
        
        sorted_bugs = sorted(bugs, key=lambda x: x['metrics']['age_days'], reverse=True)
        
        for bug in sorted_bugs:
            state_badge = 'active' if bug['metrics']['is_active'] else 'resolved' if bug['state'] == 'Resolved' else 'closed'
            created_str = bug['metrics']['created_date'].strftime('%Y-%m-%d')
            cycle_days = bug['metrics']['days_in_cycle'] if bug['metrics']['days_in_cycle'] is not None else '-'
            age_days = bug['metrics']['age_days'] if bug['metrics']['is_active'] else '-'
            
            # O&M badge styling
            om_badge_class = 'resolved' if bug.get('om_category') == 'O&M' else 'new'
            
            html += f"""
                        <tr>
                            <td><a href="{bug.get('url', '#')}" target="_blank" style="color: #667eea; font-weight: 600;">#{bug['id']}</a></td>
                            <td>{html_escape(bug['title'][:60])}...</td>
                            <td>{bug['category']}</td>
                            <td><span class="badge {om_badge_class}">{bug.get('om_category', 'DME')}</span></td>
                            <td><span class="badge active" style="background: #17a2b8;">{bug.get('environment', 'Unknown')}</span></td>
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
"""
        return html
    
    def _generate_details_tab(self, metrics: Dict) -> str:
        """Generate detailed analysis tab content."""
        html = """
        <div id="details" class="tab-content">
            <div class="section">
                <div class="section-title">Detailed Bug Analysis</div>
                
                <div class="chart-container">
                    <h3 style="margin-bottom: 20px;">Priority Distribution</h3>
                    <div class="bar-chart">
"""
        
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
"""
        return html


import math  # For pie chart calculations
