import React, { useState } from 'react';
import ChatPanel from './components/ChatPanel';
import StatusPanel from './components/StatusPanel';
import { processChatMessage } from './utils/awsLambda';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! Welcome to the chat.", sender: "bot", time: "10:00 AM" },
    { id: 2, text: "Hi there!", sender: "user", time: "10:01 AM" },
    { id: 3, text: "How can I help you today?", sender: "bot", time: "10:01 AM" }
  ]);

  const [statusUpdates, setStatusUpdates] = useState([
    { 
      id: 1, 
      type: "info", 
      message: "System initialized", 
      timestamp: new Date().toISOString(),
      details: "Application started successfully"
    },
    { 
      id: 2, 
      type: "success", 
      message: "Connected to AWS", 
      timestamp: new Date().toISOString(),
      details: "Backend ready to process requests"
    }
  ]);

  // Function to add status updates
  const addStatusUpdate = (type, message, details) => {
    const newStatus = {
      id: statusUpdates.length + 1,
      type,
      message,
      timestamp: new Date().toISOString(),
      details
    };
    setStatusUpdates(prev => [...prev, newStatus]);
  };

  // Handle sending message
  const handleSendMessage = async (newMessage) => {
    const message = {
      id: messages.length + 1,
      text: newMessage,
      sender: "user",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, message]);

    try {
      const result = await processChatMessage(newMessage, addStatusUpdate);
      
      // Add status updates from Lambda
      if (result.updates) {
        result.updates.forEach(update => {
          addStatusUpdate(update.type, update.message, update.details);
        });
      }
      
      // Add bot response
      const botMessage = {
        id: messages.length + 2,
        text: result.response || "Done",
        sender: "bot",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      addStatusUpdate('error', 'Error', error.message);
    }
  };

  return (
    <div className="App">
      <div className="split-container">
        <ChatPanel messages={messages} onSendMessage={handleSendMessage} />
        <StatusPanel statusUpdates={statusUpdates} />
      </div>
    </div>
  );
}

export default App;
