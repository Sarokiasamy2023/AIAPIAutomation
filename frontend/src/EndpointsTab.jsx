import { useState, useEffect } from 'react'
import API_BASE from './config'

function EndpointsTab() {
  const [environments, setEnvironments] = useState([])
  const [endpoints, setEndpoints] = useState([])
  const [activeEnv, setActiveEnv] = useState(null)
  const [showEnvForm, setShowEnvForm] = useState(false)
  const [showEndpointForm, setShowEndpointForm] = useState(false)
  const [editingEndpoint, setEditingEndpoint] = useState(null)

  const [envForm, setEnvForm] = useState({
    name: '',
    description: '',
    variables: ''
  })

  const [endpointForm, setEndpointForm] = useState({
    name: '',
    environment_id: '',
    base_url: '',
    method: 'GET',
    path: '/',
    auth_type: '',
    auth_token: '',
    headers: '',
    default_request_body: '',
    timeout_ms: 5000,
    expected_status: 200,
    max_response_time_ms: 2000
  })

  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    fetchEnvironments()
  }, [])

  useEffect(() => {
    if (activeEnv) {
      fetchEndpoints(activeEnv.id)
    }
  }, [activeEnv])

  const fetchEnvironments = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/environments`)
      const data = await response.json()
      setEnvironments(data)
      if (data.length > 0 && !activeEnv) {
        const active = data.find(e => e.is_active) || data[0]
        setActiveEnv(active)
      }
    } catch (error) {
      console.error('Error fetching environments:', error)
    }
  }

  const fetchEndpoints = async (envId) => {
    try {
      const response = await fetch(`${API_BASE}/api/endpoints?environment_id=${envId}`)
      const data = await response.json()
      setEndpoints(data)
    } catch (error) {
      console.error('Error fetching endpoints:', error)
    }
  }

  const createEnvironment = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_BASE}/api/environments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(envForm)
      })
      if (response.ok) {
        setShowEnvForm(false)
        setEnvForm({ name: '', description: '', variables: '' })
        fetchEnvironments()
      }
    } catch (error) {
      console.error('Error creating environment:', error)
    }
  }

  const activateEnvironment = async (envId) => {
    try {
      const response = await fetch(`${API_BASE}/api/environments/${envId}/activate`, {
        method: 'PUT'
      })
      if (response.ok) {
        fetchEnvironments()
      }
    } catch (error) {
      console.error('Error activating environment:', error)
    }
  }

  const createOrUpdateEndpoint = async (e) => {
    e.preventDefault()
    
    if (!activeEnv) {
      alert('Please select an environment first')
      return
    }
    
    try {
      const url = editingEndpoint 
        ? `${API_BASE}/api/endpoints/${editingEndpoint.id}`
        : `${API_BASE}/api/endpoints`
      
      const method = editingEndpoint ? 'PUT' : 'POST'
      
      const payload = {
        ...endpointForm,
        environment_id: activeEnv.id
      }
      
      console.log('Sending endpoint data:', payload)
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Server error:', errorText)
        alert(`Failed to save endpoint: ${response.status} - ${errorText}`)
        return
      }
      
      const data = await response.json()
      console.log('Endpoint created/updated:', data)
      
      setShowEndpointForm(false)
      setEditingEndpoint(null)
      setEndpointForm({
        name: '',
        environment_id: '',
        base_url: '',
        method: 'GET',
        path: '/',
        auth_type: '',
        auth_token: '',
        headers: '',
        default_request_body: '',
        timeout_ms: 5000,
        expected_status: 200,
        max_response_time_ms: 2000
      })
      fetchEndpoints(activeEnv.id)
      alert('Endpoint saved successfully!')
    } catch (error) {
      console.error('Error saving endpoint:', error)
      alert(`Error saving endpoint: ${error.message}`)
    }
  }

  const deleteEndpoint = async (endpointId) => {
    if (!confirm('Are you sure you want to delete this endpoint?')) return
    
    try {
      const response = await fetch(`${API_BASE}/api/endpoints/${endpointId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        fetchEndpoints(activeEnv.id)
      }
    } catch (error) {
      console.error('Error deleting endpoint:', error)
    }
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    
    try {
      // Call backend proxy to avoid CORS issues
      const response = await fetch(`${API_BASE}/api/endpoints/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(endpointForm)
      })
      
      const result = await response.json()
      setTestResult(result)
      
    } catch (error) {
      setTestResult({
        success: false,
        message: `❌ Connection failed: ${error.message}`,
        error: error.message
      })
    } finally {
      setTesting(false)
    }
  }

  const editEndpoint = (endpoint) => {
    setEditingEndpoint(endpoint)
    setTestResult(null)
    setEndpointForm({
      name: endpoint.name,
      environment_id: endpoint.environment_id,
      base_url: endpoint.base_url,
      method: endpoint.method,
      path: endpoint.path,
      auth_type: endpoint.auth_type || '',
      auth_token: endpoint.auth_token || '',
      headers: endpoint.headers || '',
      default_request_body: endpoint.default_request_body || '',
      timeout_ms: endpoint.timeout_ms,
      expected_status: endpoint.expected_status,
      max_response_time_ms: endpoint.max_response_time_ms
    })
    setShowEndpointForm(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">API Endpoints</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEnvForm(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            + New Environment
          </button>
          <button
            onClick={() => {
              setEditingEndpoint(null)
              setShowEndpointForm(true)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={!activeEnv}
          >
            + New Endpoint
          </button>
        </div>
      </div>

      {/* Environment Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto">
          {environments.map((env) => (
            <button
              key={env.id}
              onClick={() => setActiveEnv(env)}
              className={`px-4 py-2 font-medium whitespace-nowrap ${
                activeEnv?.id === env.id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {env.name}
              {env.is_active && <span className="ml-2 text-xs text-green-600">●</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Active Environment Info */}
      {activeEnv && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{activeEnv.name}</h3>
              <p className="text-sm text-gray-600">{activeEnv.description}</p>
            </div>
            {!activeEnv.is_active && (
              <button
                onClick={() => activateEnvironment(activeEnv.id)}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Activate
              </button>
            )}
          </div>
        </div>
      )}

      {/* Endpoints Table */}
      {endpoints.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No endpoints configured for this environment</p>
          <button
            onClick={() => setShowEndpointForm(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create First Endpoint
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auth</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SLA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {endpoints.map((endpoint) => (
                <tr key={endpoint.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {endpoint.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      endpoint.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                      endpoint.method === 'POST' ? 'bg-green-100 text-green-800' :
                      endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {endpoint.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {endpoint.base_url}{endpoint.path}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {endpoint.auth_type || 'None'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {endpoint.max_response_time_ms}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => editEndpoint(endpoint)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteEndpoint(endpoint.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Environment Form Modal */}
      {showEnvForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">New Environment</h3>
            <form onSubmit={createEnvironment}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={envForm.name}
                  onChange={(e) => setEnvForm({ ...envForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={envForm.description}
                  onChange={(e) => setEnvForm({ ...envForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEnvForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Endpoint Form Modal */}
      {showEndpointForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8">
            <h3 className="text-lg font-semibold mb-4">
              {editingEndpoint ? 'Edit Endpoint' : 'New Endpoint'}
            </h3>
            <form onSubmit={createOrUpdateEndpoint}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={endpointForm.name}
                    onChange={(e) => setEndpointForm({ ...endpointForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                  <select
                    value={endpointForm.method}
                    onChange={(e) => setEndpointForm({ ...endpointForm, method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                <input
                  type="text"
                  value={endpointForm.base_url}
                  onChange={(e) => setEndpointForm({ ...endpointForm, base_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://api.example.com"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Path</label>
                <input
                  type="text"
                  value={endpointForm.path}
                  onChange={(e) => setEndpointForm({ ...endpointForm, path: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="/api/v1/resource"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Auth Type</label>
                  <select
                    value={endpointForm.auth_type}
                    onChange={(e) => setEndpointForm({ ...endpointForm, auth_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">None</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="api_key">API Key</option>
                    <option value="basic">Basic Auth</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Auth Token</label>
                  <input
                    type="password"
                    value={endpointForm.auth_token}
                    onChange={(e) => setEndpointForm({ ...endpointForm, auth_token: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Status</label>
                  <input
                    type="number"
                    value={endpointForm.expected_status}
                    onChange={(e) => setEndpointForm({ ...endpointForm, expected_status: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Response Time (ms)</label>
                  <input
                    type="number"
                    value={endpointForm.max_response_time_ms}
                    onChange={(e) => setEndpointForm({ ...endpointForm, max_response_time_ms: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timeout (ms)</label>
                  <input
                    type="number"
                    value={endpointForm.timeout_ms}
                    onChange={(e) => setEndpointForm({ ...endpointForm, timeout_ms: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Headers (JSON)</label>
                <textarea
                  value={endpointForm.headers}
                  onChange={(e) => setEndpointForm({ ...endpointForm, headers: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                  placeholder='{"Content-Type": "application/json"}'
                />
              </div>

              {/* Request Body - Only for POST/PUT/PATCH */}
              {['POST', 'PUT', 'PATCH'].includes(endpointForm.method) && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Request Body (JSON)
                    <span className="text-xs text-gray-500 ml-2">Optional - Used for testing</span>
                  </label>
                  <textarea
                    value={endpointForm.default_request_body}
                    onChange={(e) => setEndpointForm({ ...endpointForm, default_request_body: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                    rows="6"
                    placeholder='{\n  "field1": "value1",\n  "field2": "value2"\n}'
                  />
                </div>
              )}

              {/* Test Connection Button */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={testConnection}
                  disabled={testing}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {testing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Testing Connection...
                    </>
                  ) : (
                    '🔌 Test Connection'
                  )}
                </button>
              </div>

              {/* Test Result Display */}
              {testResult && (
                <div className={`mb-4 p-4 rounded-md ${
                  testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="font-medium mb-2">{testResult.message}</div>
                  {testResult.status && (
                    <div className="text-sm space-y-1">
                      <div>Status Code: <span className="font-mono">{testResult.status}</span></div>
                      <div>Response Time: <span className="font-mono">{testResult.responseTime}ms</span>
                        {testResult.withinSLA !== undefined && (
                          <span className={`ml-2 ${testResult.withinSLA ? 'text-green-600' : 'text-red-600'}`}>
                            ({testResult.withinSLA ? '✓ Within SLA' : '✗ Exceeds SLA'})
                          </span>
                        )}
                      </div>
                      {testResult.responseBody && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">View Response</summary>
                          <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-40">
                            {typeof testResult.responseBody === 'string' 
                              ? testResult.responseBody 
                              : JSON.stringify(testResult.responseBody, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEndpointForm(false)
                    setEditingEndpoint(null)
                    setTestResult(null)
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingEndpoint ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default EndpointsTab
