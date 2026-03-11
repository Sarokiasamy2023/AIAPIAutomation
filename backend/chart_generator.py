import base64
from io import BytesIO
import math

class ChartGenerator:
    """Generate inline SVG charts for email reports."""
    
    @staticmethod
    def generate_pie_chart(passed: int, failed: int, width: int = 300, height: int = 300) -> str:
        """
        Generate an SVG pie chart for pass/fail statistics.
        
        Args:
            passed: Number of passed tests
            failed: Number of failed tests
            width: Chart width in pixels
            height: Chart height in pixels
            
        Returns:
            SVG string that can be embedded in HTML
        """
        total = passed + failed
        if total == 0:
            return ChartGenerator._generate_empty_chart(width, height)
        
        # Calculate percentages
        passed_percent = round((passed / total) * 100, 1)
        failed_percent = round((failed / total) * 100, 1)
        
        # Calculate angles (in degrees)
        passed_angle = (passed / total) * 360
        failed_angle = (failed / total) * 360
        
        # Center point
        cx = width / 2
        cy = height / 2
        radius = min(width, height) / 2 - 20
        
        # Generate pie slices
        svg_parts = []
        
        # Start with passed (green) slice
        if passed > 0:
            passed_path = ChartGenerator._create_pie_slice(
                cx, cy, radius, 0, passed_angle, "#28a745"
            )
            svg_parts.append(passed_path)
        
        # Add failed (red) slice
        if failed > 0:
            failed_path = ChartGenerator._create_pie_slice(
                cx, cy, radius, passed_angle, passed_angle + failed_angle, "#dc3545"
            )
            svg_parts.append(failed_path)
        
        # Create legend
        legend_y = height - 40
        legend_items = []
        
        if passed > 0:
            legend_items.append(f'''
                <rect x="20" y="{legend_y}" width="15" height="15" fill="#28a745"/>
                <text x="40" y="{legend_y + 12}" font-family="Arial, sans-serif" font-size="14" fill="#333">
                    Passed: {passed} ({passed_percent}%)
                </text>
            ''')
        
        if failed > 0:
            legend_items.append(f'''
                <rect x="20" y="{legend_y + 25}" width="15" height="15" fill="#dc3545"/>
                <text x="40" y="{legend_y + 37}" font-family="Arial, sans-serif" font-size="14" fill="#333">
                    Failed: {failed} ({failed_percent}%)
                </text>
            ''')
        
        # Add center text with total
        center_text = f'''
            <text x="{cx}" y="{cy - 10}" text-anchor="middle" font-family="Arial, sans-serif" 
                  font-size="32" font-weight="bold" fill="#333">{total}</text>
            <text x="{cx}" y="{cy + 15}" text-anchor="middle" font-family="Arial, sans-serif" 
                  font-size="14" fill="#666">Total Tests</text>
        '''
        
        svg = f'''
        <svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="{width}" height="{height}" fill="white"/>
            {''.join(svg_parts)}
            {center_text}
            {''.join(legend_items)}
        </svg>
        '''
        
        return svg
    
    @staticmethod
    def _create_pie_slice(cx: float, cy: float, radius: float, 
                          start_angle: float, end_angle: float, color: str) -> str:
        """Create a single pie slice path."""
        # Convert angles to radians
        start_rad = math.radians(start_angle - 90)  # -90 to start from top
        end_rad = math.radians(end_angle - 90)
        
        # Calculate start and end points
        start_x = cx + radius * math.cos(start_rad)
        start_y = cy + radius * math.sin(start_rad)
        end_x = cx + radius * math.cos(end_rad)
        end_y = cy + radius * math.sin(end_rad)
        
        # Determine if we need a large arc
        large_arc = 1 if (end_angle - start_angle) > 180 else 0
        
        # Create path
        path = f'''
        <path d="M {cx},{cy} L {start_x},{start_y} A {radius},{radius} 0 {large_arc},1 {end_x},{end_y} Z"
              fill="{color}" stroke="white" stroke-width="2"/>
        '''
        
        return path
    
    @staticmethod
    def _generate_empty_chart(width: int, height: int) -> str:
        """Generate an empty chart when there's no data."""
        cx = width / 2
        cy = height / 2
        
        svg = f'''
        <svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="{width}" height="{height}" fill="white"/>
            <circle cx="{cx}" cy="{cy}" r="{min(width, height)/2 - 20}" 
                    fill="#e0e0e0" stroke="#ccc" stroke-width="2"/>
            <text x="{cx}" y="{cy}" text-anchor="middle" font-family="Arial, sans-serif" 
                  font-size="16" fill="#666">No Data</text>
        </svg>
        '''
        
        return svg
    
    @staticmethod
    def generate_bar_chart(data: dict, width: int = 400, height: int = 200) -> str:
        """
        Generate a simple horizontal bar chart.
        
        Args:
            data: Dictionary with labels as keys and values as numbers
            width: Chart width
            height: Chart height
            
        Returns:
            SVG string
        """
        if not data:
            return ChartGenerator._generate_empty_chart(width, height)
        
        max_value = max(data.values()) if data else 1
        bar_height = 30
        bar_spacing = 10
        label_width = 150
        
        svg_parts = [f'<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">']
        svg_parts.append(f'<rect width="{width}" height="{height}" fill="white"/>')
        
        y_pos = 20
        for label, value in data.items():
            bar_width = ((width - label_width - 60) * value / max_value) if max_value > 0 else 0
            
            # Label
            svg_parts.append(f'''
                <text x="10" y="{y_pos + bar_height/2 + 5}" font-family="Arial, sans-serif" 
                      font-size="12" fill="#333">{label[:20]}</text>
            ''')
            
            # Bar
            svg_parts.append(f'''
                <rect x="{label_width}" y="{y_pos}" width="{bar_width}" height="{bar_height}" 
                      fill="#667eea" rx="3"/>
            ''')
            
            # Value
            svg_parts.append(f'''
                <text x="{label_width + bar_width + 10}" y="{y_pos + bar_height/2 + 5}" 
                      font-family="Arial, sans-serif" font-size="12" fill="#333">{value}</text>
            ''')
            
            y_pos += bar_height + bar_spacing
        
        svg_parts.append('</svg>')
        
        return ''.join(svg_parts)
    
    @staticmethod
    def svg_to_data_uri(svg: str) -> str:
        """Convert SVG to data URI for embedding in HTML."""
        svg_bytes = svg.encode('utf-8')
        b64 = base64.b64encode(svg_bytes).decode('utf-8')
        return f"data:image/svg+xml;base64,{b64}"
    
    @staticmethod
    def generate_html_pie_chart(passed: int, failed: int) -> str:
        """
        Generate an Outlook-compatible visual chart using tables and solid colors.
        
        Args:
            passed: Number of passed tests
            failed: Number of failed tests
            
        Returns:
            HTML string with inline styles compatible with Outlook
        """
        total = passed + failed
        if total == 0:
            return '''
            <div style="width: 280px; margin: 0 auto; text-align: center; font-family: Arial, sans-serif;">
                <div style="background: #f0f0f0; padding: 40px; border-radius: 10px;">
                    <div style="font-size: 32px; font-weight: bold; color: #666;">0</div>
                    <div style="font-size: 14px; color: #666;">No Data</div>
                </div>
            </div>
            '''
        
        passed_percent = round((passed / total) * 100, 1)
        failed_percent = round((failed / total) * 100, 1)
        
        # Use horizontal bar chart instead - more Outlook-friendly
        passed_width = int((passed / total) * 200) if total > 0 else 0
        failed_width = int((failed / total) * 200) if total > 0 else 0
        
        html = f'''
        <table cellpadding="0" cellspacing="0" border="0" style="width: 280px; margin: 0 auto; font-family: Arial, sans-serif;">
            <tr>
                <td style="text-align: center; padding-bottom: 20px;">
                    <div style="font-size: 48px; font-weight: bold; color: #333; margin-bottom: 5px;">{total}</div>
                    <div style="font-size: 14px; color: #666;">Total Tests</div>
                </td>
            </tr>
            <tr>
                <td style="padding: 10px 0;">
                    <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                        <tr>
                            <td style="width: 30px; vertical-align: middle;">
                                <div style="width: 20px; height: 20px; background-color: #28a745;"></div>
                            </td>
                            <td style="vertical-align: middle; padding-left: 10px;">
                                <div style="font-size: 14px; color: #333; margin-bottom: 5px;">
                                    <strong>Passed: {passed}</strong> ({passed_percent}%)
                                </div>
                                <div style="background-color: #e8f5e9; height: 30px; border-radius: 4px; overflow: hidden;">
                                    <div style="background-color: #28a745; height: 30px; width: {passed_percent}%;"></div>
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td style="padding: 10px 0;">
                    <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                        <tr>
                            <td style="width: 30px; vertical-align: middle;">
                                <div style="width: 20px; height: 20px; background-color: #dc3545;"></div>
                            </td>
                            <td style="vertical-align: middle; padding-left: 10px;">
                                <div style="font-size: 14px; color: #333; margin-bottom: 5px;">
                                    <strong>Failed: {failed}</strong> ({failed_percent}%)
                                </div>
                                <div style="background-color: #ffebee; height: 30px; border-radius: 4px; overflow: hidden;">
                                    <div style="background-color: #dc3545; height: 30px; width: {failed_percent}%;"></div>
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        '''
        
        return html
