import React, { useState } from 'react';
import { InfoMessage } from '../types';
import { store } from '../store';

interface MessageCenterProps {
  messages: InfoMessage[];
  onClearMessages: () => void;
}

export const MessageCenter: React.FC<MessageCenterProps> = ({ messages, onClearMessages }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getMessageIcon = (type: InfoMessage['type']) => {
    switch (type) {
      case 'success': return '✓';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  if (messages.length === 0) {
    return (
      <div className="message-center empty">
        <p>No recent activity. Start by adding customers, materials, and products!</p>
      </div>
    );
  }

  return (
    <div className="message-center">
      <div className="message-header">
        <h3>
          System Messages ({messages.length})
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="toggle-btn"
          >
            {isExpanded ? '▼' : '▲'}
          </button>
        </h3>
        {messages.length > 0 && (
          <button onClick={onClearMessages} className="clear-btn">
            Clear All
          </button>
        )}
      </div>
      
      {isExpanded && (
        <div className="message-list">
          {messages.slice(0, 10).map((message, index) => (
            <div key={index} className={`message ${message.type}`}>
              <span className="message-icon">{getMessageIcon(message.type)}</span>
              <span className="message-text">{message.message}</span>
            </div>
          ))}
          {messages.length > 10 && (
            <p className="message-overflow">... and {messages.length - 10} more messages</p>
          )}
        </div>
      )}
      
      {!isExpanded && messages.length > 0 && (
        <div className="latest-message">
          <div className={`message ${messages[0].type}`}>
            <span className="message-icon">{getMessageIcon(messages[0].type)}</span>
            <span className="message-text">{messages[0].message}</span>
          </div>
        </div>
      )}
    </div>
  );
};