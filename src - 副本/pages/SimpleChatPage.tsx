import React, { useState } from 'react';

const SimpleChatPage: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [messages, setMessages] = useState([
    { user: 'Copilot', text: '嗨，早上好！让我们开始对话' },
    // Add more messages as necessary
  ]);

  return (
    <div style={styles.container}>
      <div style={styles.history}>
        <div style={styles.historyItem}>嗨，早上好！让我们开始对话</div>
        {/* Render more history items here */}
      </div>

      <div style={styles.chatBox}>
        <input
          type="text"
          placeholder="与 Copilot 聊天"
          style={styles.inputBox}
        />
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
  } as React.CSSProperties,
  history: {
    width: '300px',
    backgroundColor: '#f5f5f5',
    padding: '10px',
    overflowY: 'auto' as 'auto',
  } as React.CSSProperties,
  historyItem: {
    padding: '8px',
    marginBottom: '10px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  chatBox: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
  } as React.CSSProperties,
  inputBox: {
    width: '100%',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    fontSize: '16px',
  } as React.CSSProperties,
};

export default SimpleChatPage; 