import React, { useState, useEffect } from 'react'
import { API_BASE } from './config'

// AI Insights Panel Component
function AIInsightsPanel({ scenarioId }) {
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    console.log('AI Insights Panel - Component mounted with scenarioId:', scenarioId)
    if (!scenarioId) return

    const fetchInsights = async () => {
      console.log('AI Insights Panel - Fetching insights...')
      setLoading(true)
      try {
        const response = await fetch(`${API_BASE}/api/scenarios/${scenarioId}/insights`)
        console.log('AI Insights Panel - Response status:', response.status)
        const data = await response.json()
        console.log('AI Insights Panel - Response data:', data)
        setInsights(data.insights || [])
      } catch (error) {
        console.error('Failed to fetch insights:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [scenarioId])

  if (loading) {
    return (
      <div style={{
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: 12,
        padding: 40,
        marginBottom: 24,
        textAlign: 'center'
      }}>
        <div className="spin" style={{ fontSize: 24, marginBottom: 10, display: 'inline-block' }}>◌</div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>AI is analyzing all failures...</div>
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 14, color: '#94a3b8' }}>
          No AI insights available yet. Run "Analyze All Failures" to generate insights.
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: '#0f172a',
      border: '1px solid #1e293b',
      borderRadius: 12,
      padding: 20,
      marginBottom: 24
    }}>
      <div style={{
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: '0.1em',
        color: '#94a3b8',
        marginBottom: 16,
        textAlign: 'center'
      }}>
        🧠 AI GENERATED INSIGHTS
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {insights.map((insight, idx) => (
          <div key={idx} style={{
            background: insight.severity === 'critical' ? '#1e1b2e' : 
                       insight.severity === 'high' ? '#1e2a2e' : 
                       insight.severity === 'medium' ? '#2e2a1e' : '#1e1e2e',
            border: `1px solid ${
              insight.severity === 'critical' ? '#dc2626' :
              insight.severity === 'high' ? '#f59e0b' :
              insight.severity === 'medium' ? '#10b981' : '#6b7280'
            }`,
            borderRadius: 8,
            padding: 16,
            borderLeft: `4px solid ${
              insight.severity === 'critical' ? '#dc2626' :
              insight.severity === 'high' ? '#f59e0b' :
              insight.severity === 'medium' ? '#10b981' : '#6b7280'
            }`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8
            }}>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: insight.severity === 'critical' ? '#dc2626' :
                       insight.severity === 'high' ? '#f59e0b' :
                       insight.severity === 'medium' ? '#10b981' : '#6b7280'
              }}>
                {insight.severity?.toUpperCase()}
              </span>
              <span style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#e2e8f0'
              }}>
                {insight.title}
              </span>
            </div>
            <div style={{
              fontSize: 12,
              color: '#94a3b8',
              lineHeight: 1.5
            }}>
              {insight.description}
            </div>
            {insight.affected_fields && insight.affected_fields.length > 0 && (
              <div style={{
                marginTop: 8,
                fontSize: 11,
                color: '#64748b'
              }}>
                Affected fields: {insight.affected_fields.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Category Badge Component
function CategoryBadge({ category }) {
  const categories = {
    'API_BUG': {
      label: 'API Bug',
      icon: '🐛',
      color: '#dc2626',
      bg: 'rgba(127, 29, 29, 0.2)'
    },
    'DATA_TRANSFORMATION': {
      label: 'Data Transformation',
      icon: '🔄',
      color: '#d97706',
      bg: 'rgba(120, 53, 15, 0.2)'
    },
    'VENDOR_DATA': {
      label: 'Vendor Data Issue',
      icon: '📦',
      color: '#ca8a04',
      bg: 'rgba(113, 63, 18, 0.2)'
    },
    'STALE_CACHE': {
      label: 'Stale Cache',
      icon: '⏰',
      color: '#0891b2',
      bg: 'rgba(14, 115, 115, 0.2)'
    },
    'BUSINESS_RULE': {
      label: 'Business Rule',
      icon: '⚖️',
      color: '#7c3aed',
      bg: 'rgba(91, 33, 182, 0.2)'
    },
    'MISSING_SYNC': {
      label: 'Missing Sync',
      icon: '🔗',
      color: '#2563eb',
      bg: 'rgba(30, 58, 138, 0.2)'
    },
    'CONFIGURATION': {
      label: 'Configuration',
      icon: '⚙️',
      color: '#059669',
      bg: 'rgba(2, 72, 37, 0.2)'
    }
  }

  const cat = categories[category] || {
    label: 'Unknown',
    icon: '❓',
    color: '#6b7280',
    bg: 'rgba(75, 85, 99, 0.2)'
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: 12,
      fontSize: 10,
      fontWeight: 600,
      background: cat.bg,
      color: cat.color,
      border: `1px solid ${cat.color}40`
    }}>
      <span style={{ fontSize: 11 }}>{cat.icon}</span>
      {cat.label}
    </div>
  )
}

// Confidence Badge Component
function ConfidenceBadge({ confidence }) {
  const getConfidenceLevel = (conf) => {
    if (conf >= 85) return { level: 'High', color: '#059669', bg: 'rgba(2, 72, 37, 0.2)' }
    if (conf >= 70) return { level: 'Medium', color: '#d97706', bg: 'rgba(120, 53, 15, 0.2)' }
    return { level: 'Low', color: '#dc2626', bg: 'rgba(127, 29, 29, 0.2)' }
  }

  const { level, color, bg } = getConfidenceLevel(confidence)

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: 12,
      fontSize: 10,
      fontWeight: 600,
      background: bg,
      color: color,
      border: `1px solid ${color}40`
    }}>
      <div style={{
        width: 20,
        height: 4,
        background: '#1e293b',
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          width: `${confidence}%`,
          height: '100%',
          background: color,
          borderRadius: 2,
          transition: 'width 0.3s ease'
        }} />
      </div>
      {level} {confidence}%
    </div>
  )
}

function EnhancedScenario1Tab({ mappingId }) {

  const [scenarios, setScenarios] = useState([])
  const [endpoints, setEndpoints] = useState([])
  const [loading, setLoading] = useState(false)
  const [runningScenarios, setRunningScenarios] = useState(new Set())
  const [results, setResults] = useState({})
    const [selectedScenario, setSelectedScenario] = useState(null)
  const [showRequestBuilder, setShowRequestBuilder] = useState(false)
  const [showResponseComparison, setShowResponseComparison] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [executionHistory, setExecutionHistory] = useState([])
  const [requestBody, setRequestBody] = useState('{}')
  const [expectedResponse, setExpectedResponse] = useState('{}')
  const [jsonSchema, setJsonSchema] = useState('')
  const [selectedEndpoint, setSelectedEndpoint] = useState('')
  const [showCreateScenario, setShowCreateScenario] = useState(false)
  const [showExcelValidation, setShowExcelValidation] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [scenarioToDelete, setScenarioToDelete] = useState(null)
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [excelFile, setExcelFile] = useState(null)
  const [responseListPath, setResponseListPath] = useState('')
  const [matchKey, setMatchKey] = useState('')
  const [textContentField, setTextContentField] = useState('textContent')
  const [excelValidationResults, setExcelValidationResults] = useState(null)
  const [excelValidationLoading, setExcelValidationLoading] = useState(false)
  const [selectedExcelRow, setSelectedExcelRow] = useState(null)
  const [newScenario, setNewScenario] = useState({
    name: '',
    category: 'positive',
    endpoint_id: '',
    request_body: '{}',
    expected_response: '{}',
    jsonSchema: ''
  })
  
  // Endpoint filter state
  const [filterEndpointId, setFilterEndpointId] = useState('')
  
  // Custom Business Rules State
  const [showBusinessRules, setShowBusinessRules] = useState(false)
  const [businessRules, setBusinessRules] = useState([])
  
  // Pagination state for scenario results
  const [currentPage, setCurrentPage] = useState({}) // Track page per scenario ID
  const RESULTS_PER_PAGE = 10
  const [newRuleName, setNewRuleName] = useState('')
  const [newRuleText, setNewRuleText] = useState('')
  const [businessRuleResults, setBusinessRuleResults] = useState(null)
  const [loadingBusinessRules, setLoadingBusinessRules] = useState(false)
  const [runningBusinessRules, setRunningBusinessRules] = useState(false)
  
  // AI Root Cause Analysis State
  const [rootCauseData, setRootCauseData] = useState({})
  const [loadingAnalysis, setLoadingAnalysis] = useState({})
  const [analyzingAll, setAnalyzingAll] = useState({})
  const [analysisProgress, setAnalysisProgress] = useState({})
  const [analysisRequested, setAnalysisRequested] = useState({})
  
  // Bug Creation State
  const [showBugModal, setShowBugModal] = useState(false)
  const [userStoryId, setUserStoryId] = useState('')
  const [preparedBugs, setPreparedBugs] = useState([])
  const [creatingBugs, setCreatingBugs] = useState(false)
  const [currentScenarioId, setCurrentScenarioId] = useState(null)

  useEffect(() => {
    fetchScenarios()
    fetchEndpoints()
  }, [mappingId, filterEndpointId])

  const fetchScenarios = async () => {
    try {
      // If mappingId exists, fetch scenarios for that mapping
      // Otherwise, fetch all scenarios (including custom ones)
      const url = mappingId 
        ? `${API_BASE}/api/mappings/${mappingId}/scenarios`
        : `${API_BASE}/api/scenarios/all`
      const response = await fetch(url)
      const data = await response.json()
      setScenarios(data)
    } catch (error) {
      console.error('Error fetching scenarios:', error)
      setScenarios([])
    }
  }

  const fetchEndpoints = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/endpoints`)
      const data = await response.json()
      setEndpoints(data)
    } catch (error) {
      console.error('Error fetching endpoints:', error)
    }
  }

  const fetchExecutionHistory = async (scenarioId) => {
    try {
      const response = await fetch(`${API_BASE}/api/scenarios/${scenarioId}/executions`)
      const data = await response.json()
      setExecutionHistory(data)
      setShowHistory(true)
    } catch (error) {
      console.error('Error fetching execution history:', error)
    }
  }

  const updateScenario = async (scenarioId, updates) => {
    try {
      const response = await fetch(`${API_BASE}/api/scenarios/${scenarioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (response.ok) {
        fetchScenarios()
        alert('Scenario updated successfully!')
      }
    } catch (error) {
      console.error('Error updating scenario:', error)
      alert('Failed to update scenario')
    }
  }

  const openRequestBuilder = (scenario) => {
    setSelectedScenario(scenario)
    setRequestBody(scenario.request_body || '{}')
    setExpectedResponse(scenario.expected_response || '{}')
    setJsonSchema(scenario.json_schema || '')
    setSelectedEndpoint(scenario.endpoint_id || '')
    setShowRequestBuilder(true)
  }

  const saveRequestBuilder = async () => {
    if (!selectedScenario) return
    
    await updateScenario(selectedScenario.id, {
      request_body: requestBody,
      expected_response: expectedResponse,
      json_schema: jsonSchema,
      endpoint_id: selectedEndpoint ? parseInt(selectedEndpoint) : null
    })
    
    setShowRequestBuilder(false)
  }

  const generateAIScenarios = async () => {
    if (!mappingId) {
      alert('Please upload an Excel file first')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/mappings/${mappingId}/generate-scenarios`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`Successfully generated ${result.scenarios_generated} test scenarios!`)
        fetchScenarios()
      } else {
        const error = await response.json()
        alert(`Failed to generate scenarios: ${error.detail || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error generating scenarios:', error)
      alert('Error generating scenarios: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = async () => {
    try {
      // Build URL with filter parameters
      let url = `${API_BASE}/api/scenarios/export-excel`
      const params = new URLSearchParams()
      
      if (filterEndpointId) {
        params.append('endpoint_id', filterEndpointId)
      } else if (mappingId) {
        params.append('mapping_id', mappingId)
      }
      // If no filters, exports all scenarios
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const response = await fetch(url)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        // Extract filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition')
        let filename = 'test_scenarios.xlsx'
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename=(.+)/)
          if (filenameMatch) {
            filename = filenameMatch[1]
          }
        }
        
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const error = await response.json()
        alert(`Failed to export scenarios: ${error.detail || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error exporting scenarios:', error)
      alert('Error exporting scenarios: ' + error.message)
    }
  }

  const runScenario = async (scenarioId) => {
    setRunningScenarios(prev => new Set(prev).add(scenarioId))
    
    try {
      const scenario = scenarios.find(s => s.id === scenarioId)
      let body = {}
      
      if (scenario.request_body) {
        try {
          body = JSON.parse(scenario.request_body)
        } catch (e) {
          console.error('Invalid JSON in request body')
        }
      }
      
      const response = await fetch(`${API_BASE}/api/scenarios/${scenarioId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }
      
      const data = await response.json()
      setResults(prev => ({ ...prev, [scenarioId]: data }))
      
    } catch (error) {
      console.error('Error running scenario:', error)
      alert(`Error running scenario: ${error.message}`)
    } finally {
      setRunningScenarios(prev => {
        const newSet = new Set(prev)
        newSet.delete(scenarioId)
        return newSet
      })
    }
  }

  const runSchemaValidation = async (scenarioId) => {
    setRunningScenarios(prev => new Set(prev).add(scenarioId))
    
    try {
      const response = await fetch(`${API_BASE}/api/scenarios/${scenarioId}/execute-schema`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }
      
      const data = await response.json()
      setResults(prev => ({ ...prev, [scenarioId]: data }))
      
    } catch (error) {
      console.error('Error running schema validation:', error)
      alert(`Error running schema validation: ${error.message}`)
    } finally {
      setRunningScenarios(prev => {
        const newSet = new Set(prev)
        newSet.delete(scenarioId)
        return newSet
      })
    }
  }

  const runAllScenarios = async () => {
    setLoading(true)
    for (const scenario of scenarios) {
      await runScenario(scenario.id)
    }
    setLoading(false)
  }

  
  // AI Root Cause Analysis Functions
  const fetchRootCauseAnalysis = async (validationResultId) => {
    console.log('fetchRootCauseAnalysis - Starting for ID:', validationResultId)
    setLoadingAnalysis(prev => ({ ...prev, [validationResultId]: true }))
    
    try {
      console.log('fetchRootCauseAnalysis - Making API call...')
      const response = await fetch(`${API_BASE}/api/failures/${validationResultId}/analyze`, {
        method: 'POST'
      })
      
      console.log('fetchRootCauseAnalysis - Response status:', response.status)
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('fetchRootCauseAnalysis - Response data:', data)
      
      setRootCauseData(prev => ({
        ...prev,
        [validationResultId]: {
          root_cause_category: data.category,
          explanation: data.root_cause,
          suggested_action: data.suggested_action,
          confidence: data.confidence || data.ai_confidence || 50
        }
      }))
      
      console.log('fetchRootCauseAnalysis - Data stored successfully')
      
    } catch (error) {
      console.error('fetchRootCauseAnalysis - Error:', error)
      setRootCauseData(prev => ({
        ...prev,
        [validationResultId]: { error: 'Failed to load AI analysis: ' + error.message }
      }))
    } finally {
      setLoadingAnalysis(prev => ({ ...prev, [validationResultId]: false }))
      console.log('fetchRootCauseAnalysis - Finished for ID:', validationResultId)
    }
  }

  const handleAnalyzeAll = async (scenarioId) => {
    console.log('handleAnalyzeAll - Starting analysis for scenario:', scenarioId)
    setAnalyzingAll(prev => ({ ...prev, [scenarioId]: true }))
    setAnalysisProgress(prev => ({ ...prev, [scenarioId]: 0 }))
    setAnalysisRequested(prev => ({ ...prev, [scenarioId]: true }))

    try {
      console.log('handleAnalyzeAll - Making API call...')
      const response = await fetch(`${API_BASE}/api/scenarios/${scenarioId}/analyze-all-failures`, {
        method: 'POST'
      })

      console.log('handleAnalyzeAll - Response status:', response.status)
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()
      console.log('handleAnalyzeAll - Response data:', data)

      // Update root cause data with all analyses
      if (data.analyses) {
        console.log('Analyze All - Received analyses:', data.analyses)
        const newRootCauseData = {}
        data.analyses.forEach(analysis => {
          console.log('Analyze All - Processing analysis:', analysis)
          if (!analysis.error) {
            newRootCauseData[analysis.validation_result_id] = {
              root_cause_category: analysis.category,
              explanation: analysis.root_cause,
              suggested_action: analysis.suggested_action,
              confidence: analysis.confidence || analysis.ai_confidence || 50
            }
            console.log('Analyze All - Stored data for ID:', analysis.validation_result_id)
          }
        })
        
        console.log('Analyze All - New root cause data:', newRootCauseData)
        setRootCauseData(prev => {
          const updated = { ...prev, ...newRootCauseData }
          console.log('Analyze All - Updated rootCauseData:', updated)
          return updated
        })
      }

      setAnalysisProgress(prev => ({ ...prev, [scenarioId]: 100 }))

      // Show success message
      alert(`✓ Analyzed ${data.total_failures} failures successfully!`)

    } catch (error) {
      console.error('Batch analysis failed:', error)
      alert('Failed to analyze failures')
    } finally {
      setAnalyzingAll(prev => ({ ...prev, [scenarioId]: false }))
    }
  }

  const handleCreateBugs = async (scenarioId) => {
    setCurrentScenarioId(scenarioId)
    
    // Get all failed test results for this scenario
    const scenario = scenarios.find(s => s.id === scenarioId)
    const scenarioResults = results[scenarioId]
    
    if (!scenarioResults || scenarioResults.fail_count === 0) {
      alert('No failures found to create bugs for')
      return
    }
    
    // Prepare bug data from failures with comprehensive details
    const bugs = scenarioResults.results
      .filter(result => result.status === 'fail')
      .map(result => {
        // Extract field name from various possible sources
        const fieldName = result.field_name || result.field || 
                         (result.validation_type === 'BUSINESS_RULE' ? 'Business Rule Validation' : 'Unknown Field')
        
        // Build more descriptive expected/actual text
        const expectedText = result.expected 
          ? (fieldName !== 'Unknown Field' ? `Field "${fieldName}" should be ${result.expected}` : result.expected)
          : 'N/A'
        
        const actualText = result.actual 
          ? (fieldName !== 'Unknown Field' ? `Field "${fieldName}" is ${result.actual}` : result.actual)
          : 'N/A'
        
        // Build detailed description with all failure information
        const description = `**Test Failure Details**

**Scenario:** ${scenario.name}
**Test Category:** ${scenario.category || 'N/A'}
**Endpoint ID:** ${scenario.endpoint_id || 'N/A'}
**Execution Date:** ${new Date().toLocaleString()}

**Failure Information:**
- **Failed Field:** ${fieldName}
- **Validation Type:** ${result.validation_type || result.type || 'N/A'}
- **Expected:** ${expectedText}
- **Actual:** ${actualText}
- **Value:** ${result.value || 'N/A'}
- **Status:** ${result.status}

**Error Details:**
${result.error_message || 'No error message available'}

---
*This bug was automatically created from automated API test execution.*`

        // Check if payloads have actual data
        const hasRequestPayload = scenario.request_body && 
                                  scenario.request_body !== '{}' && 
                                  scenario.request_body.trim() !== '' &&
                                  JSON.stringify(scenario.request_body) !== '{}'
        
        const hasResponsePayload = scenarioResults.api_response && 
                                   scenarioResults.api_response !== '{}' &&
                                   JSON.stringify(scenarioResults.api_response) !== '{}' &&
                                   scenarioResults.api_response.response !== ''
        
        // Build comprehensive reproduction steps
        const reproSteps = `**Steps to Reproduce:**

1. **Navigate to Test Scenario**
   - Scenario ID: ${scenario.id}
   - Scenario Name: ${scenario.name}
   - Category: ${scenario.category || 'N/A'}

2. **Execute API Request**
   - Endpoint ID: ${scenario.endpoint_id || 'N/A'}
   - Request Method: ${scenario.method || 'GET'}${hasRequestPayload ? '\n   - Request Body: See "Request Payload" section below' : ''}

3. **Observe Validation Failure**
   - Failed Field: ${fieldName}
   - Validation Type: ${result.validation_type || result.type || 'N/A'}
   - Expected: ${expectedText}
   - Actual: ${actualText}

${hasResponsePayload ? '4. **Review Response**\n   - See "Response Payload" section below for full API response\n\n' : ''}**Expected Behavior:**
${expectedText}

**Actual Behavior:**
${actualText}`

        return {
          id: result.id,
          title: `${scenario.name} - ${fieldName} Failed`,
          description: description,
          reproSteps: reproSteps,
          severity: 'Medium',
          priority: 2,
          tags: ['Automated Test', 'API Validation', scenario.category || 'test'],
          areaPath: '',
          iterationPath: '',
          assignedTo: '',
          // Additional metadata for backend processing - only include if not empty
          requestPayload: hasRequestPayload ? scenario.request_body : null,
          responsePayload: hasResponsePayload ? scenarioResults.api_response : null,
          expectedResult: expectedText,
          actualResult: actualText,
          field: fieldName,  // Use extracted field name
          fieldName: fieldName,  // Also store as fieldName
          testType: result.validation_type || result.type || 'N/A',
          scenarioId: scenario.id,
          endpointId: scenario.endpoint_id
        }
      })
    
    setPreparedBugs(bugs)
    setShowBugModal(true)
  }
  
  const handleSubmitBugs = async () => {
    if (!userStoryId.trim()) {
      alert('Please enter a User Story ID')
      return
    }
    
    setCreatingBugs(true)
    
    try {
      const response = await fetch(`${API_BASE}/api/azure-devops/create-bugs-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_story_id: parseInt(userStoryId),
          bugs: preparedBugs
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert(`✓ Successfully created ${data.created_count} bugs in Azure DevOps!`)
        setShowBugModal(false)
        setUserStoryId('')
        setPreparedBugs([])
      } else {
        alert(`Failed to create bugs: ${data.detail || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating bugs:', error)
      alert('Failed to create bugs: ' + error.message)
    } finally {
      setCreatingBugs(false)
    }
  }
  
  const updateBugField = (bugId, field, value) => {
    setPreparedBugs(prev => prev.map(bug => 
      bug.id === bugId ? { ...bug, [field]: value } : bug
    ))
  }

  const exportResults = async (scenarioId, format) => {
    try {
      const response = await fetch(`${API_BASE}/api/scenarios/${scenarioId}/export/${format}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `scenario_${scenarioId}_results.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting results:', error)
      alert('Failed to export results')
    }
  }

  const viewResponseComparison = (scenarioId) => {
    const result = results[scenarioId]
    if (result) {
      setSelectedScenario(scenarios.find(s => s.id === scenarioId))
      setShowResponseComparison(true)
    }
  }

  const confirmDeleteScenario = (scenario) => {
    setScenarioToDelete(scenario)
    setShowDeleteConfirm(true)
  }

  const deleteScenario = async () => {
    if (!scenarioToDelete) return
    
    try {
      const response = await fetch(`${API_BASE}/api/scenarios/${scenarioToDelete.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setScenarios(scenarios.filter(s => s.id !== scenarioToDelete.id))
        setShowDeleteConfirm(false)
        setScenarioToDelete(null)
        alert('Scenario deleted successfully!')
      } else {
        alert('Failed to delete scenario')
      }
    } catch (error) {
      console.error('Error deleting scenario:', error)
      alert('Error deleting scenario: ' + error.message)
    }
  }

  const deleteAllScenarios = async () => {
    if (scenarios.length === 0) return
    
    try {
      const response = await fetch(`${API_BASE}/api/scenarios/delete-all`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setScenarios([])
        setResults({})
        setRootCauseData({})
        setAnalysisRequested({})
        setShowDeleteAllConfirm(false)
        alert(`Successfully deleted ${scenarios.length} scenarios!`)
      } else {
        alert('Failed to delete all scenarios')
      }
    } catch (error) {
      console.error('Error deleting all scenarios:', error)
      alert('Error deleting all scenarios: ' + error.message)
    }
  }

  const createCustomScenario = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/scenarios/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newScenario)
      })
      
      if (response.ok) {
        const created = await response.json()
        setScenarios([...scenarios, created])
        setShowCreateScenario(false)
        setNewScenario({
          name: '',
          category: 'positive',
          endpoint_id: '',
          request_body: '{}',
          expected_response: '{}',
          json_schema: ''
        })
        alert('Custom scenario created successfully!')
      } else {
        alert('Failed to create scenario')
      }
    } catch (error) {
      console.error('Error creating scenario:', error)
      alert('Error creating scenario: ' + error.message)
    }
  }

  const fetchBusinessRules = async (endpointId) => {
    if (!endpointId) return
    
    setLoadingBusinessRules(true)
    try {
      const response = await fetch(`${API_BASE}/api/business-rules/endpoint/${endpointId}`)
      const data = await response.json()
      setBusinessRules(data)
    } catch (error) {
      console.error('Error fetching business rules:', error)
    } finally {
      setLoadingBusinessRules(false)
    }
  }

  const saveBusinessRule = async () => {
    if (!newRuleName || !newRuleText) {
      alert('Please enter both rule name and rule text')
      return
    }
    
    if (!filterEndpointId) {
      alert('Please select an endpoint first')
      return
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/business-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint_id: parseInt(filterEndpointId),
          rule_name: newRuleName,
          rule_text: newRuleText
        })
      })
      
      if (response.ok) {
        alert('Business rule saved successfully!')
        setNewRuleName('')
        setNewRuleText('')
        fetchBusinessRules(filterEndpointId)
        fetchScenarios()  // Refresh scenarios to show the new business rule scenario
      } else {
        alert('Failed to save business rule')
      }
    } catch (error) {
      console.error('Error saving business rule:', error)
      alert('Error saving business rule')
    }
  }

  const deleteBusinessRule = async (ruleId) => {
    if (!confirm('Are you sure you want to delete this rule?')) return
    
    try {
      const response = await fetch(`${API_BASE}/api/business-rules/${ruleId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        alert('Rule deleted successfully')
        fetchBusinessRules(filterEndpointId)
        fetchScenarios()  // Refresh scenarios to remove the deleted business rule scenario
      } else {
        alert('Failed to delete rule')
      }
    } catch (error) {
      console.error('Error deleting rule:', error)
      alert('Error deleting rule')
    }
  }

  const runBusinessRuleValidation = async () => {
    if (!filterEndpointId) {
      alert('Please select an endpoint first')
      return
    }
    
    setRunningBusinessRules(true)
    setBusinessRuleResults(null)
    
    try {
      const response = await fetch(`${API_BASE}/api/business-rules/validate/${filterEndpointId}`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        console.error('Validation failed:', errorData)
        alert(`Validation failed: ${errorData.detail || 'Unknown error'}`)
        setRunningBusinessRules(false)
        return
      }
      
      const data = await response.json()
      console.log('Validation results:', data)
      
      // Validate response structure
      if (!data.summary || !data.results) {
        console.error('Invalid response structure:', data)
        alert('Invalid response from server. Check console for details.')
        setRunningBusinessRules(false)
        return
      }
      
      setBusinessRuleResults(data)
    } catch (error) {
      console.error('Error running business rule validation:', error)
      alert(`Error running validation: ${error.message}`)
    } finally {
      setRunningBusinessRules(false)
    }
  }

  const openBusinessRulesPanel = () => {
    if (!filterEndpointId) {
      alert('Please select an endpoint first to manage business rules')
      return
    }
    
    setShowBusinessRules(true)
    fetchBusinessRules(filterEndpointId)
  }

  const validateExcelData = async () => {
    if (!excelFile) {
      alert('Please select an Excel file')
      return
    }
    if (!selectedEndpoint) {
      alert('Please select an endpoint')
      return
    }
    if (!responseListPath.trim() || !matchKey.trim()) {
      alert('Please provide response list path and match key')
      return
    }

    setExcelValidationLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', excelFile)
      if (mappingId) {
        formData.append('mapping_id', mappingId)
      }
      formData.append('endpoint_id', selectedEndpoint)
      formData.append('response_list_path', responseListPath.trim())
      formData.append('match_key', matchKey.trim())
      formData.append('text_content_field', textContentField.trim() || 'textContent')

      const response = await fetch(`${API_BASE}/api/excel/validate`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to validate Excel data')
      }

      const data = await response.json()
      setExcelValidationResults(data)
    } catch (error) {
      console.error('Excel validation error:', error)
      alert(`Excel validation failed: ${error.message}`)
    } finally {
      setExcelValidationLoading(false)
    }
  }

  const formatJSON = (data) => {
    try {
      // If data is already an object, stringify it directly
      if (typeof data === 'object' && data !== null) {
        return JSON.stringify(data, null, 2)
      }
      // If data is a string, try to parse and re-stringify it
      if (typeof data === 'string') {
        return JSON.stringify(JSON.parse(data), null, 2)
      }
      // Fallback for other types
      return String(data)
    } catch {
      return String(data)
    }
  }

  // Filter scenarios based on selected endpoint
  const filteredScenarios = filterEndpointId 
    ? scenarios.filter(s => s.endpoint_id === parseInt(filterEndpointId))
    : scenarios

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Test Scenarios</h2>
        <div className="flex gap-2">
          {mappingId && (
            <button
              onClick={generateAIScenarios}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <span>✨</span>
                  Generate AI Scenarios
                </>
              )}
            </button>
          )}
          <button
            onClick={() => setShowExcelValidation(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center gap-2"
          >
            <span>📄</span>
            Validate Excel Data
          </button>
          <button
            onClick={() => setShowCreateScenario(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <span>+</span>
            Create Scenario
          </button>
          {scenarios.length > 0 && (
            <button
              onClick={() => setShowDeleteAllConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
            >
              <span>🗑️</span>
              Delete All Scenarios
            </button>
          )}
          {scenarios.length > 0 && (
            <>
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center gap-2"
              >
                <span>📊</span>
                Export to Excel
              </button>
              <button
                onClick={runAllScenarios}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Running All...
                  </>
              ) : (
                'Run All Scenarios'
              )}
              </button>
            </>
        )}
        </div>
      </div>

      {/* Endpoint Filter Dropdown */}
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Filter by Endpoint:</label>
        <select
          value={filterEndpointId}
          onChange={(e) => setFilterEndpointId(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[300px]"
        >
          <option value="">All Endpoints</option>
          {endpoints.map(endpoint => (
            <option key={endpoint.id} value={endpoint.id}>
              {endpoint.name} ({endpoint.method} {endpoint.path})
            </option>
          ))}
        </select>
        {filterEndpointId && (
          <>
            <span className="text-sm text-gray-600">
              Showing {filteredScenarios.length} of {scenarios.length} scenarios
            </span>
            <button
              onClick={openBusinessRulesPanel}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2"
            >
              <span>📋</span>
              Custom Business Scenario Validations
            </button>
          </>
        )}
      </div>

      {filteredScenarios.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            {filterEndpointId ? 'No scenarios found for selected endpoint' : 'No scenarios yet'}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {filterEndpointId 
              ? 'Try selecting a different endpoint or clear the filter' 
              : 'Upload an Excel file to generate AI scenarios, or click "Create Custom Scenario" above'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredScenarios.map((scenario) => {
            const scenarioResults = results[scenario.id]
            const isRunning = runningScenarios.has(scenario.id)

            return (
              <div key={scenario.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{scenario.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">Category: {scenario.category}</p>
                      {scenario.description && (
                        <p className="text-sm text-gray-700 mt-2">
                          <span className="font-medium">Description:</span> {scenario.description}
                        </p>
                      )}
                      {scenario.endpoint_id && (
                        <p className="text-xs text-blue-600 mt-1">
                          Endpoint: {endpoints.find(e => e.id === scenario.endpoint_id)?.name || 'Unknown'}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {/* Only show Configure for non-business-rule scenarios */}
                      {scenario.category !== 'business_rule' && (
                        <button
                          onClick={() => openRequestBuilder(scenario)}
                          className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          Configure
                        </button>
                      )}
                      
                      {/* Only show Schema Check for schema validation scenarios */}
                      {(scenario.name && (scenario.name.toLowerCase().includes('schema') || scenario.category === 'schema')) && (
                        <button
                          onClick={() => runSchemaValidation(scenario.id)}
                          disabled={isRunning}
                          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          title="Schema-only validation (structure and field presence)"
                        >
                          {isRunning ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Checking...
                            </>
                          ) : (
                            'Schema Check'
                          )}
                        </button>
                      )}
                      
                      {/* Run button - always visible */}
                      <button
                        onClick={() => runScenario(scenario.id)}
                        disabled={isRunning}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isRunning ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Running...
                          </>
                        ) : (
                          'Run'
                        )}
                      </button>
                      
                      {/* Delete button - always visible */}
                      <button
                        onClick={() => confirmDeleteScenario(scenario)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        title="Delete this scenario"
                      >
                        Delete
                      </button>
                      
                      {/* History button - always visible */}
                      <button
                        onClick={() => fetchExecutionHistory(scenario.id)}
                        className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        History
                      </button>
                    </div>
                  </div>
                </div>

                {scenarioResults && (
                  <div className="p-6">
                    {/* Debug: Show scenario results structure */}
                    {console.log('Scenario Results Debug:', scenarioResults)}
                    
                    {/* Header with stats and Analyze All button */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600">Pass:</span>
                          <span className="text-lg font-bold text-green-600">{scenarioResults.pass_count}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600">Fail:</span>
                          <span className="text-lg font-bold text-red-600">{scenarioResults.fail_count}</span>
                        </div>
                      </div>

                      {/* Debug: Show AI features condition */}
                      {console.log('AI Debug - Fail count:', scenarioResults.fail_count, 'Scenario ID:', scenario.id)}
                      
                      {/* Show Analyze All Failures button only when there are failures */}
                      {scenarioResults.fail_count > 0 && (
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <button
                            onClick={() => handleAnalyzeAll(scenario.id)}
                            disabled={analyzingAll[scenario.id]}
                            style={{
                              background: analyzingAll[scenario.id]
                                ? '#1e293b'
                                : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 8,
                              padding: '10px 20px',
                              fontSize: 12,
                              fontWeight: 700,
                              letterSpacing: '0.05em',
                              cursor: analyzingAll[scenario.id] ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              opacity: analyzingAll[scenario.id] ? 0.6 : 1,
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={(e) => {
                              if (!analyzingAll[scenario.id]) {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)'
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)'
                              e.currentTarget.style.boxShadow = 'none'
                            }}
                          >
                            {analyzingAll[scenario.id] ? (
                              <>
                                <span className="spin" style={{ display: 'inline-block' }}>◌</span>
                                Analyzing... {Math.round(analysisProgress[scenario.id] || 0)}%
                              </>
                            ) : (
                              <>
                                <span>◇</span>
                                Analyze All Failures
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleCreateBugs(scenario.id)}
                            style={{
                              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 8,
                              padding: '10px 20px',
                              fontSize: 12,
                              fontWeight: 700,
                              letterSpacing: '0.05em',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)'
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.4)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)'
                              e.currentTarget.style.boxShadow = 'none'
                            }}
                          >
                            <span>🐛</span>
                            Create Bugs for Failures
                          </button>
                        </div>
                      )}
                    </div>

                    {/* AI Insights Panel - shows only after user clicks Analyze All Failures */}
                    {console.log('AI Debug - Showing Insights Panel for fail_count:', scenarioResults.fail_count, 'analysisRequested:', analysisRequested[scenario.id])}
                    {scenarioResults.fail_count > 0 && analysisRequested[scenario.id] && (
                      <AIInsightsPanel scenarioId={scenario.id} />
                    )}

                    {/* Comprehensive Failure Analysis Panel - shows only after user clicks Analyze All Failures */}
                    {scenarioResults.fail_count > 0 && analysisRequested[scenario.id] && (
                      <div className="mb-6">
                        <div style={{
                          background: 'linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%)',
                          border: '1px solid rgba(220, 38, 38, 0.3)',
                          borderRadius: 12,
                          padding: 24,
                          marginBottom: 20
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 20
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12
                            }}>
                              <div style={{
                                width: 8,
                                height: 8,
                                background: '#dc2626',
                                borderRadius: '50%',
                                animation: 'pulse 2s infinite'
                              }}></div>
                              <h3 style={{
                                fontSize: 16,
                                fontWeight: 600,
                                color: '#f8fafc',
                                margin: 0
                              }}>
                                Failure Analysis ({scenarioResults.fail_count} issues)
                              </h3>
                            </div>
                            <div style={{
                              fontSize: 12,
                              color: '#64748b',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}>
                              AI-Powered Diagnostics
                            </div>
                          </div>

                          {/* Failure Details Grid */}
                          <div style={{
                            display: 'grid',
                            gap: 16,
                            marginBottom: 20
                          }}>
                            {scenarioResults.results
                              .filter(result => result.status === 'fail')
                              .map(result => {
                                const analysis = rootCauseData[result.id]
                                return (
                                  <div key={result.id} style={{
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    border: '1px solid rgba(220, 38, 38, 0.2)',
                                    borderRadius: 8,
                                    padding: 16
                                  }}>
                                    <div style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'flex-start',
                                      marginBottom: 12
                                    }}>
                                      <div>
                                        <div style={{
                                          fontSize: 14,
                                          fontWeight: 600,
                                          color: '#f8fafc',
                                          marginBottom: 4
                                        }}>
                                          {result.field_name}
                                        </div>
                                        <div style={{
                                          fontSize: 12,
                                          color: '#ef4444',
                                          fontFamily: 'monospace',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          maxWidth: '600px'
                                        }}>
                                          Expected: {result.expected || 'N/A'} | 
                                          Actual: {result.actual || 'N/A'}
                                        </div>
                                      </div>
                                      
                                      {analysis && !analysis.error ? (
                                        <div style={{
                                          display: 'flex',
                                          gap: 8,
                                          alignItems: 'center'
                                        }}>
                                          <CategoryBadge category={analysis.root_cause_category} />
                                          <ConfidenceBadge confidence={analysis.confidence} />
                                        </div>
                                      ) : (
                                        <div style={{
                                          padding: '4px 8px',
                                          background: 'rgba(100, 116, 139, 0.2)',
                                          borderRadius: 4,
                                          fontSize: 11,
                                          color: '#94a3b8'
                                        }}>
                                          No Analysis
                                        </div>
                                      )}
                                    </div>

                                    {/* AI Analysis */}
                                    {analysis && !analysis.error ? (
                                      <div style={{
                                        fontSize: 13,
                                        color: '#e2e8f0',
                                        lineHeight: 1.5,
                                        marginBottom: 12
                                      }}>
                                        {analysis.explanation}
                                      </div>
                                    ) : (
                                      <div style={{
                                        fontSize: 12,
                                        color: '#64748b',
                                        fontStyle: 'italic',
                                        marginBottom: 12
                                      }}>
                                        {analysis?.error || 'AI analysis not available. Click "Analyze All Failures" to generate comprehensive analysis.'}
                                      </div>
                                    )}

                                    {/* Suggested Action */}
                                    {analysis && !analysis.error && analysis.suggested_action && (
                                      <div style={{
                                        display: 'flex',
                                        gap: 8,
                                        alignItems: 'flex-start',
                                        padding: '8px 12px',
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        border: '1px solid rgba(59, 130, 246, 0.3)',
                                        borderRadius: 6
                                      }}>
                                        <div style={{
                                          fontSize: 10,
                                          fontWeight: 600,
                                          color: '#3b82f6',
                                          whiteSpace: 'nowrap',
                                          paddingTop: 2
                                        }}>
                                          ACTION →
                                        </div>
                                        <div style={{
                                          fontSize: 12,
                                          color: '#cbd5e1',
                                          lineHeight: 1.4
                                        }}>
                                          {analysis.suggested_action}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                          </div>

                          {/* Summary Stats */}
                          <div style={{
                            display: 'flex',
                            gap: 24,
                            padding: '12px 16px',
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: 8,
                            fontSize: 12,
                            color: '#94a3b8'
                          }}>
                            <div>
                              <span style={{ color: '#64748b' }}>Categories:</span> {
                                [...new Set(
                                  scenarioResults.results
                                    .filter(r => r.status === 'fail')
                                    .map(r => rootCauseData[r.id]?.root_cause_category)
                                    .filter(Boolean)
                                )].join(', ') || 'None analyzed'
                              }
                            </div>
                            <div>
                              <span style={{ color: '#64748b' }}>Avg Confidence:</span> {
                                scenarioResults.results
                                  .filter(r => r.status === 'fail')
                                  .reduce((sum, r) => sum + (rootCauseData[r.id]?.confidence || 0), 0) / 
                                scenarioResults.fail_count || 0
                              }%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center mb-4">
                      <div className="flex gap-6">
                        {scenarioResults.status_code && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Status:</span>
                            <span className={`text-lg font-bold ${
                              scenarioResults.status_code >= 200 && scenarioResults.status_code < 300 
                                ? 'text-green-600' 
                                : scenarioResults.status_code >= 300 && scenarioResults.status_code < 400
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}>
                              {scenarioResults.status_code}
                            </span>
                          </div>
                        )}
                        {scenarioResults.response_time_ms && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Response Time:</span>
                            <span className="text-lg font-bold text-blue-600">{scenarioResults.response_time_ms}ms</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewResponseComparison(scenario.id)}
                          className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          Compare Response
                        </button>
                        <button
                          onClick={() => exportResults(scenario.id, 'csv')}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Export CSV
                        </button>
                        <button
                          onClick={() => exportResults(scenario.id, 'json')}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Export JSON
                        </button>
                      </div>
                    </div>

                    <div>
                      <table className="w-full divide-y divide-gray-200 table-fixed">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-1/6">Field</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-1/12">Type</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-1/6">Expected</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-1/6">Actual</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-1/6">Value</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-1/12">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(() => {
                            const page = currentPage[scenario.id] || 1
                            const startIdx = (page - 1) * RESULTS_PER_PAGE
                            const endIdx = startIdx + RESULTS_PER_PAGE
                            const paginatedResults = scenarioResults.results.slice(startIdx, endIdx)
                            return paginatedResults.map((result, idx) => (
                            <React.Fragment key={`${scenario.id}-${result.field_name}-${idx}`}>
                              <tr>
                                <td className="px-3 py-2 text-sm font-medium text-gray-900 truncate">
                                  {result.field_name}
                                </td>
                                <td className="px-2 py-2 text-xs">
                                  <span className="px-1 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                    {result.validation_type || 'FIELD'}
                                  </span>
                                </td>
                                <td className="px-2 py-2 text-xs text-gray-700 truncate">
                                  {result.expected}
                                </td>
                                <td className="px-2 py-2 text-xs text-gray-700 truncate">
                                  {result.field_name === 'JSON_SCHEMA' && result.actual ? (
                                    <div className="font-mono text-xs bg-gray-50 px-1 py-0.5 rounded max-h-16 overflow-y-auto">
                                      <pre className="whitespace-pre-wrap">
                                        {typeof result.actual === 'string' && result.actual.startsWith('{') 
                                          ? JSON.stringify(JSON.parse(result.actual), null, 2).substring(0, 100) + '...'
                                          : String(result.actual).substring(0, 100)
                                        }
                                      </pre>
                                    </div>
                                  ) : (
                                    <span className="truncate block">{result.actual}</span>
                                  )}
                                </td>
                                <td className="px-2 py-2 text-xs text-gray-900 truncate" title={result.actual_value || 'N/A'}>
                                  {result.actual_value ? (
                                    <span className="font-mono text-xs bg-gray-50 px-1 py-0.5 rounded block truncate">
                                      {typeof result.actual_value === 'object' 
                                        ? JSON.stringify(result.actual_value).substring(0, 30) + '...'
                                        : String(result.actual_value).substring(0, 30)
                                      }
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 italic">N/A</span>
                                  )}
                                </td>
                                <td className="px-2 py-2">
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      result.status === 'pass'
                                        ? 'bg-green-100 text-green-800'
                                        : result.status === 'fail'
                                        ? 'bg-red-100 text-red-800'
                                        : result.status === 'warning'
                                        ? 'bg-orange-100 text-orange-800'
                                        : result.status === 'info'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {result.status === 'pass' ? '✓ PASS' : 
                                     result.status === 'fail' ? '✕ FAIL' : 
                                     result.status === 'warning' ? '⚠ WARNING' : 
                                     result.status === 'info' ? 'ℹ INFO' : 
                                     result.status}
                                  </span>
                                </td>
                              </tr>
                              
                              {/* Record Data Display - Show for all results with record_data */}
                              {result.record_data && (
                                <tr key={`${idx}-record`}>
                                  <td colSpan="6" className="px-0 py-0 bg-gray-50">
                                    <div className="flex border-l-4 border-blue-400">
                                      <div className="flex-shrink-0 px-4 py-3 bg-blue-50 border-r-2 border-blue-300" style={{minWidth: '120px'}}>
                                        <span className="text-xs font-semibold text-blue-700 uppercase block">Record #{result.record_number || idx + 1}</span>
                                      </div>
                                      <div className="flex-1 px-4 py-3">
                                        <pre className="text-xs font-mono bg-white p-2 rounded border border-gray-200 overflow-x-auto" style={{maxHeight: '120px', overflowY: 'auto', lineHeight: '1.3'}}>
                                          {JSON.stringify(result.record_data, null, 2)}
                                        </pre>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                              
                              {/* Error Details Display for Failed Fields */}
                              {result.status === 'fail' && (
                                <tr key={`${idx}-rootcause`}>
                                  <td colSpan="6" className="px-6 py-3 bg-red-50 border-l-4 border-red-400">
                                    <div className="flex items-start gap-3">
                                      <div className="flex-shrink-0">
                                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                                      </div>
                                      <div className="flex-1">
                                        {rootCauseData[result.id] && !rootCauseData[result.id].error ? (
                                          <>
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="text-xs font-semibold text-red-800 uppercase">Root Cause:</span>
                                              {rootCauseData[result.id].root_cause_category && (
                                                <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                                                  {rootCauseData[result.id].root_cause_category}
                                                </span>
                                              )}
                                              {rootCauseData[result.id].confidence && (
                                                <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
                                                  {Math.round(rootCauseData[result.id].confidence)}% confidence
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-sm text-red-700">
                                              {rootCauseData[result.id].explanation}
                                            </div>
                                            {rootCauseData[result.id].suggested_action && (
                                              <div className="mt-2 text-xs text-red-600">
                                                <span className="font-semibold">Action:</span> {rootCauseData[result.id].suggested_action}
                                              </div>
                                            )}
                                          </>
                                        ) : (
                                          <div className="text-sm text-red-700">
                                            {result.field_name === 'RESPONSE_MATCH' && result.root_cause ? (
                                              <>
                                                <span className="font-semibold">Differences Found:</span>
                                                <div className="mt-1 font-mono text-xs bg-white p-2 rounded border border-red-200 max-h-48 overflow-y-auto">
                                                  <pre className="whitespace-pre-wrap break-words">{result.root_cause}</pre>
                                                </div>
                                              </>
                                            ) : result.field_name === 'JSON_SCHEMA' && result.actual ? (
                                              <>
                                                <span className="font-semibold">Expected:</span> <span className="font-mono">{result.expected || 'N/A'}</span>
                                                <br />
                                                <span className="font-semibold">Actual Response:</span>
                                                <div className="mt-1 font-mono text-xs bg-white p-2 rounded border border-gray-200 max-h-48 overflow-y-auto">
                                                  <pre className="whitespace-pre-wrap">{result.actual}</pre>
                                                </div>
                                              </>
                                            ) : (
                                              <>
                                                <span className="font-semibold">Expected:</span> <span className="font-mono">{result.expected || 'N/A'}</span>
                                                <br />
                                                <span className="font-semibold">Actual:</span> <span className="font-mono">{result.actual || 'N/A'}</span>
                                              </>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))
                          })()}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination Controls */}
                    {scenarioResults.results && scenarioResults.results.length > RESULTS_PER_PAGE && (
                      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="text-sm text-gray-700">
                          Showing {((currentPage[scenario.id] || 1) - 1) * RESULTS_PER_PAGE + 1} to {Math.min((currentPage[scenario.id] || 1) * RESULTS_PER_PAGE, scenarioResults.results.length)} of {scenarioResults.results.length} results
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCurrentPage({...currentPage, [scenario.id]: (currentPage[scenario.id] || 1) - 1})}
                            disabled={(currentPage[scenario.id] || 1) === 1}
                            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <span className="px-3 py-1 text-sm text-gray-700">
                            Page {currentPage[scenario.id] || 1} of {Math.ceil(scenarioResults.results.length / RESULTS_PER_PAGE)}
                          </span>
                          <button
                            onClick={() => setCurrentPage({...currentPage, [scenario.id]: (currentPage[scenario.id] || 1) + 1})}
                            disabled={(currentPage[scenario.id] || 1) >= Math.ceil(scenarioResults.results.length / RESULTS_PER_PAGE)}
                            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Request Body Builder Modal */}
      {showRequestBuilder && selectedScenario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl my-8 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Configure Scenario: {selectedScenario.name}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Endpoint</label>
                <select
                  value={selectedEndpoint}
                  onChange={(e) => setSelectedEndpoint(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">No endpoint</option>
                  {endpoints.map(ep => (
                    <option key={ep.id} value={ep.id}>
                      {ep.name} ({ep.method} {ep.base_url}{ep.path})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Request Body (JSON)</label>
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  rows="10"
                  placeholder='{"field1": "value1", "field2": 123}'
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Response (JSON)</label>
                <textarea
                  value={expectedResponse}
                  onChange={(e) => setExpectedResponse(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  rows="8"
                  placeholder='{"status": "success", "data": {...}}'
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">JSON Schema (Optional)</label>
                <textarea
                  value={jsonSchema}
                  onChange={(e) => setJsonSchema(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  rows="8"
                  placeholder='{"type": "object", "properties": {...}, "required": [...]}'
                />
                <p className="text-xs text-gray-500 mt-1">Define JSON Schema to validate response structure</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowRequestBuilder(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={saveRequestBuilder}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Validation Modal */}
      {showExcelValidation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Validate Excel Data Against API</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Excel File</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint</label>
                <select
                  value={selectedEndpoint}
                  onChange={(e) => setSelectedEndpoint(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select endpoint</option>
                  {endpoints.map((endpoint) => (
                    <option key={endpoint.id} value={endpoint.id}>
                      {endpoint.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Response List Path</label>
                <input
                  type="text"
                  value={responseListPath}
                  onChange={(e) => setResponseListPath(e.target.value)}
                  placeholder="e.g. termsAndConditions"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Match Key</label>
                <input
                  type="text"
                  value={matchKey}
                  onChange={(e) => setMatchKey(e.target.value)}
                  placeholder="e.g. title"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Text Content Field</label>
                <input
                  type="text"
                  value={textContentField}
                  onChange={(e) => setTextContentField(e.target.value)}
                  placeholder="textContent"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            {excelValidationResults && (
              <div className="mt-6 border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">Validation Summary</div>
                  <div className="text-sm text-gray-600">
                    Response Status: {excelValidationResults.response_status}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>Total Rows: {excelValidationResults.total_rows}</div>
                  <div className="text-green-700">Pass: {excelValidationResults.pass_rows}</div>
                  <div className="text-red-700">Fail: {excelValidationResults.fail_rows}</div>
                </div>

                <div className="mt-4 max-h-64 overflow-y-auto border rounded bg-white">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2">Row</th>
                        <th className="text-left px-3 py-2">Match Value</th>
                        <th className="text-left px-3 py-2">Status</th>
                        <th className="text-left px-3 py-2">Record Found</th>
                        <th className="text-left px-3 py-2">Mismatches</th>
                      </tr>
                    </thead>
                    <tbody>
                      {excelValidationResults.results.map((row) => (
                        <tr
                          key={`${row.row_index}-${row.match_value}`}
                          className={`border-t cursor-pointer ${selectedExcelRow?.row_index === row.row_index ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}
                          onClick={() => setSelectedExcelRow(row)}
                        >
                          <td className="px-3 py-2">{row.row_index}</td>
                          <td className="px-3 py-2 font-mono text-xs">{row.match_value}</td>
                          <td className={`px-3 py-2 ${row.status === 'pass' ? 'text-green-700' : 'text-red-700'}`}>
                            {row.status}
                          </td>
                          <td className="px-3 py-2">{row.record_found ? 'Yes' : 'No'}</td>
                          <td className="px-3 py-2">
                            {row.field_results ? row.field_results.filter((item) => item.status === 'fail').length : 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedExcelRow && (
                  <div className="mt-4 border rounded bg-white p-3">
                    <div className="text-sm font-semibold mb-2">
                      Mismatch Details (Row {selectedExcelRow.row_index})
                    </div>
                    {selectedExcelRow.record_found ? (
                      <div className="space-y-2 text-xs">
                        {selectedExcelRow.field_results
                          .filter((item) => item.status === 'fail')
                          .map((item) => (
                            <div key={item.field} className="border rounded p-2 bg-red-50">
                              <div className="font-semibold text-red-700">{item.field}</div>
                              <div className="text-gray-700">Expected: <span className="font-mono">{item.expected}</span></div>
                              <div className="text-gray-700">Actual: <span className="font-mono">{item.actual}</span></div>
                              {item.message && <div className="text-red-600">{item.message}</div>}
                            </div>
                          ))}
                        {selectedExcelRow.field_results.filter((item) => item.status === 'fail').length === 0 && (
                          <div className="text-green-700">No mismatches for this row.</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-red-600 text-sm">No matching record found for this row.</div>
                    )}
                  </div>
                )}

                {selectedExcelRow && selectedExcelRow.matched_record && (
                  <div className="mt-4 border rounded bg-white p-3">
                    <div className="text-sm font-semibold mb-2">Matched API Response</div>
                    <pre className="bg-gray-50 p-3 rounded border border-gray-200 overflow-auto max-h-64 text-xs">
                      {JSON.stringify(selectedExcelRow.matched_record, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setShowExcelValidation(false)
                  setExcelValidationResults(null)
                  setSelectedExcelRow(null)
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
              <button
                onClick={validateExcelData}
                disabled={excelValidationLoading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {excelValidationLoading ? 'Validating...' : 'Validate Excel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Response Comparison Modal */}
      {showResponseComparison && selectedScenario && results[selectedScenario.id] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl my-8 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Response Comparison: {selectedScenario.name}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Expected Response</h4>
                <pre className="bg-gray-50 p-4 rounded border border-gray-200 overflow-auto max-h-96 text-xs">
                  {formatJSON(results[selectedScenario.id]?.expected_response || selectedScenario.expected_response || '{}')}
                </pre>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Actual Response</h4>
                <pre className="bg-gray-50 p-4 rounded border border-gray-200 overflow-auto max-h-96 text-xs">
                  {formatJSON(results[selectedScenario.id]?.actual_response || '{}')}
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowResponseComparison(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Execution History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl my-8 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Execution History</h3>
            
            {executionHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No execution history available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pass</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fail</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Response Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {executionHistory.map((exec) => (
                      <tr key={exec.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(exec.execution_date).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            exec.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {exec.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          {exec.pass_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                          {exec.fail_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {exec.total_response_time_ms ? `${exec.total_response_time_ms}ms` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowHistory(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Scenario Modal */}
      {showCreateScenario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Create Custom Test Scenario</h3>
            
            <div className="space-y-4">
              {/* Scenario Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scenario Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newScenario.name}
                  onChange={(e) => setNewScenario({ ...newScenario, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Happy Path - Valid FOA"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={newScenario.category}
                  onChange={(e) => setNewScenario({ ...newScenario, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="positive">Positive (Happy Path)</option>
                  <option value="negative">Negative (Error Cases)</option>
                  <option value="edge">Edge Cases</option>
                  <option value="security">Security Tests</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Endpoint Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Endpoint <span className="text-red-500">*</span>
                </label>
                <select
                  value={newScenario.endpoint_id}
                  onChange={(e) => setNewScenario({ ...newScenario, endpoint_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select an endpoint...</option>
                  {endpoints.map((endpoint) => (
                    <option key={endpoint.id} value={endpoint.id}>
                      {endpoint.name} - {endpoint.method} {endpoint.base_url}{endpoint.path}
                    </option>
                  ))}
                </select>
              </div>

              {/* Request Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Request Body (JSON)
                  <span className="text-xs text-gray-500 ml-2">For POST/PUT/PATCH methods</span>
                </label>
                <textarea
                  value={newScenario.request_body}
                  onChange={(e) => setNewScenario({ ...newScenario, request_body: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  rows="8"
                  placeholder='{\n  "field1": "value1",\n  "field2": "value2"\n}'
                />
              </div>

              {/* Expected Response */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Response (JSON)
                  <span className="text-xs text-gray-500 ml-2">Optional - For comparison</span>
                </label>
                <textarea
                  value={newScenario.expected_response}
                  onChange={(e) => setNewScenario({ ...newScenario, expected_response: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  rows="6"
                  placeholder='{\n  "status": "success",\n  "data": {...}\n}'
                />
              </div>

              {/* JSON Schema */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  JSON Schema (Optional)
                  <span className="text-xs text-gray-500 ml-2">For structure validation</span>
                </label>
                <textarea
                  value={newScenario.json_schema}
                  onChange={(e) => setNewScenario({ ...newScenario, json_schema: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  rows="6"
                  placeholder='{\n  "type": "object",\n  "properties": {...},\n  "required": [...]\n}'
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setShowCreateScenario(false)
                  setNewScenario({
                    name: '',
                    category: 'positive',
                    endpoint_id: '',
                    request_body: '{}',
                    expected_response: '{}',
                    json_schema: ''
                  })
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={createCustomScenario}
                disabled={!newScenario.name || !newScenario.endpoint_id}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Scenario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && scenarioToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Delete Scenario</h3>
            
            <p className="text-gray-700 mb-2">
              Are you sure you want to delete this scenario?
            </p>
            
            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <p className="font-medium text-gray-900">{scenarioToDelete.name}</p>
              <p className="text-sm text-gray-600">Category: {scenarioToDelete.category}</p>
            </div>
            
            <p className="text-sm text-red-600 mb-6">
              ⚠️ This will permanently delete the scenario and all its execution history. This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setScenarioToDelete(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={deleteScenario}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete Scenario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Delete All Scenarios</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete all {scenarios.length} scenarios? This action cannot be undone and will also delete all associated test results and AI analysis data.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={deleteAllScenarios}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete All Scenarios
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Custom Business Scenario Validations Modal */}
      {showBusinessRules && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Custom Business Scenario Validations</h2>
              <button
                onClick={() => {
                  setShowBusinessRules(false)
                  setBusinessRuleResults(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Rule Editor Section */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Validation Rule</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Write validation rules in natural language. The AI will interpret and execute them.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rule Name</label>
                    <input
                      type="text"
                      value={newRuleName}
                      onChange={(e) => setNewRuleName(e.target.value)}
                      placeholder="e.g., HRSA Flag Validation"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rule Text (Natural Language)</label>
                    <textarea
                      value={newRuleText}
                      onChange={(e) => setNewRuleText(e.target.value)}
                      placeholder="Examples:&#10;- If title starts with HRSA- then hrsaWideFlag must be Y&#10;- trackingTypeCode must be one of: Term, Condition, Reporting Requirement&#10;- activeDate should not be later than lastUpdateDate&#10;- If programType is null then inactiveDate must also be null"
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                    />
                  </div>
                  
                  <button
                    onClick={saveBusinessRule}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Save Rule
                  </button>
                </div>
              </div>

              {/* Saved Rules Section */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Saved Custom Business Scenarios</h3>
                  <button
                    onClick={runBusinessRuleValidation}
                    disabled={runningBusinessRules || businessRules.length === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {runningBusinessRules ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Running Validation...
                      </>
                    ) : (
                      <>
                        <span>▶</span>
                        Run Business Scenarios
                      </>
                    )}
                  </button>
                </div>
                
                <div className="p-6">
                  {loadingBusinessRules ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading rules...</p>
                    </div>
                  ) : businessRules.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No rules created yet. Create your first validation rule above.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {businessRules.map((rule) => (
                        <div key={rule.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{rule.rule_name}</h4>
                              <p className="text-sm text-gray-600 mt-1 font-mono bg-gray-100 p-2 rounded">
                                {rule.rule_text}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                Created: {new Date(rule.created_date).toLocaleString()}
                              </p>
                            </div>
                            <button
                              onClick={() => deleteBusinessRule(rule.id)}
                              className="ml-4 text-red-600 hover:text-red-800"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Validation Results Section */}
              {businessRuleResults && businessRuleResults.summary && businessRuleResults.results && (
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Validation Results</h3>
                    <div className="mt-2 flex gap-4 text-sm">
                      <span className="text-gray-600">
                        Total Validations: <strong>{businessRuleResults.summary.total_validations || 0}</strong>
                      </span>
                      <span className="text-green-600">
                        Passed: <strong>{businessRuleResults.summary.passed || 0}</strong>
                      </span>
                      <span className="text-red-600">
                        Failed: <strong>{businessRuleResults.summary.failed || 0}</strong>
                      </span>
                      <span className="text-gray-600">
                        Records: <strong>{businessRuleResults.summary.total_records || 0}</strong>
                      </span>
                      <span className="text-gray-600">
                        Rules: <strong>{businessRuleResults.summary.total_rules || 0}</strong>
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rule</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Record #</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actual</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Error Message</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {businessRuleResults.results && businessRuleResults.results.map((result, idx) => (
                          <tr key={idx} className={result.result === 'FAIL' ? 'bg-red-50' : ''}>
                            <td className="px-4 py-3 text-sm">
                              <div className="font-medium text-gray-900">{result.rule_name}</div>
                              <div className="text-xs text-gray-500 font-mono">{result.rule_text}</div>
                              {result.warnings && result.warnings.length > 0 && (
                                <div className="text-xs text-orange-600 mt-1">
                                  {result.warnings.map((w, i) => <div key={i}>⚠️ {w}</div>)}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{result.record_number}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-mono">{result.field_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{result.expected_value || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{result.actual_value || '-'}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                result.result === 'PASS' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {result.result}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{result.error_message || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* API Response Section */}
              {businessRuleResults && businessRuleResults.api_response && (
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">API Response Received</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Raw JSON response from the endpoint
                    </p>
                  </div>
                  
                  <div className="p-6">
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs font-mono border border-gray-200">
                      {JSON.stringify(businessRuleResults.api_response, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bug Creation Modal */}
      {showBugModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            maxWidth: 1200,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: 24,
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              color: '#fff'
            }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                  🐛 Review & Create Bugs ({preparedBugs.length})
                </h2>
                <p style={{ fontSize: 14, margin: '8px 0 0 0', opacity: 0.9 }}>
                  Review bug details and link to User Story before submitting to Azure DevOps
                </p>
              </div>
              <button
                onClick={() => setShowBugModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 24,
                  cursor: 'pointer',
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* User Story ID Input */}
            <div style={{ padding: 24, borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                User Story ID <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="number"
                value={userStoryId}
                onChange={(e) => setUserStoryId(e.target.value)}
                placeholder="Enter User Story ID (e.g., 420291)"
                style={{
                  width: '100%',
                  padding: 12,
                  border: '2px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
                All bugs will be linked to this User Story in Azure DevOps
              </p>
            </div>

            {/* Bugs List */}
            <div style={{ padding: 24 }}>
              {preparedBugs.map((bug, index) => (
                <div key={bug.id} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 20,
                  marginBottom: 16,
                  background: '#fff'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{
                      background: '#dc2626',
                      color: '#fff',
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 700
                    }}>
                      {index + 1}
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0, flex: 1 }}>
                      Bug #{index + 1}
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gap: 16 }}>
                    {/* Title */}
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                        Title
                      </label>
                      <input
                        type="text"
                        value={bug.title}
                        onChange={(e) => updateBugField(bug.id, 'title', e.target.value)}
                        style={{
                          width: '100%',
                          padding: 10,
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          fontSize: 14
                        }}
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                        Description
                      </label>
                      <textarea
                        value={bug.description}
                        onChange={(e) => updateBugField(bug.id, 'description', e.target.value)}
                        rows={4}
                        style={{
                          width: '100%',
                          padding: 10,
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          fontSize: 13,
                          fontFamily: 'monospace',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    {/* Repro Steps */}
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                        Reproduction Steps
                      </label>
                      <textarea
                        value={bug.reproSteps}
                        onChange={(e) => updateBugField(bug.id, 'reproSteps', e.target.value)}
                        rows={5}
                        style={{
                          width: '100%',
                          padding: 10,
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          fontSize: 13,
                          fontFamily: 'monospace',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    {/* Metadata Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                          Severity
                        </label>
                        <select
                          value={bug.severity}
                          onChange={(e) => updateBugField(bug.id, 'severity', e.target.value)}
                          style={{
                            width: '100%',
                            padding: 10,
                            border: '1px solid #d1d5db',
                            borderRadius: 6,
                            fontSize: 14
                          }}
                        >
                          <option value="Critical">Critical</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                          Priority
                        </label>
                        <select
                          value={bug.priority}
                          onChange={(e) => updateBugField(bug.id, 'priority', parseInt(e.target.value))}
                          style={{
                            width: '100%',
                            padding: 10,
                            border: '1px solid #d1d5db',
                            borderRadius: 6,
                            fontSize: 14
                          }}
                        >
                          <option value="1">1 - High</option>
                          <option value="2">2 - Medium</option>
                          <option value="3">3 - Low</option>
                          <option value="4">4 - Very Low</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                          Assigned To
                        </label>
                        <input
                          type="text"
                          value={bug.assignedTo}
                          onChange={(e) => updateBugField(bug.id, 'assignedTo', e.target.value)}
                          placeholder="Email or name"
                          style={{
                            width: '100%',
                            padding: 10,
                            border: '1px solid #d1d5db',
                            borderRadius: 6,
                            fontSize: 14
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: 24,
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f9fafb'
            }}>
              <div style={{ fontSize: 14, color: '#6b7280' }}>
                {preparedBugs.length} bug{preparedBugs.length !== 1 ? 's' : ''} ready to create
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setShowBugModal(false)}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    color: '#374151',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitBugs}
                  disabled={creatingBugs || !userStoryId.trim()}
                  style={{
                    padding: '10px 24px',
                    border: 'none',
                    background: creatingBugs || !userStoryId.trim() 
                      ? '#9ca3af' 
                      : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                    color: '#fff',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: creatingBugs || !userStoryId.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  {creatingBugs ? (
                    <>
                      <span className="spin" style={{ display: 'inline-block' }}>◌</span>
                      Creating Bugs...
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      Submit {preparedBugs.length} Bug{preparedBugs.length !== 1 ? 's' : ''} to Azure DevOps
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// CSS Animations
const style = document.createElement('style')
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
      max-height: 0;
    }
    to {
      opacity: 1;
      transform: translateY(0);
      max-height: 500px;
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  .spin {
    animation: spin 1s linear infinite;
  }
`
document.head.appendChild(style)

export default EnhancedScenario1Tab
