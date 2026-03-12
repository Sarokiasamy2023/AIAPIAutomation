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
        background: '#ff0000',
        border: '2px solid #ffffff',
        borderRadius: 12,
        padding: 40,
        marginBottom: 24,
        textAlign: 'center'
      }}>
        <div className="spin" style={{ fontSize: 24, marginBottom: 10, display: 'inline-block' }}>◌</div>
        <div style={{ fontSize: 16, color: '#ffffff', fontWeight: 'bold' }}>DEBUG: AI Insights Panel LOADING...</div>
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div style={{
        background: '#ffff00',
        border: '2px solid #000000',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 16, color: '#000000', fontWeight: 'bold' }}>
          DEBUG: AI Insights Panel - NO INSIGHTS DATA
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
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.12em',
        color: '#94a3b8',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <span style={{ fontSize: 14 }}>⚡</span>
        AI INSIGHTS — TOP ISSUES DETECTED
      </div>

      {insights.map((insight, i) => {
        // Determine colors based on severity
        const severityColors = {
          critical: { bg: 'rgba(127, 29, 29, 0.2)', border: '#dc2626', dot: '#dc2626', icon: '🔴' },
          warning: { bg: 'rgba(120, 53, 15, 0.2)', border: '#d97706', dot: '#d97706', icon: '🟡' },
          info: { bg: 'rgba(30, 58, 138, 0.2)', border: '#3b82f6', dot: '#3b82f6', icon: '🔵' }
        }

        const colors = severityColors[insight.severity] || severityColors.info

        return (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
              padding: '12px 16px',
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              marginBottom: i < insights.length - 1 ? 10 : 0,
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(4px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(0)'
            }}
          >
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: colors.dot,
              marginTop: 6,
              flexShrink: 0
            }} />
            
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#f1f5f9',
                marginBottom: 4
              }}>
                {colors.icon} {insight.title}
              </div>
              <div style={{
                fontSize: 11,
                color: '#cbd5e1',
                lineHeight: 1.6
              }}>
                {insight.description}
              </div>
              {insight.suggested_action && (
                <div style={{
                  fontSize: 10,
                  color: '#94a3b8',
                  marginTop: 6,
                  fontStyle: 'italic'
                }}>
                  → {insight.suggested_action}
                </div>
              )}
            </div>

            <div style={{
              fontSize: 10,
              color: '#64748b',
              flexShrink: 0,
              padding: '2px 8px',
              background: '#1e293b',
              borderRadius: 4
            }}>
              {insight.affected_fields} fields
            </div>
          </div>
        )
      })}
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
    color: '#64748b',
    bg: 'rgba(30, 41, 59, 0.2)'
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: 6,
      background: cat.bg,
      border: `1px solid ${cat.color}40`,
      fontSize: 11,
      fontWeight: 600,
      color: cat.color
    }}>
      <span style={{ fontSize: 14 }}>{cat.icon}</span>
      {cat.label}
    </div>
  )
}

// Confidence Badge Component
function ConfidenceBadge({ confidence }) {
  // Determine color based on confidence level
  let color, bg, label
  
  if (confidence >= 85) {
    color = '#059669'
    bg = 'rgba(2, 72, 37, 0.2)'
    label = 'High'
  } else if (confidence >= 70) {
    color = '#3b82f6'
    bg = 'rgba(30, 58, 138, 0.2)'
    label = 'Medium'
  } else {
    color = '#d97706'
    bg = 'rgba(120, 53, 15, 0.2)'
    label = 'Low'
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: 6,
      background: bg,
      border: `1px solid ${color}40`,
      fontSize: 11,
      fontWeight: 600,
      color: color
    }}>
      <div style={{
        width: 40,
        height: 4,
        background: '#1e293b',
        borderRadius: 2,
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${confidence}%`,
          height: '100%',
          background: color,
          transition: 'width 0.3s'
        }} />
      </div>
      {confidence}% {label}
    </div>
  )
}

// Historical Tooltip Component
function HistoricalTooltip({ fieldName, history }) {
  const [show, setShow] = useState(false)

  if (!history) return null

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span style={{
        fontSize: 10,
        color: '#64748b',
        cursor: 'help',
        marginLeft: 6
      }}>ⓘ</span>

      {show && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: 8,
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 8,
          padding: 12,
          minWidth: 200,
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#94a3b8',
            marginBottom: 8
          }}>HISTORICAL PATTERN</div>

          <div style={{ fontSize: 11, color: '#cbd5e1', marginBottom: 6 }}>
            Pass rate (last 10 runs): <strong style={{ color: history.pass_rate >= 50 ? '#059669' : '#dc2626' }}>
              {history.pass_rate}%
            </strong>
          </div>

          <div style={{ fontSize: 11, color: '#cbd5e1', marginBottom: 6 }}>
            Failure pattern: <strong>{history.fail_count}</strong> of {history.total_runs || 10} runs
          </div>

          {history.common_failures && history.common_failures.length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 8, marginBottom: 4 }}>
                Common failure values:
              </div>
              {history.common_failures.map((val, i) => (
                <div key={i} style={{
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: '#f1f5f9',
                  padding: '2px 6px',
                  background: '#0f172a',
                  borderRadius: 4,
                  marginBottom: 2,
                  maxWidth: 180,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {val}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Scenario1Tab({ mappingId }) {
  // DEBUG: Alert when component loads
  React.useEffect(() => {
    alert('🔴 DEBUG: Scenario1Tab component loaded!')
  }, [])

  const [scenarios, setScenarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [runningScenarios, setRunningScenarios] = useState(new Set())
  const [results, setResults] = useState({})
  const [expandedRows, setExpandedRows] = useState({})
  const [rootCauseData, setRootCauseData] = useState({})
  const [loadingAnalysis, setLoadingAnalysis] = useState({})
  const [analyzingAll, setAnalyzingAll] = useState({})
  const [analysisProgress, setAnalysisProgress] = useState({})

  useEffect(() => {
    if (mappingId) {
      fetchScenarios()
    }
  }, [mappingId])

  const fetchScenarios = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/mappings/${mappingId}/scenarios`)
      const data = await response.json()
      setScenarios(data)
    } catch (error) {
      console.error('Error fetching scenarios:', error)
    }
  }

  const runScenario = async (scenarioId) => {
    setRunningScenarios(prev => new Set(prev).add(scenarioId))
    
    try {
      const response = await fetch(`${API_BASE}/api/scenarios/${scenarioId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
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

  const runAllScenarios = async () => {
    setLoading(true)
    for (const scenario of scenarios) {
      await runScenario(scenario.id)
    }
    setLoading(false)
  }

  const toggleRow = async (scenarioId, fieldName, validationResultId) => {
    const key = `${scenarioId}-${fieldName}`
    
    // If already expanded, collapse it
    if (expandedRows[key]) {
      setExpandedRows(prev => ({
        ...prev,
        [key]: false
      }))
      return
    }
    
    // Expand the row
    setExpandedRows(prev => ({
      ...prev,
      [key]: true
    }))
    
    // Check if we already have the analysis
    if (rootCauseData[validationResultId]) {
      return
    }
    
    // Fetch AI analysis
    setLoadingAnalysis(prev => ({ ...prev, [validationResultId]: true }))
    
    try {
      const response = await fetch(`${API_BASE}/api/failures/${validationResultId}/analyze`, {
        method: 'POST'
      })
      const data = await response.json()
      
      setRootCauseData(prev => ({
        ...prev,
        [validationResultId]: data
      }))
    } catch (error) {
      console.error('Failed to fetch root cause:', error)
      setRootCauseData(prev => ({
        ...prev,
        [validationResultId]: { error: 'Failed to load AI analysis' }
      }))
    } finally {
      setLoadingAnalysis(prev => ({ ...prev, [validationResultId]: false }))
    }
  }

  const handleAnalyzeAll = async (scenarioId) => {
    console.log('handleAnalyzeAll - Starting analysis for scenario:', scenarioId)
    setAnalyzingAll(prev => ({ ...prev, [scenarioId]: true }))
    setAnalysisProgress(prev => ({ ...prev, [scenarioId]: 0 }))

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
        const newRootCauseData = {}
        data.analyses.forEach(analysis => {
          if (!analysis.error) {
            newRootCauseData[analysis.validation_result_id] = {
              root_cause_category: analysis.category,
              explanation: analysis.root_cause,
              suggested_action: analysis.suggested_action,
              ai_confidence: analysis.confidence,
              confidence: analysis.confidence
            }
          }
        })

        setRootCauseData(prev => ({
          ...prev,
          ...newRootCauseData
        }))
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

  if (!mappingId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Upload a file first to generate test scenarios</p>
      </div>
    )
  }

  return (
    <div>
      {/* DEBUG INDICATOR AT TOP */}
      <div style={{
        background: '#ff0000',
        color: '#ffffff',
        padding: '20px',
        marginBottom: '20px',
        fontSize: '20px',
        fontWeight: 'bold',
        textAlign: 'center',
        border: '3px solid #ffffff'
      }}>
        🔴 DEBUG: Scenario1Tab Component Loaded! 🔴
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Test Scenarios</h2>
        {scenarios.length > 0 && (
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
        )}
      </div>

      {scenarios.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No scenarios generated yet</p>
          <p className="text-sm text-gray-400 mt-2">Click "Generate Tests" on the upload tab</p>
        </div>
      ) : (
        <div className="space-y-6">
          {scenarios.map((scenario) => {
            const scenarioResults = results[scenario.id]
            const isRunning = runningScenarios.has(scenario.id)

            return (
              <div key={scenario.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{scenario.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">Category: {scenario.category}</p>
                  </div>
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
                </div>

                {scenarioResults && (
                  <div className="p-6">
                    {/* VERY OBVIOUS DEBUG INDICATOR */}
                    <div style={{
                      background: '#ff0000',
                      color: '#ffffff',
                      padding: '10px',
                      marginBottom: '10px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      DEBUG: AI Features Loaded! Fail Count: {scenarioResults.fail_count}
                    </div>
                    
                    {/* Debug: Show scenario results structure */}
                    {console.log('Scenario Results Debug:', scenarioResults)}
                    {/* Header with stats and Analyze All button */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 20
                    }}>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>
                          Validation Results
                        </h3>
                        <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                          <div style={{ color: '#059669', fontWeight: 600 }}>
                            ✓ {scenarioResults.pass_count} passed
                          </div>
                          <div style={{ color: '#dc2626', fontWeight: 600 }}>
                            ✕ {scenarioResults.fail_count} failed
                          </div>
                        </div>
                      </div>

                      {/* Debug: Show AI features condition */}
                      {console.log('AI Debug - Fail count:', scenarioResults.fail_count, 'Scenario ID:', scenario.id)}
                      
                      {/* Temporary: Force show AI features for debugging */}
                      {(scenarioResults.fail_count > 0 || true) && (
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
                      )}
                    </div>

                    {/* AI Insights Panel - shows only if there are failures */}
                    {console.log('AI Debug - Showing Insights Panel for fail_count:', scenarioResults.fail_count)}
                    {/* Temporary: Force show AI Insights Panel for debugging */}
                    {(scenarioResults.fail_count > 0 || true) && (
                      <AIInsightsPanel scenarioId={scenario.id} />
                    )}

                    <div className="overflow-x-auto">
                      <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #1e293b' }}>
                            <th style={{ padding: '10px', textAlign: 'left', fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' }}>FIELD</th>
                            <th style={{ padding: '10px', textAlign: 'left', fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' }}>TYPE</th>
                            <th style={{ padding: '10px', textAlign: 'left', fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' }}>EXPECTED</th>
                            <th style={{ padding: '10px', textAlign: 'left', fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' }}>ACTUAL</th>
                            <th style={{ padding: '10px', textAlign: 'center', fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' }}>STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scenarioResults.results.map((result, idx) => {
                            const rowKey = `${scenario.id}-${result.field_name}`
                            const isExpanded = expandedRows[rowKey]
                            
                            return (
                              <React.Fragment key={idx}>
                                {/* Main Row */}
                                <tr
                                  onClick={() => result.status === 'fail' && toggleRow(scenario.id, result.field_name, result.id)}
                                  style={{
                                    cursor: result.status === 'fail' ? 'pointer' : 'default',
                                    borderBottom: '1px solid rgba(30, 41, 59, 0.2)',
                                    background: isExpanded ? '#0f172a' : (idx % 2 === 0 ? 'transparent' : 'rgba(15, 23, 42, 0.5)'),
                                    transition: 'background 0.15s'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (result.status === 'fail') {
                                      e.currentTarget.style.background = '#1e293b'
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isExpanded) {
                                      e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(15, 23, 42, 0.5)'
                                    }
                                  }}
                                >
                                  <td style={{ padding: '12px 10px', fontSize: 12, color: '#f1f5f9', fontWeight: 500 }}>
                                    {result.field_name}
                                    {result.status === 'fail' && result.historical_context && (
                                      <HistoricalTooltip 
                                        fieldName={result.field_name}
                                        history={result.historical_context}
                                      />
                                    )}
                                  </td>
                                  <td style={{ padding: '12px 10px', fontSize: 11, color: '#94a3b8' }}>
                                    {result.validation_type || 'N/A'}
                                  </td>
                                  <td style={{ padding: '12px 10px', fontSize: 11, color: '#cbd5e1', fontFamily: 'monospace' }}>
                                    {result.expected}
                                  </td>
                                  <td style={{ padding: '12px 10px', fontSize: 11, color: '#cbd5e1', fontFamily: 'monospace' }}>
                                    {result.actual}
                                  </td>
                                  <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                    {result.status === 'pass' ? (
                                      <span style={{
                                        padding: '4px 10px',
                                        borderRadius: 12,
                                        fontSize: 10,
                                        fontWeight: 700,
                                        background: '#059669',
                                        color: '#fff'
                                      }}>✓ PASS</span>
                                    ) : (
                                      <span style={{
                                        padding: '4px 10px',
                                        borderRadius: 12,
                                        fontSize: 10,
                                        fontWeight: 700,
                                        background: '#dc2626',
                                        color: '#fff'
                                      }}>✕ FAIL</span>
                                    )}
                                  </td>
                                </tr>

                                {/* Expanded Root Cause Panel */}
                                {isExpanded && result.status === 'fail' && (
                                  <tr>
                                    <td colSpan={5} style={{ padding: 0 }}>
                                      <div style={{
                                        background: 'linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%)',
                                        border: '1px solid rgba(220, 38, 38, 0.5)',
                                        borderLeft: '4px solid #dc2626',
                                        borderRadius: 8,
                                        margin: '12px 16px',
                                        padding: 20,
                                        animation: 'slideDown 0.2s ease-out'
                                      }}>
                                        {loadingAnalysis[result.id] ? (
                                          <div style={{ textAlign: 'center', padding: 20 }}>
                                            <div className="spin" style={{ fontSize: 24, marginBottom: 10, display: 'inline-block' }}>◌</div>
                                            <div style={{ fontSize: 12, color: '#94a3b8' }}>AI is analyzing this failure...</div>
                                          </div>
                                        ) : rootCauseData[result.id] && !rootCauseData[result.id].error ? (
                                          <>
                                            {/* Header */}
                                            <div style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 12,
                                              marginBottom: 16
                                            }}>
                                              <div style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 20
                                              }}>◇</div>
                                              <div style={{ flex: 1 }}>
                                                <div style={{
                                                  fontSize: 11,
                                                  fontWeight: 700,
                                                  letterSpacing: '0.1em',
                                                  color: '#dc2626',
                                                  marginBottom: 8
                                                }}>AI ROOT CAUSE ANALYSIS</div>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                  <CategoryBadge category={rootCauseData[result.id].root_cause_category} />
                                                  <ConfidenceBadge confidence={rootCauseData[result.id].confidence || rootCauseData[result.id].ai_confidence || 50} />
                                                </div>
                                              </div>
                                            </div>

                                            {/* Explanation */}
                                            <div style={{
                                              fontSize: 14,
                                              lineHeight: 1.7,
                                              color: '#e2e8f0',
                                              marginBottom: 16,
                                              padding: '12px 16px',
                                              background: '#0f172a',
                                              borderRadius: 6,
                                              border: '1px solid #1e293b'
                                            }}>
                                              {rootCauseData[result.id].explanation || rootCauseData[result.id].root_cause || 'No explanation available'}
                                            </div>

                                            {/* Suggested Action */}
                                            {rootCauseData[result.id].suggested_action && (
                                              <div style={{
                                                display: 'flex',
                                                gap: 12,
                                                alignItems: 'flex-start'
                                              }}>
                                                <div style={{
                                                  fontSize: 10,
                                                  fontWeight: 700,
                                                  letterSpacing: '0.1em',
                                                  color: '#3b82f6',
                                                  paddingTop: 2
                                                }}>NEXT ACTION →</div>
                                                <div style={{
                                                  fontSize: 13,
                                                  color: '#cbd5e1',
                                                  lineHeight: 1.6
                                                }}>
                                                  {rootCauseData[result.id].suggested_action}
                                                </div>
                                              </div>
                                            )}
                                          </>
                                        ) : (
                                          <div style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: 10 }}>
                                            {rootCauseData[result.id]?.error || 'Failed to load AI analysis. Click to retry.'}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      
      {/* CSS Animations */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default Scenario1Tab
