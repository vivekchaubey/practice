import React, { useState, useEffect, useRef } from 'react';
import './StatusPanel.css';

const API_CONFIG = {
  BASE_URL: 'https://xba04ftzkk.execute-api.us-east-1.amazonaws.com/dev',
  ENDPOINTS: {
    STATUS: '/status'
  }
};

const StatusPanel = () => {
  const [statusMessage, setStatusMessage] = useState('');
  const [statusHistory, setStatusHistory] = useState([]);
  const [isPolling, setIsPolling] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState(API_CONFIG.BASE_URL);
  const [connectionStatus, setConnectionStatus] = useState('Ready');
  const pollIntervalRef = useRef(null);
  const historyIdCounter = useRef(0);
  const previousStatusRef = useRef('');

  const getStatusIcon = (status) => {
    if (status.includes('processing')) return '⏳';
    if (status.includes('done')) return '✅';
    if (status.includes('initial')) return 'ℹ️';
    return '📌';
  };

  const getStatusColor = (status) => {
    if (status.includes('processing')) return '#3b82f6';
    if (status.includes('done')) return '#10b981';
    if (status.includes('initial')) return '#6366f1';
    return '#6b7280';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const addToHistory = (status) => {
    const newEntry = {
      id: historyIdCounter.current++,
      status: status,
      timestamp: Date.now()
    };
    setStatusHistory(prev => [...prev, newEntry]);
  };

  const pollLambda = async () => {
    try {
      const url = `${apiEndpoint}${API_CONFIG.ENDPOINTS.STATUS}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        setConnectionStatus('Error');
        return;
      }

      const text = await response.text();
      const parsed = JSON.parse(text);
      const data = (parsed.statusCode && parsed.body) ? JSON.parse(parsed.body) : parsed;

      if (data.status) {
        const currentStatus = data.status;
        const previousStatus = previousStatusRef.current;

        if (currentStatus === previousStatus && currentStatus !== 'initial status') {
          // Same status as before - Lambda is processing
          const processingStatus = 'processing...';
          if (statusMessage !== processingStatus) {
            setStatusMessage(processingStatus);
            addToHistory(processingStatus);
            setConnectionStatus('Polling - Processing');
          }
        } else if (currentStatus !== statusMessage) {
          // Status changed
          setStatusMessage(currentStatus);
          addToHistory(currentStatus);
          previousStatusRef.current = currentStatus;
          setConnectionStatus('Polling - Status updated');
        } else {
          setConnectionStatus('Polling - No change');
        }
      }
    } catch (e) {
      setConnectionStatus('Error');
      console.error('Poll error:', e);
    }
  };

  const startPolling = () => {
    if (pollIntervalRef.current) return;
    setIsPolling(true);
    setConnectionStatus('Polling started');
    previousStatusRef.current = '';
    pollLambda();
    pollIntervalRef.current = setInterval(pollLambda, 2000);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
    setConnectionStatus('Stopped');
  };

  const clearHistory = () => {
    setStatusHistory([]);
    setStatusMessage('');
    historyIdCounter.current = 0;
    previousStatusRef.current = '';
  };

  useEffect(() => {
    const handleChatMessage = () => {
      if (!isPolling) startPolling();
    };

    window.addEventListener('chatMessageSent', handleChatMessage);
    return () => window.removeEventListener('chatMessageSent', handleChatMessage);
  }, [isPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, []);

  useEffect(() => {
    const container = document.querySelector('.timeline-container');
    if (container) container.scrollTop = container.scrollHeight;
  }, [statusHistory]);

  return (
    <div className="status-panel">
      <div className="status-header">
        <h2>AWS Lambda Status Monitor</h2>
        <div className="status-badge">
          <span className="status-indicator"></span>
          {connectionStatus}
        </div>
      </div>

      <div className="status-content">
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)' }}>
          <button onClick={isPolling ? stopPolling : startPolling} style={{ padding: '10px 20px', backgroundColor: isPolling ? '#ef4444' : '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
            {isPolling ? '⏸️ Stop Poll' : '▶️ Start Poll'}
          </button>
          <button onClick={clearHistory} disabled={isPolling} style={{ padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: isPolling ? 'not-allowed' : 'pointer', fontWeight: '500' }}>
            🗑️ Clear
          </button>
          <input type="text" value={apiEndpoint} onChange={(e) => setApiEndpoint(e.target.value)} placeholder="API Gateway Endpoint" style={{ flex: '1', minWidth: '200px', padding: '10px 15px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'monospace' }} />
        </div>

        <div className="status-summary">
          <div className="summary-item">
            <span className="summary-label">Current Status</span>
            <span className="summary-value" style={{ fontSize: '1.2rem', color: getStatusColor(statusMessage) }}>
              {statusMessage || 'Waiting...'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Updates</span>
            <span className="summary-value">{statusHistory.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Polling</span>
            <span className="summary-value" style={{ color: isPolling ? '#10b981' : '#6b7280' }}>
              {isPolling ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Connection</span>
            <span className="summary-value" style={{ fontSize: '0.9rem' }}>
              {connectionStatus.includes('Error') ? '❌' : '✅'}
            </span>
          </div>
        </div>

        <div className="status-timeline">
          <h3>Status History</h3>
          <div className="timeline-container">
            {statusHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📊</div>
                <p>Waiting for status updates...</p>
                <p style={{ fontSize: '0.85rem', marginTop: '10px' }}>Send a chat message to trigger Lambda</p>
              </div>
            ) : (
              statusHistory.map((entry) => (
                <div key={entry.id} className="status-item success" style={{ borderLeftColor: getStatusColor(entry.status) }}>
                  <div className="status-item-header">
                    <span className="status-icon">{getStatusIcon(entry.status)}</span>
                    <span className="status-message">Status: {entry.status}</span>
                    <span className="status-time">{formatTimestamp(entry.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="aws-integration-info">
          <h4>🔗 AWS Lambda Integration</h4>
          <div className="integration-details">
            <div className="integration-item"><strong>Endpoint:</strong> {apiEndpoint}/status</div>
            <div className="integration-item"><strong>Method:</strong> GET (every 5s)</div>
            <div className="integration-item"><strong>Current:</strong> {statusMessage || 'No status yet'}</div>
            <div className="integration-item"><strong>History:</strong> {statusHistory.length} updates</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;