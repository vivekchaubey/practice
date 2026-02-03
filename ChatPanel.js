import React, { useState, useRef, useEffect } from 'react';
import './ChatPanel.css';

const API_CONFIG = {
  BASE_URL: 'https://svv182tlpk.execute-api.us-east-1.amazonaws.com/dev',
  ENDPOINTS: {
    CHAT: '/chat'
  }
};

const ChatPanel = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connected');
  const messagesEndRef = useRef(null);
  const messageIdCounter = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (text, sender = 'user', metadata = {}) => {
    const newMessage = {
      id: messageIdCounter.current++,
      text,
      sender,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      ...metadata
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const notifyStatusPanel = () => {
    window.dispatchEvent(new CustomEvent('chatMessageSent'));
  };

  const sendToLambda = async (userMessage) => {
    setIsProcessing(true);
    setConnectionStatus('Processing...');

    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHAT}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, timestamp: Date.now() })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let data = await response.json();
      console.log('Chat response:', data);

      let botMessage = '';
      let processingTime = null;

      if (data.statusCode && data.body) {
        if (typeof data.body === 'string') {
          try {
            const parsedBody = JSON.parse(data.body);
            botMessage = parsedBody.response || parsedBody.message || parsedBody.body || data.body;
            processingTime = parsedBody.processing_time;
          } catch (e) {
            botMessage = data.body;
          }
        } else {
          botMessage = data.body.response || data.body.message || data.body.body || JSON.stringify(data.body);
          processingTime = data.body.processing_time;
        }
      } else {
        botMessage = data.response || data.message || data.body || JSON.stringify(data);
        processingTime = data.processing_time;
      }

      if (botMessage) {
        addMessage(botMessage, 'bot', { processingTime: processingTime, status: data.status || 'success' });
      } else {
        throw new Error('No message in Lambda response');
      }

      setConnectionStatus('Connected');

    } catch (error) {
      console.error('Lambda error:', error);
      addMessage(`Error: ${error.message}`, 'bot', { error: true });
      setConnectionStatus('Error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!inputValue.trim() || isProcessing) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    addMessage(userMessage, 'user');

    notifyStatusPanel();

    await sendToLambda(userMessage);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div>
          <h2>Chat with Lambda</h2>
          <span className="chat-subtitle">Messages processed via /chat endpoint</span>
        </div>
        <div className="connection-status">
          <span className={`status-indicator ${connectionStatus === 'Connected' ? 'connected' : 'processing'}`}></span>
          <span className="status-text">{connectionStatus}</span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <p>Start a conversation!</p>
            <p className="empty-hint">Your messages trigger Lambda via /chat and status updates via /status</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'} ${message.error ? 'error-message' : ''}`}>
              <div className="message-content">
                <p className="message-text">{message.text}</p>
                <div className="message-footer">
                  <span className="message-time">{message.time}</span>
                  {message.processingTime && <span className="processing-time">⚡ {message.processingTime}s</span>}
                </div>
              </div>
            </div>
          ))
        )}
        {isProcessing && (
          <div className="message bot-message typing-indicator">
            <div className="message-content">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={handleKeyPress} placeholder={isProcessing ? "Processing..." : "Type a message..."} className="chat-input" disabled={isProcessing} />
        <button type="submit" className="send-button" disabled={isProcessing || !inputValue.trim()}>
          {isProcessing ? '⏳' : '📤'} Send
        </button>
      </form>

      <div className="chat-footer">
        <small>Endpoint: {API_CONFIG.BASE_URL}/chat • Auto-triggers status polling</small>
      </div>
    </div>
  );
};

export default ChatPanel;