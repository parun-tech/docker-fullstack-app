import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [jobDesc, setJobDesc] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/checks')
      if (res.ok) setHistory(await res.json())
    } catch (err) { console.error(err) }
  }

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleAnalyze = async (e) => {
    e.preventDefault()
    if (!file || !jobDesc) return

    setLoading(true)
    try {
      // Use FormData for file uploads
      const formData = new FormData()
      formData.append('resume', file)
      formData.append('jobDescription', jobDesc)
      formData.append('jobTitle', jobTitle)

      const res = await fetch('/api/analyze', {
        method: 'POST',
        // Note: No Content-Type header needed; browser adds it with boundary for FormData
        body: formData
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')

      setResult(data)
      fetchHistory()
    } catch (err) {
      console.error(err)
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#4ade80'
    if (score >= 50) return '#fbbf24'
    return '#f87171'
  }

  return (
    <div className="app-container">
      <div className="main-grid">
        <div className="glass-panel input-panel">
          <header>
            <h1>ATS Resume Scanner</h1>
            <p className="subtitle">Optimize your resume against job descriptions</p>
          </header>

          <form onSubmit={handleAnalyze}>
            <div className="form-group">
              <label>Job Title</label>
              <input
                type="text"
                placeholder="e.g. Frontend Developer"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Upload Resume (PDF)</label>
              <div className="file-upload-wrapper">
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileChange}
                  id="resume-upload"
                  className="file-input"
                />
                <label htmlFor="resume-upload" className="file-label">
                  {file ? `📄 ${file.name}` : '📁 Choose PDF File'}
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Paste Job Description</label>
              <textarea
                placeholder="Paste the job description here..."
                value={jobDesc}
                onChange={e => setJobDesc(e.target.value)}
              />
            </div>

            <button type="submit" className="analyze-btn" disabled={loading || !file || !jobDesc}>
              {loading ? 'Analyzing...' : 'Scan Resume'}
            </button>
          </form>
        </div>

        <div className="right-column">
          {result ? (
            <div className="glass-panel result-panel">
              <h2>Match Score</h2>
              <div className="score-circle" style={{ borderColor: getScoreColor(result.score) }}>
                <span className="score-text" style={{ color: getScoreColor(result.score) }}>
                  {result.score}%
                </span>
              </div>
              <p className="file-name-display">{result.fileName}</p>

              {result.missingKeywords.length > 0 && (
                <div className="keywords-section">
                  <h3>Missing Keywords</h3>
                  <div className="tags">
                    {result.missingKeywords.slice(0, 15).map((kw, i) => (
                      <span key={i} className="tag">{kw}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel placeholder-panel">
              <p>Upload a resume and job description to see results</p>
            </div>
          )}

          <div className="glass-panel history-panel">
            <h3>Recent Scans</h3>
            <ul className="history-list">
              {history.map(check => (
                <li key={check._id} className="history-item">
                  <div className="history-left">
                    <span className="job-title">{check.jobTitle || 'Untitled'}</span>
                    <span className="file-name-small">{check.fileName}</span>
                  </div>
                  <span className="history-score" style={{ color: getScoreColor(check.score) }}>
                    {check.score}%
                  </span>
                </li>
              ))}
              {history.length === 0 && <p className="empty-text">No scans yet</p>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
