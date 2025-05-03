import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Dropdown, Menu, Tooltip } from 'antd';
import styled from 'styled-components';
import { DownOutlined, EditOutlined, PictureOutlined, SendOutlined, SoundOutlined } from '@ant-design/icons';

const CopilotChat: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    { user: 'Copilot', text: '嗨，早上好！' },
    { user: 'Copilot', text: '让我们开始对话' },
  ]);

  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (inputText.trim()) {
      setMessages([...messages, { user: 'User', text: inputText }]);
      setInputText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Container>
      {/* 左侧边栏 */}
      <Sidebar>
        <SidebarTop>
          <LogoContainer>
            <Logo src="/copilot-logo.png" alt="Copilot" />
            <span>Copilot</span>
          </LogoContainer>
          <EditButton>
            <EditOutlined />
          </EditButton>
        </SidebarTop>
        <SidebarBottom>
          <NotebookItem>
            <NotebookIcon>📓</NotebookIcon>
            <span>Notebook</span>
          </NotebookItem>
        </SidebarBottom>
      </Sidebar>

      {/* 主内容区 */}
      <MainContent>
        {/* 顶部导航栏 */}
        <NavBar>
          <ConversationMode>
            对话模式: 
            <Dropdown overlay={
              <Menu>
                <Menu.Item key="1">Balanced</Menu.Item>
                <Menu.Item key="2">Creative</Menu.Item>
                <Menu.Item key="3">Precise</Menu.Item>
              </Menu>
            } trigger={['click']}>
              <ModeButton>
                Balanced <DownOutlined />
              </ModeButton>
            </Dropdown>
          </ConversationMode>
          <LoginButton>登录</LoginButton>
        </NavBar>

        {/* 聊天内容区 */}
        <ChatArea>
          {messages.length === 0 ? (
            <EmptyState>
              <CopilotLogo src="/copilot-logo.png" alt="Copilot Logo" />
              <WelcomeTitle>嗨，早上好！</WelcomeTitle>
              <WelcomeText>让我们开始对话</WelcomeText>
            </EmptyState>
          ) : (
            <MessagesList>
              {messages.map((message, index) => (
                <MessageItem key={index} isUser={message.user !== 'Copilot'}>
                  {message.text}
                </MessageItem>
              ))}
              <div ref={messageEndRef} />
            </MessagesList>
          )}
        </ChatArea>

        {/* 输入区域 */}
        <InputContainer>
          <StyledInput 
            placeholder="与 Copilot 聊天"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            autoSize={{ minRows: 1, maxRows: 4 }}
          />
          <InputButtons>
            <InputButton>
              <Tooltip title="上传图片">
                <PictureOutlined />
              </Tooltip>
            </InputButton>
            <InputButton>
              <Tooltip title="语音输入">
                <SoundOutlined />
              </Tooltip>
            </InputButton>
            <SendButton 
              type="primary" 
              icon={<SendOutlined />} 
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
            />
          </InputButtons>
        </InputContainer>

        {/* 底部信息 */}
        <Footer>
          <FooterText>
            Copilot 使用 AI。检查结果。
            <FooterLink>条款</FooterLink>
            <FooterLink>隐私</FooterLink>
            <FooterLink>常见问题解答</FooterLink>
          </FooterText>
        </Footer>
      </MainContent>
    </Container>
  );
};

// 样式定义
const Container = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  background-color: #ffffff;
`;

const Sidebar = styled.div`
  width: 270px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid #f0f0f0;
  padding: 16px 0;
  background-color: #fff;
`;

const SidebarTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  margin-bottom: 24px;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
`;

const Logo = styled.img`
  width: 24px;
  height: 24px;
  margin-right: 8px;
`;

const EditButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  padding: 8px;
  border-radius: 4px;

  &:hover {
    background-color: #f5f5f5;
  }
`;

const SidebarBottom = styled.div`
  padding: 0 16px;
`;

const NotebookItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #f5f5f5;
  }
`;

const NotebookIcon = styled.span`
  margin-right: 10px;
  font-size: 16px;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff;
`;

const NavBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
`;

const ConversationMode = styled.div`
  display: flex;
  align-items: center;
  font-size: 14px;
`;

const ModeButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  margin-left: 8px;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    text-decoration: underline;
  }
`;

const LoginButton = styled(Button)`
  font-weight: 500;
`;

const ChatArea = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
`;

const CopilotLogo = styled.img`
  width: 64px;
  height: 64px;
  margin-bottom: 24px;
`;

const WelcomeTitle = styled.h1`
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
`;

const WelcomeText = styled.p`
  font-size: 16px;
  color: #666;
  margin-bottom: 24px;
`;

const MessagesList = styled.div`
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
`;

const MessageItem = styled.div<{ isUser: boolean }>`
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  background-color: ${props => props.isUser ? '#e6f7ff' : '#f5f5f5'};
  color: #333;
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  border: 1px solid ${props => props.isUser ? '#91d5ff' : '#e8e8e8'};
`;

const InputContainer = styled.div`
  padding: 16px 24px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
`;

const StyledInput = styled(Input.TextArea)`
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #d9d9d9;
  font-size: 16px;
  resize: none;

  &:hover, &:focus {
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  }
`;

const InputButtons = styled.div`
  position: absolute;
  bottom: 28px;
  right: 34px;
  display: flex;
  align-items: center;
`;

const InputButton = styled.button`
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  margin-right: 12px;
  cursor: pointer;
  padding: 4px;

  &:hover {
    color: #1890ff;
  }
`;

const SendButton = styled(Button)`
  border-radius: 4px;
`;

const Footer = styled.div`
  text-align: center;
  padding: 12px;
  color: #999;
  font-size: 12px;
  border-top: 1px solid #f0f0f0;
`;

const FooterText = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
`;

const FooterLink = styled.a`
  color: #1890ff;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export default CopilotChat; 