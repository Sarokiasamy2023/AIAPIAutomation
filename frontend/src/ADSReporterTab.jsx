import { useState } from 'react'
import { API_BASE } from './config'

function ADSReporterTab() {
  const [userStoryIds, setUserStoryIds] = useState('')  // Changed to comma-separated IDs
  const [iterationPath, setIterationPath] = useState('')
  const [includeTestResults, setIncludeTestResults] = useState(false)
  const [totalTests, setTotalTests] = useState('')
  const [passedTests, setPassedTests] = useState('')
  const [failedTests, setFailedTests] = useState('')
  const [useEnhancedReport, setUseEnhancedReport] = useState(true)
  const [showUserStoryDetails, setShowUserStoryDetails] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [error, setError] = useState(null)
  const [loadingBugs, setLoadingBugs] = useState(false)
  const [bugPreview, setBugPreview] = useState(null)

  const handlePreviewBugs = async () => {
    if (!userStoryIds.trim()) {
      setError('Please enter User Story ID(s)')
      return
    }

    // Parse all comma-separated IDs
    const idsArray = userStoryIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
    
    if (idsArray.length === 0) {
      setError('Please enter valid User Story ID(s)')
      return
    }
    
    setLoadingBugs(true)
    setError(null)
    setBugPreview(null)

    try {
      // Fetch bugs from all user story IDs
      const allBugs = []
      let totalCount = 0
      
      for (const id of idsArray) {
        const response = await fetch(`${API_BASE}/api/azure-devops/bugs/${id}`)
        const data = await response.json()
        console.log(`Bug preview for user story ${id}:`, data)

        if (response.ok && data.status === 'success') {
          console.log(`Found ${data.total_count} bugs for user story ${id}`)
          if (data.bugs && data.bugs.length > 0) {
            allBugs.push(...data.bugs)
            totalCount += data.total_count
          }
        } else {
          console.error(`Bug preview error for ${id}:`, data.message)
        }
      }
      
      // Set combined preview data
      setBugPreview({
        user_story_id: idsArray.length > 1 ? `${idsArray.join(', ')}` : idsArray[0],
        bugs: allBugs,
        total_count: totalCount,
        status: 'success'
      })
      
      if (totalCount === 0) {
        setError(`No bugs found for user stories: ${idsArray.join(', ')}`)
      }
    } catch (err) {
      console.error('Bug preview exception:', err)
      setError(`Error: ${err.message}`)
    } finally {
      setLoadingBugs(false)
    }
  }

  const handleGenerateReport = async () => {
    if (!userStoryIds.trim()) {
      setError('Please enter User Story ID(s)')
      return
    }

    setGenerating(true)
    setError(null)
    setReportData(null)

    try {
      // Parse comma-separated user story IDs
      const idsArray = userStoryIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
      
      if (idsArray.length === 0) {
        setError('Please enter valid User Story ID(s)')
        setGenerating(false)
        return
      }

      // Build request body with multiple user story IDs
      const requestBody = {
        user_story_ids: idsArray,  // Send array of IDs
        show_user_story_details: showUserStoryDetails
      }

      // Add test results if checkbox is checked
      if (includeTestResults) {
        requestBody.include_test_results = true
        requestBody.test_results = {
          total_tests: parseInt(totalTests) || 0,
          passed: parseInt(passedTests) || 0,
          failed: parseInt(failedTests) || 0
        }
      }

      // Add iteration if provided
      if (iterationPath) {
        requestBody.iteration_path = iterationPath
      }

      // Choose endpoint based on enhanced report toggle
      const endpoint = useEnhancedReport 
        ? `${API_BASE}/api/azure-devops/generate-enhanced-report-multi`
        : `${API_BASE}/api/azure-devops/generate-report-multi`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: requestBody ? JSON.stringify(requestBody) : undefined
      })

      const data = await response.json()
      console.log('Report response:', data)

      if (response.ok && data.status === 'success') {
        setReportData(data)
        
        // Open report in new window if html_report is available
        if (data.html_report) {
          console.log('Opening report window with HTML length:', data.html_report.length)
          const reportWindow = window.open('', '_blank')
          if (reportWindow) {
            reportWindow.document.write(data.html_report)
            reportWindow.document.close()
          } else {
            setError('Failed to open report window. Please check your popup blocker.')
          }
        } else {
          setError('Report generated but no HTML content received')
        }
      } else {
        setError(data.detail || data.message || 'Failed to generate report')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadReport = () => {
    if (!reportData || !reportData.html_report) return

    const blob = new Blob([reportData.html_report], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = reportData.report_filename || 'ADS_Report.html'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1400px', 
      margin: '0 auto',
      background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)',
      minHeight: '100vh'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '50px 40px',
        borderRadius: '16px',
        marginBottom: '30px',
        boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%'
        }}></div>
        <h1 style={{ 
          margin: 0, 
          fontSize: '2.8em', 
          fontWeight: '700',
          textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
          position: 'relative',
          zIndex: 1
        }}>
          🎯 Azure DevOps Automation Reporter
        </h1>
        <p style={{ 
          margin: '15px 0 0 0', 
          fontSize: '1.3em', 
          opacity: 0.95,
          position: 'relative',
          zIndex: 1
        }}>
          Generate comprehensive bug reports with advanced analytics, O&M classification, and environment tracking
        </p>
      </div>

      {/* Input Section */}
      <div style={{
        background: 'white',
        padding: '35px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        marginBottom: '25px',
        border: '1px solid #e9ecef'
      }}>
        <h2 style={{ 
          color: '#667eea', 
          marginTop: 0,
          marginBottom: '25px',
          fontSize: '1.8em',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            width: '4px',
            height: '30px',
            borderRadius: '2px',
            display: 'inline-block'
          }}></span>
          Report Configuration
        </h2>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
            User Story IDs <span style={{ color: '#667eea', fontWeight: '600' }}>(Required)</span>
          </label>
          <input
            type="text"
            value={userStoryIds}
            onChange={(e) => setUserStoryIds(e.target.value)}
            placeholder="Enter User Story IDs separated by commas (e.g., 420291, 420295, 420297)"
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '2px solid #e9ecef',
              borderRadius: '10px',
              fontSize: '16px',
              transition: 'all 0.3s ease',
              outline: 'none',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
          />
          <small style={{ color: '#6c757d', marginTop: '5px', display: 'block' }}>
            Enter one or more User Story IDs separated by commas to generate a combined report
          </small>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
            Iteration Path (Optional)
          </label>
          <input
            type="text"
            value={iterationPath}
            onChange={(e) => setIterationPath(e.target.value)}
            placeholder="e.g., EHBs\\Sprint 1"
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '2px solid #e9ecef',
              borderRadius: '10px',
              fontSize: '16px',
              transition: 'all 0.3s ease',
              outline: 'none',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
          />
          <small style={{ color: '#6c757d', marginTop: '5px', display: 'block' }}>
            Filter by sprint/iteration
          </small>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            fontWeight: '600',
            color: '#495057',
            marginBottom: '10px'
          }}>
            <input
              type="checkbox"
              checked={useEnhancedReport}
              onChange={(e) => setUseEnhancedReport(e.target.checked)}
              style={{ marginRight: '10px', width: '18px', height: '18px' }}
            />
            Use Enhanced Report (with User Story details, advanced charts & modern styling)
          </label>
          
          <label style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            fontWeight: '600',
            color: '#495057',
            marginBottom: '10px'
          }}>
            <input
              type="checkbox"
              checked={showUserStoryDetails}
              onChange={(e) => setShowUserStoryDetails(e.target.checked)}
              style={{ marginRight: '10px', width: '18px', height: '18px' }}
            />
            Show User Story Details (description, acceptance criteria, tags)
          </label>
          
          <label style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            fontWeight: '600',
            color: '#495057'
          }}>
            <input
              type="checkbox"
              checked={includeTestResults}
              onChange={(e) => setIncludeTestResults(e.target.checked)}
              style={{ marginRight: '10px', width: '18px', height: '18px' }}
            />
            Include Test Execution Results
          </label>
        </div>

        {includeTestResults && (
          <div style={{
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0, color: '#667eea', fontSize: '1.1em' }}>
              Test Execution Metrics
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Total Tests
                </label>
                <input
                  type="number"
                  value={totalTests}
                  onChange={(e) => setTotalTests(e.target.value)}
                  placeholder="150"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Passed
                </label>
                <input
                  type="number"
                  value={passedTests}
                  onChange={(e) => setPassedTests(e.target.value)}
                  placeholder="142"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Failed
                </label>
                <input
                  type="number"
                  value={failedTests}
                  onChange={(e) => setFailedTests(e.target.value)}
                  placeholder="8"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
          <button
            onClick={handlePreviewBugs}
            disabled={loadingBugs || !userStoryIds.trim()}
            style={{
              flex: 1,
              padding: '16px 32px',
              background: loadingBugs || !userStoryIds.trim() ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loadingBugs || !userStoryIds.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: loadingBugs || !userStoryIds.trim() ? 0.6 : 1,
              boxShadow: loadingBugs || !userStoryIds.trim() ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.3)',
              transform: 'translateY(0)'
            }}
            onMouseEnter={(e) => {
              if (!loadingBugs && userStoryIds.trim()) {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = loadingBugs || !userStoryIds.trim() ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}
          >
            {loadingBugs ? '⏳ Loading...' : '👁️ Preview Bugs'}
          </button>

          <button
            onClick={handleGenerateReport}
            disabled={generating || !userStoryIds.trim()}
            style={{
              flex: 1,
              padding: '16px 32px',
              background: generating || !userStoryIds.trim() ? '#ccc' : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: generating || !userStoryIds.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: generating || !userStoryIds.trim() ? 0.6 : 1,
              boxShadow: generating || !userStoryIds.trim() ? 'none' : '0 4px 15px rgba(17, 153, 142, 0.3)',
              transform: 'translateY(0)'
            }}
            onMouseEnter={(e) => {
              if (!generating && userStoryIds.trim()) {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 6px 20px rgba(17, 153, 142, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = generating || !userStoryIds.trim() ? 'none' : '0 4px 15px rgba(17, 153, 142, 0.3)'
            }}
          >
            {generating ? '⏳ Generating...' : '📊 Generate Report'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Report Summary */}
      {reportData && (
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#28a745', marginTop: 0 }}>✅ Report Generated Successfully!</h2>
          
          <div style={{
            background: '#d4edda',
            color: '#155724',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #c3e6cb'
          }}>
            <p style={{ margin: '0 0 10px 0' }}>
              <strong>Report saved to:</strong> {reportData.report_filename}
            </p>
            <p style={{ margin: 0 }}>
              The report has been opened in a new window. You can also download it below.
            </p>
          </div>

          {/* Metrics Display */}
          {reportData.metrics && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              marginBottom: '20px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2.5em', fontWeight: 'bold' }}>{reportData.metrics.total_bugs || 0}</div>
                <div style={{ fontSize: '0.9em', opacity: 0.9 }}>Total Bugs</div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2.5em', fontWeight: 'bold' }}>{reportData.metrics.active_bugs || 0}</div>
                <div style={{ fontSize: '0.9em', opacity: 0.9 }}>Active Bugs</div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                color: 'white',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2.5em', fontWeight: 'bold' }}>{reportData.metrics.resolved_bugs || 0}</div>
                <div style={{ fontSize: '0.9em', opacity: 0.9 }}>Resolved Bugs</div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2.5em', fontWeight: 'bold' }}>{reportData.metrics.avg_cycle_time || 0}</div>
                <div style={{ fontSize: '0.9em', opacity: 0.9 }}>Avg Cycle Time (days)</div>
              </div>
            </div>
          )}

          {reportData.metrics && reportData.metrics.by_category && Object.keys(reportData.metrics.by_category).length > 0 && (
            <div>
              <h3 style={{ color: '#667eea' }}>Bugs by API Category</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '10px'
              }}>
                {Object.entries(reportData.metrics.by_category).map(([category, count]) => (
                  <div key={category} style={{
                    background: '#f8f9fa',
                    padding: '15px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '2px solid #e9ecef'
                  }}>
                    <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#667eea' }}>{count}</div>
                    <div style={{ fontSize: '0.85em', color: '#6c757d' }}>{category} API</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            <button
              onClick={handleDownloadReport}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 15px rgba(17, 153, 142, 0.3)'
              }}
            >
              💾 Download Report
            </button>
          </div>
        </div>
      )}

      {/* Bug Preview */}
      {bugPreview && (
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#667eea', marginTop: 0 }}>
            Bug Preview - User Story #{bugPreview.user_story_id}
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '15px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{bugPreview.total_count || 0}</div>
              <div style={{ fontSize: '0.9em', opacity: 0.9 }}>Total Bugs</div>
            </div>
          </div>

          {bugPreview.bugs && bugPreview.bugs.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Title</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>State</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Priority</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Assigned To</th>
                  </tr>
                </thead>
                <tbody>
                  {bugPreview.bugs.slice(0, 10).map((bug, index) => (
                    <tr key={bug.id} style={{
                      background: index % 2 === 0 ? 'white' : '#f8f9fa'
                    }}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>
                        <a href={bug.url} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>
                          #{bug.id}
                        </a>
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>
                        {bug.title.length > 60 ? bug.title.substring(0, 60) + '...' : bug.title}
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: bug.state === 'Active' ? '#ffc107' : bug.state === 'Resolved' ? '#28a745' : '#6c757d',
                          color: bug.state === 'Active' ? '#000' : 'white'
                        }}>
                          {bug.state}
                        </span>
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>
                        P{bug.priority}
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>
                        {bug.assigned_to}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bugPreview.bugs.length > 10 && (
                <p style={{ marginTop: '10px', color: '#6c757d', fontSize: '14px' }}>
                  Showing 10 of {bugPreview.bugs.length} bugs. Generate the full report to see all bugs.
                </p>
              )}
            </div>
          ) : (
            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#856404', marginTop: 0 }}>📋 No Bugs Found</h3>
              <p style={{ color: '#856404', margin: '10px 0' }}>
                No bugs are currently linked to User Story #{bugPreview.user_story_id}.
              </p>
              <p style={{ color: '#856404', fontSize: '14px', margin: 0 }}>
                This could mean:
              </p>
              <ul style={{ color: '#856404', fontSize: '14px', textAlign: 'left', maxWidth: '500px', margin: '10px auto' }}>
                <li>The user story has no child bugs</li>
                <li>Bugs exist but aren't linked as children to this user story</li>
                <li>The user story ID might be incorrect</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div style={{
        background: '#e7f3ff',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #b3d9ff'
      }}>
        <h3 style={{ marginTop: 0, color: '#004085' }}>📖 How to Use</h3>
        <ol style={{ marginBottom: 0, paddingLeft: '20px', color: '#004085' }}>
          <li style={{ marginBottom: '8px' }}>Enter the Azure DevOps User Story ID (e.g., 427113)</li>
          <li style={{ marginBottom: '8px' }}>Optionally, click "Preview Bugs" to see what bugs will be included</li>
          <li style={{ marginBottom: '8px' }}>Optionally, check "Include Test Execution Results" and enter test metrics</li>
          <li style={{ marginBottom: '8px' }}>Click "Generate Report" to create the comprehensive HTML report</li>
          <li style={{ marginBottom: '8px' }}>The report will open in a new window automatically</li>
          <li>Download the report for sharing or archiving</li>
        </ol>
      </div>
    </div>
  )
}

export default ADSReporterTab
