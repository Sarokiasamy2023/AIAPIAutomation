import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import EnhancedScenario1Tab from './EnhancedScenario1Tab'
import EndpointsTab from './EndpointsTab'
import Dashboard from './Dashboard'
import EmailReportsTab from './EmailReportsTab'

const API_BASE = 'http://localhost:8000'

function App() {
  const [activeTab, setActiveTab] = useState('upload')
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [parsedFields, setParsedFields] = useState([])
  const [generatingTests, setGeneratingTests] = useState(false)
  const [endpoints, setEndpoints] = useState([])
  const [selectedEndpoint, setSelectedEndpoint] = useState('')
  const [loadingEndpoints, setLoadingEndpoints] = useState(false)
  const [businessRules, setBusinessRules] = useState('')

  // Fetch available endpoints
  const fetchEndpoints = async () => {
    setLoadingEndpoints(true)
    try {
      console.log('Fetching endpoints from:', `${API_BASE}/api/endpoints`)
      const response = await fetch(`${API_BASE}/api/endpoints`)
      console.log('Endpoints response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Endpoints data:', data)
        setEndpoints(data)
        // Don't auto-select endpoint - let user choose explicitly
      } else {
        console.error('Failed to fetch endpoints:', response.status, response.statusText)
        // Set empty endpoints array to prevent infinite loading
        setEndpoints([])
      }
    } catch (error) {
      console.error('Error fetching endpoints:', error)
      // Set empty endpoints array to prevent infinite loading
      setEndpoints([])
    } finally {
      setLoadingEndpoints(false)
    }
  }

  // Fetch endpoints on component mount
  useEffect(() => {
    fetchEndpoints()
  }, [])

  // Parse Excel table data from clipboard
  const parseExcelTableData = (text) => {
    // Check if the text looks like Excel table data (tabs or multiple columns)
    const lines = text.split('\n').filter(line => line.trim())
    
    // If it's just simple bullet points, return as-is
    if (lines.length <= 1 || !lines.some(line => line.includes('\t'))) {
      return text
    }
    
    const parsedRules = []
    
    lines.forEach((line, index) => {
      const columns = line.split('\t')
      
      // Skip header rows or empty lines - updated for user's Excel format
      if (columns.length < 2 || 
          columns[0].toLowerCase().includes('business') ||
          columns[0].toLowerCase().includes('scenario') ||
          columns[0].toLowerCase().includes('rule') ||
          columns[0].toLowerCase().includes('test') ||
          columns[0].toLowerCase().includes('expected') ||
          columns[0].toLowerCase().includes('field')) {
        return
      }
      
      // Handle different Excel formats
      let formattedRule = ''
      
      // Format 1: Business Scenario | Business Rule | Test Case | Expected Result
      if (columns.length >= 2) {
        const businessScenario = columns[0]?.trim()
        const businessRule = columns[1]?.trim()
        const testCase = columns[2]?.trim()
        const expectedResult = columns[3]?.trim()
        
        if (businessScenario && businessRule) {
          // Combine business scenario and rule for comprehensive description
          formattedRule = `${businessScenario}: ${businessRule}`
          
          // Add test case if available
          if (testCase && testCase !== businessRule) {
            formattedRule += ` (Test: ${testCase})`
          }
          
          // Add expected result if available
          if (expectedResult && expectedResult !== testCase) {
            formattedRule += ` → ${expectedResult}`
          }
        }
      }
      // Format 2: Field Name | Rule | Condition | Description (original format)
      else if (columns.length >= 2) {
        const field = columns[0]?.trim()
        const rule = columns[1]?.trim()
        const condition = columns[2]?.trim()
        const description = columns[3]?.trim()
        
        if (field && rule) {
          // Format based on rule type
          if (rule.toLowerCase().includes('range') || rule.toLowerCase().includes('between')) {
            formattedRule = `${field} ${rule}${condition ? ' ' + condition : ''}`
          } else if (rule.toLowerCase().includes('required') || rule.toLowerCase().includes('mandatory')) {
            formattedRule = `${field} is required${condition ? ' (' + condition + ')' : ''}`
          } else if (rule.toLowerCase().includes('format') || rule.toLowerCase().includes('pattern')) {
            formattedRule = `${field} must follow format: ${condition || rule}`
          } else if (rule.toLowerCase().includes('max') || rule.toLowerCase().includes('min') || rule.toLowerCase().includes('length')) {
            formattedRule = `${field} ${rule}${condition ? ' ' + condition : ''}`
          } else {
            // Generic rule format
            formattedRule = `${field} ${rule}${condition ? ' - ' + condition : ''}`
          }
          
          // Add description if available
          if (description && description !== rule && description !== condition) {
            formattedRule += ` (${description})`
          }
        }
      }
      
      if (formattedRule) {
        parsedRules.push(`• ${formattedRule}`)
      }
    })
    
    return parsedRules.join('\n')
  }

  // Handle paste event for Excel table data
  const handleBusinessRulesPaste = (e) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    
    // Debug: Log what we're getting
    console.log('Pasted text:', pastedText)
    console.log('Contains tabs:', pastedText.includes('\t'))
    console.log('Lines:', pastedText.split('\n').length)
    
    const parsedText = parseExcelTableData(pastedText)
    
    // Debug: Log what we're parsing
    console.log('Parsed text:', parsedText)
    
    // Insert the parsed text at the current cursor position
    const textarea = e.target
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentValue = businessRules
    const newValue = currentValue.substring(0, start) + parsedText + currentValue.substring(end)
    
    setBusinessRules(newValue)
    
    // Update cursor position
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + parsedText.length
    }, 0)
  }

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploading(true)
    setUploadResult(null)
    setParsedFields([])

    const formData = new FormData()
    formData.append('file', file)
    if (businessRules.trim()) {
      formData.append('business_rules', businessRules)
    }
    if (selectedEndpoint.trim()) {
      console.log('Appending selected_endpoint to form data:', selectedEndpoint)
      formData.append('selected_endpoint', selectedEndpoint)
    } else {
      console.warn('No endpoint selected - selectedEndpoint is empty')
    }

    try {
      console.log('Uploading file:', file.name)
      console.log('Selected endpoint:', selectedEndpoint)
      console.log('Business rules:', businessRules ? 'Provided' : 'None')
      
      const response = await fetch(`${API_BASE}/api/mappings/upload`, {
        method: 'POST',
        body: formData,
      })
      
      console.log('Upload response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        console.error('Upload error response:', errorData)
        throw new Error(errorData.detail || `Server error: ${response.status}`)
      }
      
      const data = await response.json()
      setUploadResult(data)
      
      const fieldsResponse = await fetch(`${API_BASE}/api/mappings/${data.mapping_id}/fields`)
      const fields = await fieldsResponse.json()
      setParsedFields(fields)
      
    } catch (error) {
      console.error('Error uploading file:', error)
      alert(`Error uploading file: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }, [businessRules, selectedEndpoint])

  const handleGenerateTests = async () => {
    if (!uploadResult) return

    setGeneratingTests(true)
    try {
      const response = await fetch(`${API_BASE}/api/mappings/${uploadResult.mapping_id}/generate-tests`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(errorData.detail || `Server error: ${response.status}`)
      }
      
      const data = await response.json()
      alert(`✓ ${data.scenarios_generated} test scenarios created!`)
      
    } catch (error) {
      console.error('Error generating tests:', error)
      alert(`Error generating tests: ${error.message}`)
    } finally {
      setGeneratingTests(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  })

  const getConfidenceColor = (confidence) => {
    const percent = confidence * 100
    if (percent >= 90) return 'bg-green-500'
    if (percent >= 75) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getConfidenceTextColor = (confidence) => {
    const percent = confidence * 100
    if (percent >= 90) return 'text-green-700'
    if (percent >= 75) return 'text-orange-700'
    return 'text-red-700'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">GS API Test Platform</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'upload'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Upload & Parse
              </button>
              <button
                onClick={() => setActiveTab('endpoints')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'endpoints'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                API Endpoints
              </button>
              <button
                onClick={() => setActiveTab('scenarios')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'scenarios'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Test Scenarios
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'dashboard'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'email'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Email Reports
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'upload' && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">Upload Excel Mapping</h2>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Business Rules (Optional)
                    <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      ✨ Excel Table Paste Supported
                    </span>
                  </label>
                  <textarea
                    value={businessRules}
                    onChange={(e) => setBusinessRules(e.target.value)}
                    onPaste={handleBusinessRulesPaste}
                    placeholder="Enter custom business rules for scenario generation...&#10;&#10;💡 You can paste Excel table data directly!&#10;&#10;Example formats:&#10;• Age must be between 18 and 65&#10;• Email domain must be @company.com&#10;• Transaction amount cannot exceed $10,000&#10;&#10;Or paste Excel table (your format):&#10;Business Scenario | Business Rule | Test Case | Expected Result&#10;User age validation | Age must be 18-65 | Submit age 17 | Should reject&#10;Email domain check | Must be @company.com | Use @gmail.com | Should reject&#10;Amount limit test | Cannot exceed $10000 | Submit $15000 | Should reject"
                    className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical font-mono text-sm"
                    disabled={uploading}
                  />
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">✨ Smart Paste:</span> Copy table data from Excel and paste directly - it will be automatically formatted!
                    </p>
                    <p className="text-sm text-gray-500">
                      These rules will be used by AI to generate more specific test scenarios tailored to your business logic.
                    </p>
                  </div>
                </div>

                {/* Endpoint Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Target Endpoint
                  </label>
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedEndpoint}
                      onChange={(e) => {
                        console.log('Dropdown changed to:', e.target.value)
                        setSelectedEndpoint(e.target.value)
                        console.log('selectedEndpoint state updated to:', e.target.value)
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={uploading || loadingEndpoints}
                    >
                      <option value="">Choose an endpoint...</option>
                      {endpoints.length > 0 ? (
                        endpoints.map((endpoint, index) => {
                          const fullUrl = endpoint.base_url + endpoint.path
                          return (
                            <option key={index} value={fullUrl}>
                              {endpoint.name || fullUrl} - {endpoint.method || 'GET'}
                            </option>
                          )
                        })
                      ) : (
                        <option value="" disabled>
                          No endpoints available - Add endpoints in the Endpoints tab
                        </option>
                      )}
                    </select>
                    {loadingEndpoints && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    )}
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">🎯 AI Integration:</span> The selected endpoint will be tested and its response will be considered during scenario generation.
                    </p>
                    {selectedEndpoint && (
                      <p className="text-sm text-blue-600 mt-1">
                        Selected: <code className="bg-blue-50 px-1 rounded">{selectedEndpoint}</code>
                      </p>
                    )}
                  </div>
                </div>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} disabled={uploading} />
            {uploading ? (
              <div>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-lg font-medium text-gray-700">Parsing with AI...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
              </div>
            ) : isDragActive ? (
              <p className="text-lg text-blue-600">Drop the Excel file here...</p>
            ) : (
              <div>
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="mt-4 text-lg text-gray-700">
                  Drag & drop an Excel file here, or click to select
                </p>
                <p className="mt-2 text-sm text-gray-500">.xlsx or .xls files only</p>
              </div>
            )}
          </div>

          {uploadResult && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-green-800">Upload Successful!</h3>
                <button
                  onClick={handleGenerateTests}
                  disabled={generatingTests}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {generatingTests ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    'Generate Tests'
                  )}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Mapping ID:</span>
                  <span className="ml-2 font-medium text-gray-900">{uploadResult.mapping_id}</span>
                </div>
                <div>
                  <span className="text-gray-600">Fields Parsed:</span>
                  <span className="ml-2 font-medium text-gray-900">{uploadResult.fields_parsed}</span>
                </div>
                <div>
                  <span className="text-gray-600">Avg Confidence:</span>
                  <span className={`ml-2 font-medium ${getConfidenceTextColor(uploadResult.avg_confidence / 100)}`}>
                    {uploadResult.avg_confidence}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {parsedFields.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Parsed Fields</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Field
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Required
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Confidence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Routing
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parsedFields.map((field) => (
                      <tr key={field.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{field.field_name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">{field.gs_rule}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                            {field.data_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {field.required ? (
                            <span className="text-red-600 font-medium">Yes</span>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                              <div
                                className={`h-2 rounded-full ${getConfidenceColor(field.confidence)}`}
                                style={{ width: `${(field.confidence || 0) * 100}%` }}
                              ></div>
                            </div>
                            <span className={`text-sm font-medium ${getConfidenceTextColor(field.confidence)}`}>
                              {field.confidence ? `${(field.confidence * 100).toFixed(0)}%` : '0%'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            field.confidence >= 0.9
                              ? 'bg-green-100 text-green-800'
                              : field.confidence >= 0.75
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {field.rule_type || 'text'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
              </div>
            )}

            {activeTab === 'endpoints' && (
              <EndpointsTab />
            )}

            {activeTab === 'scenarios' && (
              <EnhancedScenario1Tab mappingId={uploadResult?.mapping_id} />
            )}

            {activeTab === 'dashboard' && (
              <Dashboard />
            )}

            {activeTab === 'email' && (
              <EmailReportsTab />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
