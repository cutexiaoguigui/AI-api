import React, { useState, useRef, useEffect, memo, MouseEvent, Component, ErrorInfo, ReactNode } from 'react';
import { Button, Input, Tooltip, message, ConfigProvider } from 'antd'; // 引入 ConfigProvider (虽然此处未使用，但建议在App根组件使用<App>)
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, StyleSheetManager } from 'styled-components';
import { PlusOutlined, PictureOutlined, SendOutlined, SettingOutlined, CopyOutlined, CheckOutlined, DeleteOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { useChat } from '../contexts/ChatContext'; // 确保 ChatContext 正确提供 settings
import ReactMarkdown from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';
import logoImage from '../logo.png'; // 确保路径正确

// --- 按需加载语言支持 ---
import javascript from 'react-syntax-highlighter/dist/cjs/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/cjs/languages/prism/typescript';
import jsx from 'react-syntax-highlighter/dist/cjs/languages/prism/jsx';
import css from 'react-syntax-highlighter/dist/cjs/languages/prism/css';
import json from 'react-syntax-highlighter/dist/cjs/languages/prism/json';

// --- 注册语言 ---
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('json', json);

// --- 类型定义 ---
interface ChatMessage {
  user: string;
  text: string;
  id: string;
}

interface ChatHistory {
  id: string;
  title: string;
  lastMessage: string;
  date: string;
  messages: ChatMessage[]; // 确保 messages 存在于历史记录中
}

// --- ErrorBoundary 组件定义 ---
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error("ErrorBoundary getDerivedStateFromError:", error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>抱歉，内容渲染出错。</div>; // 备用 UI
    }
    return <>{this.props.children}</>;
  }
}

// --- 样式定义 (使用 Transient Props '$') ---
const Container = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  background-color: #ffffff;
`;

const Sidebar = styled.div`
  width: 280px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #f0f0f0;
  background-color: #fff;
  height: 100vh;
`;

const SidebarTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
`;

const LogoImg = styled.img`
  height: 28px;
  margin-right: 8px;
  &.large-logo {
    height: 80px;
    margin-bottom: 24px;
  }
`;

const NewChatButton = styled(Button)`
  display: flex;
  align-items: center;
  font-size: 14px;
  border: none;
  background: none;
  cursor: pointer;
  color: #1890ff;
  &:hover {
    color: #40a9ff;
    background: none;
  }
  span {
    margin-left: 4px;
  }
`;

const ChatHistoryListWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: linear-gradient(to bottom,rgb(254, 254, 254) 30%,rgb(189, 211, 244) 100%);
`;

const ChatHistoryItemWrapper = styled.div<{ $active: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-radius: 16px;
  margin-bottom: 10px;
  cursor: pointer;
  background-color: ${props => props.$active ? '#e6f7ff' : '#f9f9f9'};
  box-shadow: ${props => props.$active ? '0 2px 6px rgba(24, 144, 255, 0.15)' : 'none'};
  transition: all 0.2s ease;
  border: 1px solid ${props => props.$active ? '#91d5ff' : 'transparent'};
  &:hover {
    background-color: ${props => props.$active ? '#e6f7ff' : '#f0f0f0'};
    transform: translateY(-1px);
  }
`;

const ChatHistoryContent = styled.div`
  flex: 1;
  overflow: hidden;
`;

const ChatHistoryTitle = styled.div`
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ChatHistoryPreview = styled.div`
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ChatHistoryDate = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-left: auto;
  margin-right: 5px;
`;

const DeleteButton = styled(Button)`
  visibility: hidden;
  opacity: 0;
  transition: all 0.2s;
  border: none;
  background: none;
  padding: 4px;
  height: 24px;
  width: 24px;
  font-size: 12px;
  color: #999;
  ${ChatHistoryItemWrapper}:hover & {
    visibility: visible;
    opacity: 1;
  }
  &:hover {
    color: #ff4d4f;
    background: rgba(255, 77, 79, 0.1);
  }
`;

const MainContent = styled.div<{ $showGradient: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #ffffff;
  background-image: ${props => props.$showGradient ?
    'radial-gradient(circle at center, rgba(112, 186, 255, 0.25) 0%, rgb(255, 255, 255) 20vw)' :
    'none'};
  position: relative;
`;

const NavBar = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const NavBarContent = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
`;

const SettingsIconButton = styled(Button)`
  font-size: 18px;
  border: none;
  background: none;
  padding: 8px;
  height: 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  &:hover {
    color: #1890ff;
    background-color: rgba(24, 144, 255, 0.1);
  }
`;

const ChatArea = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding-top: 24px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
  height: 100%;
`;

const WelcomeText = styled.p`
  font-size: 22px;
  color: #333;
  margin-bottom: 32px;
  font-weight: 500;
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const slideCenterToBottom = keyframes`
  from { transform: translateY(0); position: relative; width: 500px; max-width: 90%; }
  to { transform: translateY(calc(100vh - 300px)); position: fixed; bottom: 0; left: 0; right: 0; margin: 0 auto; width: 800px; max-width: 95%; z-index: 1000; }
`;

const InitialInputContainer = styled.div<{ $isMovingToBottom?: boolean }>`
  width: 500px;
  max-width: 90%;
  position: relative;
  margin-top: 20px;
  animation: ${props => props.$isMovingToBottom ? slideCenterToBottom : slideUp} 0.5s ease-out forwards;
  transition: width 0.5s ease-out;
`;

const InitialInputButtons = styled.div`
  position: absolute;
  bottom: 16px;
  right: 14px;
  display: flex;
  align-items: center;
`;

const InputContainer = styled.div`
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  border-top: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
`;

const SlideUpInputContainer = styled(InputContainer)`
  animation: slideIn 0.5s ease-out;
  @keyframes slideIn {
    from { transform: translateY(50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
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
  &:hover { color: #1890ff; }
`;

const SendButton = styled(Button)`
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
`;

const CodeBlockWrapper = styled.div`
  position: relative;
  margin: 10px 0;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  &:hover { background: white; border-color: #1890ff; color: #1890ff; }
`;

const ToggleButton = styled.button`
  background: rgba(240, 240, 240, 0.9);
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -5px;
  margin-bottom: 5px;
  transition: all 0.2s;
  width: 100%;
  &:hover { background: rgba(220, 220, 220, 0.9); border-color: #aaa; }
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

const StyledInput = styled(Input.TextArea)`
  padding: 16px;
  border-radius: 24px;
  border: 1px solid #d9d9d9;
  font-size: 16px;
  resize: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  &:hover, &:focus {
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  }
`;

const MessagesList = styled.div`
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
`;

const MessageItem = styled.div<{ $isUser: boolean; $isError?: boolean }>`
  max-width: 80%;
  padding: 14px 18px;
  border-radius: 18px;
  margin-bottom: 16px;
  background-color: ${props => props.$isError ? '#fff2f0' : props.$isUser ? '#e6f7ff' : '#ffffff'};
  color: ${props => props.$isError ? '#f5222d' : '#333'};
  align-self: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  border: 1px solid ${props => {
    if (props.$isError) return '#ffccc7';
    return props.$isUser ? '#91d5ff' : '#e8e8e8';
  }};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  line-height: 1.5;
  pre { max-width: 100%; overflow-x: auto; margin: 10px 0; border-radius: 8px; }
  code { font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace; padding: 2px 4px; border-radius: 4px; background-color: ${props => props.$isError ? 'rgba(255, 77, 79, 0.1)' : props.$isUser ? 'rgba(24, 144, 255, 0.1)' : '#f5f5f5'}; font-size: 0.9em; }
  p { margin: 0 0 10px; &:last-child { margin-bottom: 0; } }
  ul, ol { margin: 8px 0; padding-left: 24px; }
  li { margin-bottom: 4px; }
`;

const MarkdownTable = styled.table`
  border-collapse: collapse; margin: 10px 0; font-size: 0.9em; width: 100%; border-radius: 8px; overflow: hidden; box-shadow: 0 0 0 1px #eee;
`;

const TableHeader = styled.th`
  background-color: rgba(24, 144, 255, 0.1); color: #333; font-weight: bold; padding: 8px 12px; text-align: left; border: 1px solid #eee;
`;

const TableCell = styled.td`
  padding: 8px 12px; border: 1px solid #eee; text-align: left;
`;

const STORAGE_KEY = 'copilot_chat_histories';

// --- ChatHistoryItem 组件定义 ---
interface ChatHistoryItemProps {
  chat: ChatHistory;
  active: boolean;
  onClick: (id: string) => void;
  handleDeleteHistory: (e: MouseEvent<HTMLButtonElement>, id: string) => void;
}

const ChatHistoryItem: React.FC<ChatHistoryItemProps> = ({ chat, active, onClick, handleDeleteHistory }) => {
  return (
    <ChatHistoryItemWrapper $active={active} onClick={() => onClick(chat.id)}>
      <ChatHistoryContent>
        <ChatHistoryTitle>{chat.title}</ChatHistoryTitle>
        <ChatHistoryPreview>{chat.lastMessage}</ChatHistoryPreview>
      </ChatHistoryContent>
      <ChatHistoryDate>{chat.date}</ChatHistoryDate>
      <DeleteButton 
        type="text"
        icon={<DeleteOutlined />}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleDeleteHistory(e, chat.id)} // 明确指定事件类型
        title="删除聊天"
      />
    </ChatHistoryItemWrapper>
  );
};

// --- CodeBlock 组件定义 (使用 React.memo 优化) ---
const CodeBlock = memo((props: any) => {
  const { className, children, inline } = props;
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');
  const codeId = `code-${Math.random().toString(36).substring(2, 9)}`;

  // 复制代码状态 (需要从父组件传递或使用 Context)
  // 这里暂时移除 copySuccess 状态，因为它需要更复杂的处理
  // const [copySuccess, setCopySuccess] = useState<{[key: string]: boolean}>({});
  // const handleCopyCode = (code: string, id: string) => { ... };

  // 代码折叠功能
  const [isExpanded, setIsExpanded] = useState(false);
  const codeLines = codeString.split('\n');
  const isLongCode = codeLines.length > 5;

  const displayedCode = isLongCode && !isExpanded
    ? codeLines.slice(0, 5).join('\n')
    : codeString;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // 复制代码到剪贴板 (简化，直接在按钮上处理)
  const handleCopyClick = () => {
    navigator.clipboard.writeText(codeString).then(() => {
      message.success('代码已复制');
    }).catch(err => {
      console.error('复制失败:', err);
      message.error('复制失败');
    });
  };

  return !inline && language ? (
    <CodeBlockWrapper>
      {language && <LanguageLabel>{language}</LanguageLabel>}
      <CopyButton
        onClick={handleCopyClick} // 直接调用复制逻辑
        title="复制代码"
      >
        <CopyOutlined /> {/* 简化：移除复制成功状态显示 */}
      </CopyButton>
      <SyntaxHighlighter
        style={oneLight as any}
        language={language}
        PreTag="div"
      >
        {displayedCode}
      </SyntaxHighlighter>

      {isLongCode && (
        <ToggleButton onClick={toggleExpand}>
          {isExpanded ? (
            <>
              <UpOutlined style={{ marginRight: 8 }} /> 收起代码
            </>
          ) : (
            <>
              <DownOutlined style={{ marginRight: 8 }} /> 展开代码 ({codeLines.length - 5} 行未显示)
            </>
          )}
        </ToggleButton>
      )}
    </CodeBlockWrapper>
  ) : (
    <code className={className}>
      {children}
    </code>
  );
});

CodeBlock.displayName = 'CodeBlock'; // 方便调试

// --- CopilotChat 主组件 ---
const CopilotChat: React.FC = () => {
  const { settings } = useChat();
  const [inputText, setInputText] = useState('');
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>(''); // 明确类型
  const [streamingResponse, setStreamingResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  // const [copySuccess, setCopySuccess] = useState<{[key: string]: boolean}>({}); // 移到 CodeBlock 内部或 Context
  const [isMovingToBottom, setIsMovingToBottom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatStarted, setIsChatStarted] = useState<boolean>(false);

  const navigate = useNavigate();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  // --- 函数定义 ---
  const createNewChat = () => {
    const newChatId = Date.now().toString();
    const newChat: ChatHistory = { // 明确类型
      id: newChatId,
      title: '新对话',
      lastMessage: '美好的一天！',
      date: '刚刚',
      messages: [] // 初始化 messages 数组
    };

    const updatedHistories = [newChat, ...chatHistories];
    setChatHistories(updatedHistories);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistories));
    setCurrentChatId(newChatId);
    setMessages([]);
    setIsChatStarted(false);
    setInputText('');
  };

  const selectChat = (id: string) => {
    if (id !== currentChatId) {
      setCurrentChatId(id);
      const selectedChat = chatHistories.find(chat => chat.id === id);
      if (selectedChat) {
        setMessages(selectedChat.messages || []); // 加载消息，处理 messages 可能不存在的情况
        setIsChatStarted(!!(selectedChat.messages && selectedChat.messages.length > 0)); // 根据是否有消息设置状态
      } else {
        // 如果找不到对应的聊天记录（理论上不应该发生），可以创建一个新的
        console.warn(`未找到 ID 为 ${id} 的聊天记录，将创建新对话。`);
        createNewChat();
      }
    }
  };

  const handleDeleteHistory = (e: MouseEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation();
    const updatedHistories = chatHistories.filter(chat => chat.id !== id);
    setChatHistories(updatedHistories);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistories));
    message.success('聊天记录已删除');

    if (id === currentChatId) {
      if (updatedHistories.length > 0) {
        const firstChat = updatedHistories[0];
        selectChat(firstChat.id); // 使用 selectChat 来切换
      } else {
        createNewChat();
      }
    }
  };

  const updateChatHistory = (chatId: string, userMessage: string, aiResponse: string, updatedMessages: ChatMessage[]) => {
    const updatedHistories = chatHistories.map(chat =>
      chat.id === chatId
        ? {
            ...chat,
            lastMessage: userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : ''), // 更新最后消息预览
            date: '刚刚',
            messages: updatedMessages
          }
        : chat
    );
    setChatHistories(updatedHistories);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistories));
  };

  const sendMessageToAPI = async (userMessage: string): Promise<string> => { // 明确返回类型
    if (!settings.apiKey) {
      message.error('请先在设置中配置API密钥');
      return '错误：请先在设置中配置API密钥';
    }

    setLoading(true);
    setIsStreaming(true);
    setStreamingResponse('');

    const apiMessages = [
      { role: 'system', content: settings.systemPrompt },
      ...messages.map(msg => ({
        role: msg.user === 'Copilot' ? 'assistant' : 'user',
        content: msg.text
      })),
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await fetch(`${settings.apiEndpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify({
          model: settings.model,
          messages: apiMessages,
          temperature: settings.temperature,
          stream: true,
        }),
      });

      if (!response.ok || !response.body) { // 检查 response.body 是否存在
        let errorDetail = `API响应错误 (${response.status} ${response.statusText})`;
        try {
          const errorData = await response.json();
          errorDetail += `: ${errorData.error?.message || errorData.message || JSON.stringify(errorData)}`;
        } catch (e) {
          errorDetail += `: ${await response.text()}`;
        }
        throw new Error(errorDetail);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let responseText = '';

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
                setStreamingResponse(prev => prev + content); // 使用函数式更新保证获取最新状态
              }
            } catch (e) {
              console.error('解析流式数据错误:', line, e);
            }
          }
        }
      }
      return responseText || '对不起，我无法理解您的问题。';

    } catch (error) {
      console.error('API调用失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      message.error(`API调用失败: ${errorMessage}`);
      return `❌ API调用错误: ${errorMessage}`;
    } finally {
      setIsStreaming(false);
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput || loading) return;

    const userMessageText = trimmedInput;
    setInputText(''); // 立即清空输入框

    const newMessage: ChatMessage = {
      user: 'User',
      text: userMessageText,
      id: Date.now().toString()
    };

    // 优化：立即更新UI显示用户消息
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);

    if (!isChatStarted) {
      setIsMovingToBottom(true);
      setTimeout(() => {
        setIsChatStarted(true);
        setIsMovingToBottom(false);
        // 滚动到底部可能需要稍微延迟，等待DOM更新
        setTimeout(() => messageEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }, 500); // 等待动画
    } else {
       // 滚动到底部可能需要稍微延迟，等待DOM更新
       setTimeout(() => messageEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }


    // 调用API获取响应
    const aiResponseText = await sendMessageToAPI(userMessageText);

    // 创建AI消息
    const aiMessage: ChatMessage = {
      user: 'Copilot',
      text: aiResponseText,
      id: (Date.now() + 1).toString() // 确保ID不同
    };

    // 更新消息列表（包含用户和AI消息）
    const finalMessages = [...updatedMessages, aiMessage];
    setMessages(finalMessages);

    // 更新聊天历史记录
    updateChatHistory(currentChatId, userMessageText, aiResponseText, finalMessages);

     // 确保在AI响应后滚动到底部
     setTimeout(() => messageEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const goToSettings = () => {
    navigate('/settings');
  };

  // --- useEffect Hooks ---
  useEffect(() => {
    const savedHistories = localStorage.getItem(STORAGE_KEY);
    if (savedHistories) {
      try {
        const parsed: ChatHistory[] = JSON.parse(savedHistories);
        // 确保解析出的数据包含 messages 数组
        const historiesWithMessages = parsed.map(chat => ({
          ...chat,
          messages: chat.messages || [] // 如果不存在则初始化为空数组
        }));
        setChatHistories(historiesWithMessages);

        if (historiesWithMessages.length > 0) {
          const lastChat = historiesWithMessages[0];
          setCurrentChatId(lastChat.id);
          setMessages(lastChat.messages);
          setIsChatStarted(lastChat.messages.length > 0);
        } else {
          createNewChat();
        }
      } catch (e) {
        console.error('解析历史记录失败:', e);
        localStorage.removeItem(STORAGE_KEY); // 解析失败则清除错误数据
        createNewChat();
      }
    } else {
      createNewChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 依赖项为空，仅在挂载时运行

  // 滚动到底部逻辑 (合并简化)
  useEffect(() => {
    // 仅在聊天开始后，并且消息列表或流式响应变化时滚动
    if (isChatStarted && (messages.length > 0 || streamingResponse)) {
      // 使用 requestAnimationFrame 确保在下一次绘制前滚动
      requestAnimationFrame(() => {
        if (chatAreaRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = chatAreaRef.current;
          const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
          // 如果用户没有向上滚动太多，则自动滚动到底部
          if (distanceFromBottom < 200 || isStreaming) { // 流式时强制滚动
            chatAreaRef.current.scrollTo({
              top: scrollHeight,
              behavior: 'smooth'
            });
          }
        }
      });
    }
  }, [messages, streamingResponse, isChatStarted, isStreaming]); // 依赖项包含可能影响滚动的状态


  // --- 渲染逻辑 ---
  const renderMessage = (message: ChatMessage) => {
    const isCopilot = message.user === 'Copilot';
    const isErrorMessage = message.text.startsWith('❌ API调用错误') || message.text.startsWith('发送消息失败');
  
    return (
      <MessageItem
        key={message.id}
        $isUser={!isCopilot}
        $isError={isErrorMessage}
      >
        <ErrorBoundary>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: CodeBlock,
              table: (props: any) => <MarkdownTable {...props} />,
              th: (props: any) => <TableHeader {...props} />,
              td: (props: any) => <TableCell {...props} />,
            }}
          >
            {message.text}
          </ReactMarkdown>
        </ErrorBoundary>
      </MessageItem>
    );
  };
  

  return (
    // 不再需要 StyleSheetManager，因为使用了 Transient Props
    <Container>
      {/* 左侧边栏 */}
      <Sidebar>
        <SidebarTop>
          <LogoContainer>
            <LogoImg src={logoImage} alt="Copilot Logo" />
            <span>AI</span>
          </LogoContainer>
          <NewChatButton onClick={createNewChat}>
            <PlusOutlined />
            <span>新建</span>
          </NewChatButton>
        </SidebarTop>

        {/* 历史对话列表 */}
        <ChatHistoryListWrapper>
          {chatHistories.map((chat) => (
            <ChatHistoryItem
              key={chat.id}
              chat={chat}
              active={chat.id === currentChatId}
              onClick={selectChat}
              handleDeleteHistory={handleDeleteHistory}
            />
          ))}
        </ChatHistoryListWrapper>
      </Sidebar>

      {/* 主内容区 */}
      <MainContent $showGradient={messages.length === 0 && !isStreaming}>
        {/* 顶部导航栏 */}
        <NavBar>
          <NavBarContent>
            <SettingsIconButton onClick={goToSettings}>
              <SettingOutlined />
            </SettingsIconButton>
          </NavBarContent>
        </NavBar>

        {/* 聊天内容区 */}
        <ChatArea ref={chatAreaRef}>
          {!isChatStarted ? (
            <EmptyState>
              <LogoImg src={logoImage} alt="Copilot Logo" className="large-logo" />
              <WelcomeText>美好的一天！</WelcomeText>
              <InitialInputContainer $isMovingToBottom={isMovingToBottom}>
                <StyledInput
                  placeholder="与 Copilot 聊天"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  disabled={loading || isMovingToBottom}
                />
                <InitialInputButtons>
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
              {messages.map(renderMessage)}
              {isStreaming && (
                <MessageItem
                  key="streaming"
                  $isUser={false}
                  $isError={streamingResponse.startsWith('❌')}
                >
                  <ErrorBoundary>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code: CodeBlock,
                        table: (props: any) => <MarkdownTable {...props} />,
                        th: (props: any) => <TableHeader {...props} />,
                        td: (props: any) => <TableCell {...props} />,
                      }}
                    >
                      {streamingResponse + '▍'}
                    </ReactMarkdown>
                  </ErrorBoundary>
                </MessageItem>
              )}
              <div ref={messageEndRef} />
            </MessagesList>
          )}
        </ChatArea>

        {/* 输入区域 - 仅在聊天已开始时显示 */}
        {isChatStarted && (
          <SlideUpInputContainer>
            <StyledInput
              placeholder="与 Copilot 聊天"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              autoSize={{ minRows: 1, maxRows: 4 }}
              disabled={loading}
            />
            <InputButtons>
              <SendButton
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                disabled={!inputText.trim() || loading}
                loading={loading}
              />
            </InputButtons>
          </SlideUpInputContainer>
        )}
      </MainContent>
    </Container>
  );
};

export default CopilotChat;
