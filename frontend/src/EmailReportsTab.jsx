import { useState, useEffect } from 'react'
import { Mail, Clock, Send, Plus, Trash2, Edit2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { API_BASE } from './config'

function EmailReportsTab() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [latestReport, setLatestReport] = useState(null)
  
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [scheduleForm, setScheduleForm] = useState({
    recipients: '',
    schedule_time: '09:00',
    report_type: 'Daily Test Report',
    is_active: true
  })
  
  const [sendNowForm, setSendNowForm] = useState({
    recipients: '',
    report_type: 'Manual Test Report',
    include_attachment: true
  })
  
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchSchedules()
    fetchLatestReport()
    testEmailConnection()
  }, [])

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/email/schedules`)
      if (response.ok) {
        const data = await response.json()
        setSchedules(data)
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLatestReport = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/email/latest-report`)
      if (response.ok) {
        const data = await response.json()
        setLatestReport(data)
      }
    } catch (error) {
      console.error('Error fetching latest report:', error)
    }
  }

  const testEmailConnection = async () => {
    setTestingConnection(true)
    try {
      const response = await fetch(`${API_BASE}/api/email/test-connection`, {
        method: 'POST'
      })
      const data = await response.json()
      setConnectionStatus(data)
    } catch (error) {
      setConnectionStatus({ status: 'error', message: 'Failed to test connection' })
    } finally {
      setTestingConnection(false)
    }
  }

  const sendReportNow = async () => {
    if (!sendNowForm.recipients.trim()) {
      showMessage('error', 'Please enter at least one recipient email')
      return
    }

    setSending(true)
    try {
      const recipients = sendNowForm.recipients.split(',').map(e => e.trim()).filter(e => e)
      const response = await fetch(`${API_BASE}/api/email/send-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          report_type: sendNowForm.report_type,
          include_attachment: sendNowForm.include_attachment
        })
      })

      const data = await response.json()
      if (response.ok) {
        showMessage('success', `Report sent successfully to ${recipients.length} recipient(s)`)
        setSendNowForm({ ...sendNowForm, recipients: '' })
      } else {
        showMessage('error', data.detail || 'Failed to send report')
      }
    } catch (error) {
      showMessage('error', 'Failed to send report: ' + error.message)
    } finally {
      setSending(false)
    }
  }

  const createOrUpdateSchedule = async () => {
    if (!scheduleForm.recipients.trim()) {
      showMessage('error', 'Please enter at least one recipient email')
      return
    }

    try {
      const recipients = scheduleForm.recipients.split(',').map(e => e.trim()).filter(e => e)
      const url = editingSchedule 
        ? `${API_BASE}/api/email/schedules/${editingSchedule.id}`
        : `${API_BASE}/api/email/schedules`
      
      const response = await fetch(url, {
        method: editingSchedule ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          schedule_time: scheduleForm.schedule_time,
          report_type: scheduleForm.report_type,
          is_active: scheduleForm.is_active
        })
      })

      if (response.ok) {
        showMessage('success', editingSchedule ? 'Schedule updated successfully' : 'Schedule created successfully')
        setShowScheduleModal(false)
        setEditingSchedule(null)
        setScheduleForm({
          recipients: '',
          schedule_time: '09:00',
          report_type: 'Daily Test Report',
          is_active: true
        })
        fetchSchedules()
      } else {
        const data = await response.json()
        showMessage('error', data.detail || 'Failed to save schedule')
      }
    } catch (error) {
      showMessage('error', 'Failed to save schedule: ' + error.message)
    }
  }

  const deleteSchedule = async (id) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return

    try {
      const response = await fetch(`${API_BASE}/api/email/schedules/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showMessage('success', 'Schedule deleted successfully')
        fetchSchedules()
      } else {
        showMessage('error', 'Failed to delete schedule')
      }
    } catch (error) {
      showMessage('error', 'Failed to delete schedule: ' + error.message)
    }
  }

  const editSchedule = (schedule) => {
    setEditingSchedule(schedule)
    setScheduleForm({
      recipients: schedule.recipients.join(', '),
      schedule_time: schedule.schedule_time,
      report_type: schedule.report_type,
      is_active: schedule.is_active
    })
    setShowScheduleModal(true)
  }

  const toggleScheduleActive = async (schedule) => {
    try {
      const response = await fetch(`${API_BASE}/api/email/schedules/${schedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: !schedule.is_active
        })
      })

      if (response.ok) {
        showMessage('success', `Schedule ${!schedule.is_active ? 'activated' : 'deactivated'}`)
        fetchSchedules()
      }
    } catch (error) {
      showMessage('error', 'Failed to update schedule')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Mail className="w-8 h-8 text-blue-600" />
          Email Reports
        </h1>
        <p className="text-gray-600 mt-2">Configure automated email reports and send reports manually</p>
      </div>

      {message.text && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-100 text-green-800' :
          message.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {message.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {message.type === 'error' && <XCircle className="w-5 h-5" />}
          {message.type === 'info' && <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            Send Report Now
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipients (comma-separated emails)
              </label>
              <input
                type="text"
                value={sendNowForm.recipients}
                onChange={(e) => setSendNowForm({ ...sendNowForm, recipients: e.target.value })}
                placeholder="email1@example.com, email2@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <input
                type="text"
                value={sendNowForm.report_type}
                onChange={(e) => setSendNowForm({ ...sendNowForm, report_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="include_attachment"
                checked={sendNowForm.include_attachment}
                onChange={(e) => setSendNowForm({ ...sendNowForm, include_attachment: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="include_attachment" className="text-sm text-gray-700">
                Include Excel report attachment
              </label>
            </div>

            {latestReport && (
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <p className="font-medium text-gray-700">Latest Report:</p>
                <p className="text-gray-600">{latestReport.filename}</p>
                <p className="text-gray-500 text-xs">
                  Modified: {new Date(latestReport.modified_at).toLocaleString()}
                </p>
              </div>
            )}

            <button
              onClick={sendReportNow}
              disabled={sending}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Report Now
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Email Configuration Status</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">Connection Status</span>
              {testingConnection ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              ) : connectionStatus ? (
                <span className={`flex items-center gap-2 ${
                  connectionStatus.status === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {connectionStatus.status === 'success' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  {connectionStatus.status === 'success' ? 'Connected' : 'Not Connected'}
                </span>
              ) : (
                <span className="text-gray-500">Unknown</span>
              )}
            </div>

            {connectionStatus && connectionStatus.status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium mb-2">Configuration Issue:</p>
                <p className="text-sm text-red-700">{connectionStatus.message}</p>
                <p className="text-xs text-red-600 mt-2">
                  Please update your email credentials in the backend/.env file
                </p>
              </div>
            )}

            {connectionStatus && connectionStatus.status === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-medium">✓ Email service is configured correctly</p>
                <p className="text-xs text-green-700 mt-1">Ready to send reports</p>
              </div>
            )}

            <button
              onClick={testEmailConnection}
              disabled={testingConnection}
              className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
            >
              {testingConnection ? 'Testing...' : 'Test Connection Again'}
            </button>

            <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p className="font-medium mb-1">📝 Configuration Guide:</p>
              <p>1. Open backend/.env file</p>
              <p>2. Set SMTP_USERNAME and SMTP_PASSWORD</p>
              <p>3. For Gmail, use an App Password</p>
              <p>4. Restart the backend server</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Scheduled Reports
          </h2>
          <button
            onClick={() => {
              setEditingSchedule(null)
              setScheduleForm({
                recipients: '',
                schedule_time: '09:00',
                report_type: 'Daily Test Report',
                is_active: true
              })
              setShowScheduleModal(true)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Schedule
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No scheduled reports configured</p>
            <p className="text-sm mt-1">Click "Add Schedule" to create your first automated report</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`border rounded-lg p-4 ${
                  schedule.is_active ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        schedule.is_active ? 'bg-green-200 text-green-800' : 'bg-gray-300 text-gray-700'
                      }`}>
                        {schedule.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-lg font-semibold text-gray-800">
                        {schedule.schedule_time}
                      </span>
                      <span className="text-sm text-gray-600">
                        {schedule.report_type}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Recipients:</span> {schedule.recipients.join(', ')}
                    </div>
                    {schedule.last_sent_at && (
                      <div className="text-xs text-gray-500 mt-1">
                        Last sent: {new Date(schedule.last_sent_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleScheduleActive(schedule)}
                      className={`p-2 rounded-lg ${
                        schedule.is_active ? 'bg-yellow-100 hover:bg-yellow-200' : 'bg-green-100 hover:bg-green-200'
                      }`}
                      title={schedule.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {schedule.is_active ? (
                        <XCircle className="w-5 h-5 text-yellow-700" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-700" />
                      )}
                    </button>
                    <button
                      onClick={() => editSchedule(schedule)}
                      className="p-2 bg-blue-100 rounded-lg hover:bg-blue-200"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5 text-blue-700" />
                    </button>
                    <button
                      onClick={() => deleteSchedule(schedule.id)}
                      className="p-2 bg-red-100 rounded-lg hover:bg-red-200"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5 text-red-700" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">
              {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipients (comma-separated)
                </label>
                <input
                  type="text"
                  value={scheduleForm.recipients}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, recipients: e.target.value })}
                  placeholder="email1@example.com, email2@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Time (24-hour format)
                </label>
                <input
                  type="time"
                  value={scheduleForm.schedule_time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, schedule_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <input
                  type="text"
                  value={scheduleForm.report_type}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, report_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="schedule_active"
                  checked={scheduleForm.is_active}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="schedule_active" className="text-sm text-gray-700">
                  Active (schedule will run automatically)
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowScheduleModal(false)
                  setEditingSchedule(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createOrUpdateSchedule}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingSchedule ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmailReportsTab
