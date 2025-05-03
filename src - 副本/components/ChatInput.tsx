import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Input, Button } from 'antd';
import { SendOutlined, LoadingOutlined, EditOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface ChatInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isStreaming }) => {
  const [message, setMessage] = useState('');
  const textAreaRef = useRef<any>(null);

  // 当组件挂载时自动聚焦
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, []);

  const handleSend = () => {
    if (message.trim() && !isStreaming) {
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 如果按下 Enter（而不是 Shift+Enter）时发送消息
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <ChatInputContainer>
      <InputWrapper>
        <StyledTextArea
          ref={textAreaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="与 Copilot 聊天"
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={isStreaming}
          bordered={false}
        />
        <ButtonGroup>
          <ActionButton>
            <EditOutlined />
          </ActionButton>
          <ActionButton>
            <i className="fa fa-microphone"></i>
          </ActionButton>
        </ButtonGroup>
      </InputWrapper>
    </ChatInputContainer>
  );
};

const ChatInputContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 16px 20px;
  background-color: white;
  position: fixed;
  bottom: 0;
  left: 70px;
  right: 0;
  z-index: 10;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 600px;
  border: 1px solid #e0e0e0;
  border-radius: 24px;
  padding: 8px 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  background-color: white;
`;

const StyledTextArea = styled(TextArea)`
  resize: none;
  border: none;
  padding: 8px 0;
  font-size: 16px;
  flex: 1;
  line-height: 24px;
  
  &:focus {
    box-shadow: none;
  }
  
  &.ant-input-disabled {
    background-color: white;
    color: #bbb;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  font-size: 18px;
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

export default ChatInput; 