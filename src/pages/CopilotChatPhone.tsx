import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Input, Tooltip, message, Drawer, List, Avatar, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { MenuOutlined, PlusOutlined, PictureOutlined, SendOutlined, SettingOutlined, DeleteOutlined, DownOutlined, UpOutlined, BulbOutlined, BulbFilled } from '@ant-design/icons';
import { useChat } from '../contexts/ChatContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import logoImage from '../logo.png';
import { Collapse } from 'react-collapse';
import { CodeBlock } from '../components/CodeBlockComponents';

// 为window对象添加debounceTimer属性的声明
declare global {
  interface Window {
    debounceTimer?: NodeJS.Timeout;
  }
}

// 添加错误边界组件
class CodeBlockErrorBoundary extends React.Component<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}, {
  hasError: boolean;
  error: Error | null;
}> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // 更新状态，下次渲染时显示降级UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 可以在此处记录错误信息
    console.error('代码块组件错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // 提供降级UI
      return this.props.fallback || (
        <div style={{ 
          padding: '10px', 
          border: '1px solid #ff4d4f', 
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 77, 79, 0.05)',
          color: '#ff4d4f'
        }}>
          <p>代码块渲染错误，请尝试刷新页面</p>
          <small>{this.state.error?.message}</small>
        </div>
      );
    }

    return this.props.children;
  }
}

// 样式定义
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background-color: ${props => props.theme.colors.background};
  overflow: hidden;
`;

const NavBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.navbarBackground};
  backdrop-filter: blur(5px);
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
`;

const MenuButton = styled(Button)`
  font-size: 18px;
  border: none;
  background: none;
  padding: 8px;
  color: ${props => props.theme.colors.text};
`;

const SettingsIconButton = styled(Button)`
  font-size: 18px;
  border: none;
  background: none;
  padding: 8px;
  color: ${props => props.theme.colors.text};
`;

const slideUp = keyframes`
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const slideCenterToBottom = keyframes`
  from {
    transform: translateY(0);
    position: relative;
    width: 90%;
  }
  to {
    transform: translateY(calc(100vh - 220px));
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    margin: 0 auto;
    width: 90%;
    z-index: 1000;
  }
`;

const MainContent = styled.div<{ hasMessages: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(100% - 60px - 60px);
  overflow-y: auto;
  background-color: ${props => props.theme.colors.background};
  background-image: ${props => !props.hasMessages ? 
    props.theme.isDarkMode
      ? 'radial-gradient(circle at center, rgba(30, 60, 90, 0.2) 0%, rgba(15, 15, 15, 0) 60vw)'
      : 'radial-gradient(circle at center,rgba(73, 217, 253, 0.27), transparent 60vw)'
    : 'none'};
  background-position: center 20%;
  background-repeat: no-repeat;
`;

const ChatArea = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const MessagesList = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const MessageItem = styled.div<{ isUser: boolean; isError?: boolean }>`
  margin-bottom: 16px;
  padding: 10px 14px;
  border-radius: 18px;
  max-width: 80%;
  width: auto;
  display: inline-block;
  word-wrap: break-word;
  background-color: ${props => {
    if (props.isError) return props.theme.colors.messageBackground.error;
    return props.isUser ? props.theme.colors.messageBackground.user : props.theme.colors.messageBackground.assistant;
  }};
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  margin-left: ${props => props.isUser ? 'auto' : '10%'};
  margin-right: ${props => props.isUser ? '10%' : 'auto'};
  box-shadow: 0 1px 2px ${props => props.theme.isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)'};
  border: 1px solid ${props => {
    if (props.isError) return props.theme.colors.messageBorder.error;
    return props.isUser ? props.theme.colors.messageBorder.user : props.theme.colors.messageBorder.assistant;
  }};
  position: relative;

  /* Markdown 样式调整 */
  p {
    margin-bottom: 8px;
    line-height: 1.6;
    color: ${props => props.theme.colors.text};
  }
  
  pre {
    margin: 10px 0;
    padding: 10px;
    border-radius: 6px;
    background-color: ${props => props.theme.colors.codeBackground};
    overflow-x: auto;
  }

  code {
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.9em;
    background-color: ${props => {
      if (props.isError) return props.theme.isDarkMode ? 'rgba(255, 77, 79, 0.2)' : 'rgba(255, 77, 79, 0.1)';
      return props.isUser 
        ? props.theme.isDarkMode ? 'rgba(24, 144, 255, 0.2)' : 'rgba(24, 144, 255, 0.1)' 
        : props.theme.isDarkMode ? '#333' : 'rgba(0,0,0,0.05)';
    }};
    padding: 2px 4px;
    border-radius: 3px;
    color: ${props => props.theme.colors.text};
  }

  pre code {
    background-color: transparent;
    padding: 0;
    border-radius: 0;
  }

  ul, ol {
    margin: 8px 0;
    padding-left: 24px;
  }

  li {
    margin-bottom: 4px;
    color: ${props => props.theme.colors.text};
  }
`;

const MarkdownTable = styled.table`
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 0.9em;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 0 1px ${props => props.theme.isDarkMode ? '#444' : '#eee'};
`;

const TableHeader = styled.th`
  background-color: ${props => props.theme.isDarkMode ? 'rgba(24, 144, 255, 0.2)' : 'rgba(24, 144, 255, 0.1)'};
  color: ${props => props.theme.colors.text};
  font-weight: bold;
  padding: 8px 12px;
    text-align: left;
  border: 1px solid ${props => props.theme.isDarkMode ? '#444' : '#eee'};
`;

const TableCell = styled.td`
  padding: 8px 12px;
  border: 1px solid ${props => props.theme.isDarkMode ? '#444' : '#eee'};
  text-align: left;
  color: ${props => props.theme.colors.text};
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-top: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.inputBackground};
  position: sticky;
  bottom: 0;
  width: 100%;
`;

const StyledInput = styled(Input.TextArea)`
  flex: 1;
  margin-right: 10px;
  border-radius: 18px;
  padding: 10px 16px;
  resize: none;
  font-size: 16px;
  border: 1px solid ${props => props.theme.isDarkMode ? '#444' : '#d9d9d9'};
  background-color: ${props => props.theme.isDarkMode ? '#2c2c2c' : '#ffffff'};
  color: ${props => props.theme.colors.text};

  &:hover, &:focus {
    border-color: ${props => props.theme.primaryColor};
    box-shadow: 0 0 0 2px ${props => props.theme.isDarkMode 
      ? `rgba(${parseInt(props.theme.primaryColor.slice(1, 3), 16)}, ${parseInt(props.theme.primaryColor.slice(3, 5), 16)}, ${parseInt(props.theme.primaryColor.slice(5, 7), 16)}, 0.2)`
      : `rgba(24, 144, 255, 0.1)`};
  }
`;

const InputButtons = styled.div`
  display: flex;
  align-items: center;
`;

const InputButton = styled(Button)`
  border: none;
  background: none;
  font-size: 18px;
  padding: 8px;
  margin-left: 5px;
  height: 40px;
  width: 40px;
  color: ${props => props.theme.colors.secondaryText};
`;

const SendButton = styled(Button)`
  border-radius: 50%;
  width: 40px;
  // height: 40px;
  max-height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  font-size: 18px;
`;

const InitialInputContainer = styled.div<{ isMovingToBottom?: boolean }>`
  width: 90%;
  position: relative;
  margin-top: 20px;
  animation: ${props => props.isMovingToBottom ? slideCenterToBottom : slideUp} 0.5s ease-out forwards;
  transition: width 0.5s ease-out;
`;

const InitialInputButtons = styled.div`
  position: absolute;
  bottom: 7px;
  right: 14px;
  display: flex;
  align-items: center;
  max-height: 35px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 20px;
`;

const LogoImg = styled.img`
  height: 60px;
  margin-bottom: 16px;
  
  &.large-logo {
    height: 80px;
    margin-bottom: 24px;
  }
`;

const WelcomeText = styled.h2`
  font-size: 1.2em;
  color: ${props => props.theme.colors.text};
  margin-bottom: 20px;
`;

// 抽屉样式
const DrawerContent = styled.div`
  padding: 16px 0;
  background-color: ${props => props.theme.isDarkMode ? '#1a1a1a' : props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  height: 100%;
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 16px 16px;
  border-bottom: 1px solid ${props => props.theme.isDarkMode ? '#333' : props.theme.colors.border};
`;

const DrawerTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const NewChatButtonDrawer = styled(Button)`
  display: flex;
  align-items: center;
  font-size: 14px;
`;

const HistoryList = styled(List)`
  .ant-list-item {
    padding: 12px 16px;
    cursor: pointer;
    border-left: 3px solid transparent;
    transition: background-color 0.2s ease, border-left-color 0.2s ease;

    &:hover {
      background-color: ${props => props.theme.isDarkMode ? '#2c2c2c' : '#f7f7f7'};
    }

    &.active {
      background-color: ${props => props.theme.isDarkMode ? '#15395b' : '#e6f7ff'};
      border-left-color: ${props => props.theme.primaryColor || '#1890ff'};
    }
  }

  .ant-list-item-meta-title {
    font-weight: 500;
    color: ${props => props.theme.colors.text};
  }
  
  .ant-list-item-meta-description {
    color: ${props => props.theme.isDarkMode ? '#aaa' : '#999'};
  }
`;

const CodeBlockWrapper = styled.div`
  position: relative;
  margin: 10px 0;
  border-radius: 6px;
  overflow: hidden;
`;

const LanguageLabel = styled.span`
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
  color: #666;
  z-index: 10;
  text-transform: uppercase;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.95);
    color: #1890ff;
    border-color: #1890ff;
  }
`;

const CollapseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 8px;
  background: #f0f0f0;
  border: none;
  border-top: 1px solid #e0e0e0;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #e0e0e0;
  }

  svg {
    margin-right: 8px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: #f9f9f9;
  border-top: 1px solid #eee;
`;

// 添加消息容器和时间戳样式
const MessageContainer = styled.div<{ isUser: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 8px;
  width: 100%;
`;

const Timestamp = styled.div<{ isUser: boolean }>`
  font-size: 12px;
  color: ${props => props.theme.colors.secondaryText};
  margin-top: 8px;
  text-align: ${props => props.isUser ? 'right' : 'left'};
  padding-bottom: 2px;
`;

const ThemeToggleButton = styled(Button)`
  border: none;
  background: none;
  font-size: 20px;
  color: ${props => props.theme.colors.text};
  opacity: 0.75;
  cursor: pointer;
  padding: 0;
  
  &:hover {
    opacity: 1;
    color: ${props => props.theme.isDarkMode ? '#f8e71c' : '#1890ff'};
    background: none;
  }
`;

// 添加引用块样式
const BlockQuote = styled.blockquote`
  margin: 10px 0;
  padding: 10px 15px;
  border-left: 4px solid ${props => props.theme.isDarkMode ? '#4a7bab' : '#1890ff'};
  background-color: ${props => props.theme.isDarkMode ? 'rgba(30, 60, 90, 0.2)' : 'rgba(24, 144, 255, 0.05)'};
  color: ${props => props.theme.colors.text};
  font-style: italic;
  border-radius: 0 4px 4px 0;
  
  p {
    margin: 0;
  }
`;

// 自定义数学公式容器
const MathContainer = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  overflow-x: auto;
  margin: 10px 0;
  
  // 内联数学公式样式
  &.inline {
    display: inline-flex;
    width: auto;
    margin: 0 2px;
  }
  
  // KaTeX组件会生成一些内部元素
  .katex-display {
    margin: 0;
  }
  
  .katex {
    font-size: 1.1em;
    color: ${props => props.theme.isDarkMode ? '#e0e0e0' : '#333'};
  }
`;

interface ChatMessage {
  user: string;
  text: string;
  id: string;
  timestamp?: number;
}

interface ChatHistory {
  id: string;
  title: string;
  lastMessage?: string;
  date: string;
  messages: ChatMessage[];
}

const STORAGE_KEY = 'copilot_chat_histories';

// 创建一个辅助函数来处理主题切换动画
const animateThemeChange = (e: React.MouseEvent, callback: () => void) => {
  // 获取点击位置
  const x = e.clientX;
  const y = e.clientY;
  
  // 计算从点击点到窗口最远边缘的距离
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );
  
  // 检查浏览器是否支持View Transitions API
  if ('startViewTransition' in document) {
    const transition = (document as any).startViewTransition(async () => {
      callback();
    });
    
    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`
          ]
        },
        {
          duration: 700,
          easing: 'ease-out',
          // 注意：在切换到深色模式时使用new，切换到浅色模式时使用old
          pseudoElement: document.body.getAttribute('theme-mode') === 'dark' 
            ? '::view-transition-new(root)' 
            : '::view-transition-new(root)'
        }
      );
    });
  } else {
    // 回退方案：对不支持View Transitions的浏览器直接执行回调
    callback();
  }
};

// 自定义数学公式渲染组件
const MathRenderer = ({ value, inline }: { value: string, inline: boolean }) => {
  try {
    return (
      <MathContainer className={inline ? 'inline' : ''}>
        {inline ? (
          <InlineMath math={value} />
        ) : (
          <BlockMath math={value} />
        )}
      </MathContainer>
    );
  } catch (error) {
    console.error('数学公式渲染错误:', error);
    return <code>{value}</code>;
  }
};

const CopilotChatPhone: React.FC = () => {
  const { settings, setSettings } = useChat();
  const [inputText, setInputText] = useState('');
  const [debouncedInputText, setDebouncedInputText] = useState('');
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState('');
  const [streamingResponse, setStreamingResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [copySuccess, setCopySuccess] = useState<{[key: string]: boolean}>({});
  const [isMovingToBottom, setIsMovingToBottom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatStarted, setIsChatStarted] = useState<boolean>(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  
  const navigate = useNavigate();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  // 修改MemoizedMessageItem组件
  const MemoizedMessageItem = React.memo(({ 
    message, 
    index
  }: { 
    message: ChatMessage; 
    index: number;
  }) => {
    const { settings } = useChat();
    return (
      <MessageContainer isUser={message.user !== 'Copilot'}>
        <MessageItem 
          key={message.id}
          isUser={message.user !== 'Copilot'} 
          isError={message.text.startsWith('❌ API调用错误') || message.text.startsWith('发送消息失败')}
        >
          {settings.enableMarkdown ? (
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                code: CodeBlock,
                table: (props: any) => (
                  <MarkdownTable {...props} />
                ),
                th: (props: any) => (
                  <TableHeader {...props} />
                ),
                td: (props: any) => (
                  <TableCell {...props} />
                ),
                blockquote: (props: any) => (
                  <BlockQuote {...props} />
                ),
                math: ({ value, inline }: { value: string, inline: boolean }) => (
                  <MathRenderer value={value} inline={inline} />
                )
              } as any}
            >
              {message.text}
            </ReactMarkdown>
          ) : (
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {message.text}
            </div>
          )}
          {settings.showTimestamp && message.timestamp && (
            <Timestamp isUser={message.user !== 'Copilot'}>
              {new Date(message.timestamp).toLocaleTimeString()}
            </Timestamp>
          )}
        </MessageItem>
      </MessageContainer>
    );
  }, (prevProps, nextProps) => {
    // 只有message或index改变时才重新渲染
    return prevProps.message.id === nextProps.message.id && 
           prevProps.index === nextProps.index;
  });

  // 使用useCallback优化事件处理函数
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputText(newValue);
    
    // 使用setTimeout来防抖，避免频繁更新状态
    if (window.debounceTimer) {
      clearTimeout(window.debounceTimer);
    }
    window.debounceTimer = setTimeout(() => {
      setDebouncedInputText(newValue);
    }, 100);
  }, []);

  const sendMessageToAPI = async (userMessage: string) => {
    if (!settings.apiKey) {
      message.error('请先在设置中配置API密钥');
      return '错误：请先在设置中配置API密钥';
    }

    try {
      setLoading(true);
      setIsStreaming(true);
      setStreamingResponse('');

      // 保存消息数组用于API调用
      const apiMessages = [
        { role: 'system', content: settings.systemPrompt },
        ...messages.map(msg => ({
          role: msg.user === 'Copilot' ? 'assistant' : 'user',
          content: msg.text
        })),
        { role: 'user', content: userMessage }
      ];

      // 创建流式响应
      const response = await fetch(`${settings.apiEndpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify({
          model: settings.model,
          messages: apiMessages,
          // temperature: settings.temperature,
          stream: true,
        }),
      });

      if (!response.ok) {
        let errorDetail = '';
        try {
          const errorData = await response.json();
          errorDetail = errorData.error?.message || errorData.message || JSON.stringify(errorData);
        } catch (e) {
          // 如果不是JSON格式，尝试获取文本
          errorDetail = await response.text();
        }
        throw new Error(`API响应错误 (${response.status} ${response.statusText}): ${errorDetail}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let responseText = '';

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const jsonData = JSON.parse(line.substring(6));
                if (jsonData.choices && jsonData.choices[0].delta && jsonData.choices[0].delta.content) {
                  const content = jsonData.choices[0].delta.content;
                  responseText += content;
                  setStreamingResponse(responseText);
                }
              } catch (e) {
                console.error('解析流式数据错误:', e);
              }
            }
          }
        }
      }

      setIsStreaming(false);
      return responseText || '对不起，我无法理解您的问题。';
    } catch (error) {
      console.error('API调用失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      message.error('API调用失败');
      setIsStreaming(false);
      return `❌ API调用错误: ${errorMessage}`;
    } finally {
      setLoading(false);
    }
  };

  // 先定义SendMessage函数
  const handleSendMessage = async () => {
    if (inputText.trim() && !loading) {
      // 如果是首次发送消息，设置状态为已开始聊天
      if (!isChatStarted) {
        // 先设置动画状态，显示输入框滑动到底部
        setIsMovingToBottom(true);
        
        // 保存用户消息内容，以便在动画完成后发送
        const userMessageText = inputText.trim();
        setInputText(''); // 清空输入框

        // 等待动画完成后再设置聊天开始状态
        setTimeout(async () => {
    setIsChatStarted(true);
          
          // 创建新消息并添加到消息列表
          const newMessage = { 
            user: 'User', 
            text: userMessageText,
            id: Date.now().toString(),
            timestamp: Date.now()
          };
          
          const updatedMessages = [newMessage];
          setMessages(updatedMessages);
          
          // 在状态改变后添加短暂延迟，让动画有时间执行
          setTimeout(() => {
            setIsMovingToBottom(false);
            chatAreaRef.current?.scrollTo({
              top: chatAreaRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }, 50);
          
          // 发送API请求
          try {
            setLoading(true);
            setIsStreaming(true);
            setStreamingResponse("");
            
            const aiResponse = await sendMessageToAPI(userMessageText);
            
            // 处理流式响应结束
            setIsStreaming(false);
            setLoading(false);
            
            // 添加AI回复到消息列表
            const aiMessage: ChatMessage = { 
              user: 'Copilot', 
              text: aiResponse ? String(aiResponse) : '',
              id: Date.now().toString(),
              timestamp: Date.now()
            };
            
            const messagesWithAIResponse = [...updatedMessages, aiMessage];
            setMessages(messagesWithAIResponse);
            
            // 更新聊天历史
            updateChatHistory(
              currentChatId,
              userMessageText,
              aiResponse ? String(aiResponse) : '',
              messagesWithAIResponse
            );
            
            // 确保滚动到底部
            setTimeout(() => {
              if (chatAreaRef.current) {
                chatAreaRef.current.scrollTo({
                  top: chatAreaRef.current.scrollHeight,
                  behavior: 'smooth'
                });
              }
            }, 200);
          } catch (error) {
            console.error('消息发送失败:', error);
            // 在聊天中显示错误消息
            const errorMessage = {
              user: 'Copilot',
              text: `发送消息失败: ${error instanceof Error ? error.message : String(error)}`,
              id: (Date.now() + 1).toString(),
              timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMessage]);
          }
        }, 500); // 和动画持续时间相同
      } else {
        // 聊天已经开始，直接发送消息
        const userMessage = inputText.trim();
        const newMessage = { 
          user: 'User', 
          text: userMessage,
          id: Date.now().toString(),
          timestamp: Date.now()
        };
        
        // 更新消息列表，添加用户消息
        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);
        setInputText('');
        
        try {
          // 调用API
          const aiResponse = await sendMessageToAPI(userMessage);
          
          if (aiResponse) {
            const botResponse: ChatMessage = { 
              user: 'Copilot', 
              text: String(aiResponse),
              id: (Date.now() + 1).toString(),
              timestamp: Date.now()
            };
            
            // 更新消息列表，添加AI响应
            const finalMessages = [...updatedMessages, botResponse];
            setMessages(finalMessages);
            
            // 更新对话历史
            updateChatHistory(
              currentChatId, 
              userMessage, 
              String(aiResponse), 
              finalMessages
            );
            
            // 确保在AI响应后滚动到底部
            setTimeout(() => {
              if (chatAreaRef.current) {
                chatAreaRef.current.scrollTo({
                  top: chatAreaRef.current.scrollHeight,
                  behavior: 'smooth'
                });
              }
            }, 200);
          }
        } catch (error) {
          console.error('消息发送失败:', error);
          // 在聊天中显示错误消息
          const errorMessage = {
            user: 'Copilot',
            text: `发送消息失败: ${error instanceof Error ? error.message : String(error)}`,
            id: (Date.now() + 1).toString(),
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      }
    }
  };

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // 创建新聊天
  const createNewChat = () => {
    const newChatId = Date.now().toString();
    const newChat = {
      id: newChatId, 
      title: '新对话', 
      lastMessage: '美好的一天！', 
      date: '刚刚',
      messages: []
    };

    // 添加到历史记录并更新状态
    const updatedHistories = [newChat, ...chatHistories];
    setChatHistories(updatedHistories);
    
    // 更新本地存储
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistories));
    
    // 切换到新聊天
    setCurrentChatId(newChatId);
    setMessages([]);
    setIsChatStarted(false);
    setInputText(''); // 清空输入框
    
    // 关闭抽屉
    setDrawerVisible(false);
  };

  // 初始化加载历史记录或创建新聊天
  useEffect(() => {
    const savedHistories = localStorage.getItem(STORAGE_KEY);
    
    if (savedHistories) {
      try {
        const parsed = JSON.parse(savedHistories);
        setChatHistories(parsed);
        
        // 加载最近的聊天
        if (parsed.length > 0) {
          const lastChat = parsed[0];
          setCurrentChatId(lastChat.id);
          
          if (lastChat.messages && lastChat.messages.length > 0) {
            setMessages(lastChat.messages);
            setIsChatStarted(true);
          } else {
            setMessages([]);
            setIsChatStarted(false);
          }
        } else {
          createNewChat();
        }
      } catch (e) {
        console.error('解析历史记录失败:', e);
        createNewChat();
      }
    } else {
      createNewChat();
    }
  }, []);

  // 保存历史记录到本地存储
  useEffect(() => {
    if (chatHistories.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistories));
    }
  }, [chatHistories]);

  // 消息变化时滚动到底部
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 当切换聊天时，加载对应的消息
  useEffect(() => {
    const currentChat = chatHistories.find(chat => chat.id === currentChatId);
    if (currentChat) {
      setMessages(currentChat.messages);
      setIsChatStarted(currentChat.messages && currentChat.messages.length > 0);
    }
  }, [currentChatId, chatHistories]);

  // 消息变化时滚动到底部
  useEffect(() => {
    if (messages.length > 0 && isChatStarted) {
      setTimeout(() => {
        if (chatAreaRef.current) {
          chatAreaRef.current.scrollTo({
            top: chatAreaRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [messages, isChatStarted]);

  // 流式响应时的智能滚动
  useEffect(() => {
    if (!isStreaming) return;
    
    // 初始滚动到底部
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTo({
        top: chatAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
    
    const scrollInterval = setInterval(() => {
      if (chatAreaRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatAreaRef.current;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        
        // 如果用户距离底部不远，自动滚动
        if (distanceFromBottom < 150) {
          chatAreaRef.current.scrollTo({
            top: scrollHeight,
            behavior: 'smooth'
          });
        }
      }
    }, 50);
    
    return () => clearInterval(scrollInterval);
  }, [isStreaming]);

  // 监听streamingResponse变化，确保滚动
  useEffect(() => {
    if (streamingResponse && chatAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatAreaRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      // 如果用户距离底部不远，自动滚动
      if (distanceFromBottom < 150) {
        setTimeout(() => {
          if (chatAreaRef.current) {
            chatAreaRef.current.scrollTo({
              top: chatAreaRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 10);
      }
    }
  }, [streamingResponse]);

  const updateChatHistory = (chatId: string, userMessage: string, aiResponse: string, updatedMessages: ChatMessage[]) => {
    // 限制lastMessage长度
    const truncatedMessage = userMessage.length > 20 
      ? `${userMessage.substring(0, 20)}...` 
      : userMessage;
    
    // 更新聊天历史记录
    const updatedHistories = chatHistories.map(chat => 
      chat.id === chatId 
        ? {
            ...chat, 
            lastMessage: truncatedMessage, 
            date: '刚刚',
            messages: updatedMessages
          } 
        : chat
    );
    
    setChatHistories(updatedHistories);
    
    // 更新本地存储
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistories));
  };

  const goToSettings = () => {
    navigate('/settings');
  };

  const showDrawer = () => {
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  const selectChat = (id: string) => {
    if (id !== currentChatId) {
    setCurrentChatId(id);
      const selectedChat = chatHistories.find(chat => chat.id === id);
      if (selectedChat) {
        setMessages(selectedChat.messages || []);
        setIsChatStarted(selectedChat.messages && selectedChat.messages.length > 0);
      }
      // 关闭抽屉
      setDrawerVisible(false);
    }
  };

  const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    // 过滤掉要删除的聊天记录
    const updatedHistories = chatHistories.filter(chat => chat.id !== id);
    setChatHistories(updatedHistories);
    
    // 更新本地存储
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistories));
    
    message.success('聊天记录已删除');

    // 如果删除的是当前选中的会话，处理切换逻辑
    if (id === currentChatId) {
      if (updatedHistories.length > 0) {
        // 切换到第一个聊天
        const firstChat = updatedHistories[0];
        setCurrentChatId(firstChat.id);
        setMessages(firstChat.messages || []);
        setIsChatStarted(firstChat.messages && firstChat.messages.length > 0);
      } else {
        // 没有聊天历史了，创建新的
        createNewChat();
      }
    }
  };

  // 复制代码到剪贴板
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopySuccess(prev => ({ ...prev, [id]: true }));
      message.success('代码已复制');
      
      setTimeout(() => {
        setCopySuccess(prev => ({ ...prev, [id]: false }));
      }, 2000);
    }).catch(err => {
      console.error('复制失败:', err);
      message.error('复制失败');
    });
  };

  // 使用辅助函数实现主题切换
  const toggleThemeMode = (e: React.MouseEvent) => {
    animateThemeChange(e, () => {
      setSettings({
        ...settings,
        theme: {
          ...settings.theme,
          darkMode: !settings.theme.darkMode
        }
      });
    });
  };

  return (
    <Container>
      {/* 顶部导航栏 */}
      <NavBar>
        <MenuButton onClick={showDrawer}>
          <MenuOutlined />
        </MenuButton>
        {/* <LogoImg src={logoImage} alt="AI Logo" style={{ height: '28px' }} /> */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ThemeToggleButton 
            onClick={toggleThemeMode}
            title={settings.theme.darkMode ? "切换到亮色模式" : "切换到暗色模式"}
          >
            {settings.theme.darkMode ? <BulbOutlined /> : <BulbFilled />}
          </ThemeToggleButton>
        <SettingsIconButton onClick={goToSettings}>
          <SettingOutlined />
        </SettingsIconButton>
        </div>
      </NavBar>

      {/* 主内容区 */}
      <MainContent hasMessages={messages.length > 0 || isStreaming}>
        <ChatArea ref={chatAreaRef}>
          {!isChatStarted ? (
            <EmptyState>
              <LogoImg src={logoImage} alt="Copilot Logo" className="large-logo" />
              <WelcomeText>美好的一天！</WelcomeText>
              <InitialInputContainer isMovingToBottom={isMovingToBottom}>
                <StyledInput 
                  placeholder="与 AI 聊天"
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  disabled={loading || isMovingToBottom}
                />
                <InitialInputButtons>
                  {/* <InputButton>
                    <Tooltip title="上传图片">
                      <PictureOutlined />
                    </Tooltip>
                  </InputButton> */}
                  <SendButton 
                    type="primary" 
                    icon={<SendOutlined />} 
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() || loading || isMovingToBottom}
                    loading={loading}
                  />
                </InitialInputButtons>
              </InitialInputContainer>
            </EmptyState>
          ) : (
            <MessagesList>
              {messages.map((message, index) => (
                <MemoizedMessageItem 
                  key={message.id} 
                  message={message} 
                  index={index}
                />
              ))}
              {isStreaming && (
                <MessageContainer isUser={false}>
                <MessageItem 
                  key="streaming" 
                  isUser={false}
                  isError={streamingResponse.startsWith('❌')}
                >
                    {settings.enableMarkdown ? (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      code: CodeBlock,
                      table: (props: any) => (
                        <MarkdownTable {...props} />
                      ),
                      th: (props: any) => (
                        <TableHeader {...props} />
                      ),
                      td: (props: any) => (
                        <TableCell {...props} />
                      ),
                      blockquote: (props: any) => (
                        <BlockQuote {...props} />
                      ),
                      math: ({ value, inline }: { value: string, inline: boolean }) => (
                        <MathRenderer value={value} inline={inline} />
                      )
                    } as any}
                  >
                    {streamingResponse}
                  </ReactMarkdown>
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {streamingResponse}
                      </div>
                    )}
                    {settings.showTimestamp && (
                      <Timestamp isUser={false}>
                        {new Date().toLocaleTimeString()}
                      </Timestamp>
                    )}
                </MessageItem>
                </MessageContainer>
              )}
              <div ref={messageEndRef} />
            </MessagesList>
          )}
        </ChatArea>

        {/* 输入区域 - 仅在聊天已开始时显示 */}
        {isChatStarted && (
      <InputContainer>
        <StyledInput 
              placeholder="与 AI 聊天"
          value={inputText}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={loading}
        />
            <InputButtons>
              {/* <InputButton>
                <Tooltip title="上传图片">
                  <PictureOutlined />
                </Tooltip>
              </InputButton> */}
        <SendButton 
          type="primary" 
          icon={<SendOutlined />} 
          onClick={handleSendMessage}
          disabled={!inputText.trim() || loading}
          loading={loading}
        />
            </InputButtons>
      </InputContainer>
        )}
      </MainContent>

      {/* 抽屉菜单 - 包含历史记录和创建新聊天按钮 */}
      <Drawer
        title={null}
        placement="left"
        closable={false}
        onClose={closeDrawer}
        open={drawerVisible}
        width="80%"
        styles={{
          body: { 
            padding: 0,
            background: settings.theme.darkMode ? '#1a1a1a' : '#ffffff'
          },
          mask: {
            background: settings.theme.darkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.45)'
          }
        }}
      >
        {/* 修改Drawer内容部分，使用类似CopilotChat.tsx的样式  */}
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>聊天历史</DrawerTitle>
            <NewChatButtonDrawer 
              type="primary"
              icon={<PlusOutlined />}
              onClick={createNewChat}
            >
              新建
            </NewChatButtonDrawer>
          </DrawerHeader>
          
          <div style={{ 
            overflowY: 'auto', 
            padding: '12px', 
            background: settings.theme.darkMode 
              ? 'linear-gradient(to bottom, #252525 30%, #151515 100%)' 
              : '#ffffff', 
            height: 'calc(100vh - 70px)' 
          }}>
            {chatHistories.map((chat) => (
              <div
                key={chat.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 16px',
                  borderRadius: '16px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  backgroundColor: chat.id === currentChatId 
                    ? settings.theme.darkMode ? '#15395b' : '#e6f7ff' 
                    : settings.theme.darkMode ? '#2c2c2c' : '#f9f9f9',
                  boxShadow: chat.id === currentChatId 
                    ? settings.theme.darkMode 
                      ? '0 2px 6px rgba(0, 0, 0, 0.3)' 
                      : '0 2px 6px rgba(24, 144, 255, 0.15)' 
                    : 'none',
                  transition: 'all 0.2s ease',
                  border: chat.id === currentChatId 
                    ? settings.theme.darkMode 
                      ? '1px solid #15395b' 
                      : '1px solid #91d5ff' 
                    : '1px solid transparent'
                }}
                onClick={() => selectChat(chat.id)}
              >
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ 
                    fontWeight: 500, 
                    fontSize: '14px', 
                    marginBottom: '4px', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    color: settings.theme.darkMode ? '#e8e8e8' : '#333'
                  }}>
                    {chat.title}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: settings.theme.darkMode ? '#aaa' : '#999', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis' 
                  }}>
                    {chat.lastMessage}
                  </div>
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: settings.theme.darkMode ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)', 
                  marginLeft: 'auto', 
                  marginRight: '5px' 
                }}>
                  {chat.date}
                </div>
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  style={{ 
                    border: 'none',
                    background: 'none',
                    padding: '4px',
                    height: '24px',
                    width: '24px',
                    fontSize: '12px',
                    color: settings.theme.darkMode ? '#aaa' : '#999'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteHistory(e, chat.id);
                  }}
                  title="删除聊天"
                />
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </Container>
  );
};

export default CopilotChatPhone;