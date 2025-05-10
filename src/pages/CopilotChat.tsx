import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Input, Tooltip, message, Drawer, List, Avatar, Spin } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { MenuOutlined, PlusOutlined, PictureOutlined, SendOutlined, SettingOutlined, DeleteOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { useChat } from '../contexts/ChatContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import logoImage from '../logo.png';
import { CodeBlock } from '../components/CodeBlockComponents';

// 为window对象添加debounceTimer属性的声明
declare global {
  interface Window {
    debounceTimer?: NodeJS.Timeout;
  }
}

// 样式定义
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

const ChatHistoryList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: linear-gradient(to bottom,rgb(254, 254, 254) 30%,rgb(189, 211, 244) 100%);
`;

const ChatHistoryItem = styled.div<{ active: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-radius: 16px;
  margin-bottom: 10px;
  cursor: pointer;
  background-color: ${props => props.active ? '#e6f7ff' : '#f9f9f9'};
  box-shadow: ${props => props.active ? '0 2px 6px rgba(24, 144, 255, 0.15)' : 'none'};
  transition: all 0.2s ease;
  border: 1px solid ${props => props.active ? '#91d5ff' : 'transparent'};
  
  &:hover {
    background-color: ${props => props.active ? '#e6f7ff' : '#f0f0f0'};
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
  
  ${ChatHistoryItem}:hover & {
    visibility: visible;
    opacity: 1;
  }
  
  &:hover {
    color: #ff4d4f;
    background: rgba(255, 77, 79, 0.1);
  }
`;

const MainContent = styled.div<{ showGradient: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #ffffff;
  background-image: ${props => props.showGradient ? 
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
    width: 500px;
    max-width: 90%;
  }
  to {
    transform: translateY(calc(100vh - 300px));
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    margin: 0 auto;
    width: 800px;
    max-width: 95%;
    z-index: 1000;
  }
`;

const InitialInputContainer = styled.div<{ isMovingToBottom?: boolean }>`
  width: 500px;
  max-width: 90%;
  position: relative;
  margin-top: 20px;
  animation: ${props => props.isMovingToBottom ? slideCenterToBottom : slideUp} 0.5s ease-out forwards;
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
    from {
      transform: translateY(50px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
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

const MessagesList = styled.div`
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
`;

const MessageItem = styled.div<{ isUser: boolean; isError?: boolean }>`
  max-width: 80%;
  padding: 14px 18px;
  border-radius: 18px;
  margin-bottom: 16px;
  background-color: ${props => props.isError ? '#fff2f0' : props.isUser ? '#e6f7ff' : '#ffffff'};
  color: ${props => props.isError ? '#f5222d' : '#333'};
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  border: 1px solid ${props => {
    if (props.isError) return '#ffccc7';
    return props.isUser ? '#91d5ff' : '#e8e8e8';
  }};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  line-height: 1.5;
  position: relative;

  pre {
    max-width: 100%;
    overflow-x: auto;
    margin: 10px 0;
    border-radius: 8px;
  }

  code {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
    padding: 2px 4px;
    border-radius: 4px;
    background-color: ${props => props.isError ? 'rgba(255, 77, 79, 0.1)' : props.isUser ? 'rgba(24, 144, 255, 0.1)' : '#f5f5f5'};
    font-size: 0.9em;
  }

  p {
    margin: 0 0 10px;
    &:last-child {
      margin-bottom: 0;
    }
  }

  ul, ol {
    margin: 8px 0;
    padding-left: 24px;
  }

  li {
    margin-bottom: 4px;
  }
`;

const MessageContainer = styled.div<{ isUser: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 8px;
  width: 100%;
`;

const Timestamp = styled.div<{ isUser: boolean }>`
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  text-align: ${props => props.isUser ? 'right' : 'left'};
  padding-bottom: 2px;
`;

const MarkdownTable = styled.table`
  border-collapse: collapse;
  margin: 10px 0;
  font-size: 0.9em;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 0 1px #eee;
`;

const TableHeader = styled.th`
  background-color: rgba(24, 144, 255, 0.1);
  color: #333;
  font-weight: bold;
  padding: 8px 12px;
  text-align: left;
  border: 1px solid #eee;
`;

const TableCell = styled.td`
  padding: 8px 12px;
  border: 1px solid #eee;
  text-align: left;
`;

// 新增的样式
const ScrollButtonsContainer = styled.div`
  position: absolute;
  bottom: 90px;  // 调整位置，使其在输入框上方
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 200;
`;

const ScrollButton = styled(Button)`
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(5px);
  color: #666;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    color: #1890ff;
    background: rgba(255, 255, 255, 0.9);
  }
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

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: #f9f9f9;
  border-top: 1px solid #eee;
`;

const STORAGE_KEY = 'copilot_chat_histories';

interface ChatMessage {
  user: string;
  text: string;
  id: string;
  timestamp: number;
}

interface ChatHistory {
  id: string;
  title: string;
  lastMessage: string;
  date: string;
  messages: ChatMessage[];
}

// 使用React.memo优化消息列表组件
const MemoizedMessageItem = React.memo(({ 
  message, 
  index
}: { 
  message: ChatMessage; 
  index: number;
}) => {
  return (
    <MessageItem 
      key={message.id}
      id={`message-${index}`}
      isUser={message.user !== 'Copilot'} 
      isError={message.text.startsWith('❌ API调用错误') || message.text.startsWith('发送消息失败')}
    >
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
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
          )
        }}
      >
        {message.text}
      </ReactMarkdown>
    </MessageItem>
  );
}, (prevProps, nextProps) => {
  // 只有message或index改变时才重新渲染
  return prevProps.message.id === nextProps.message.id && 
         prevProps.index === nextProps.index;
});

// 添加防抖函数
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

const CopilotChat: React.FC = () => {
  const { settings } = useChat();
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
  
  const navigate = useNavigate();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const messagesListRef = useRef<HTMLDivElement>(null);

  // 创建新聊天的函数声明提前，以便在useEffect中使用
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

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // 当切换聊天时，加载对应的消息
    const currentChat = chatHistories.find(chat => chat.id === currentChatId);
    if (currentChat) {
      setMessages(currentChat.messages);
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
      }, 75); // 增加延迟以确保DOM更新完成
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
    }, 75);
    
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

  const saveChatHistory = (chatId: string, updatedMessages: ChatMessage[]) => {
    // 更新聊天历史记录
    const updatedHistories = chatHistories.map(chat => 
      chat.id === chatId 
        ? {...chat, messages: updatedMessages} 
        : chat
    );
    
    setChatHistories(updatedHistories);
    
    // 更新本地存储
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistories));
  };

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

  const updateChatHistory = (chatId: string, userMessage: string, aiResponse: string, updatedMessages: ChatMessage[]) => {
    // 更新聊天历史记录
    const updatedHistories = chatHistories.map(chat => 
      chat.id === chatId 
        ? {
            ...chat, 
            lastMessage: userMessage, 
            date: '刚刚',
            messages: updatedMessages
          } 
        : chat
    );
    
    setChatHistories(updatedHistories);
    
    // 更新本地存储
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistories));
  };

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

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage, loading, inputText]);

  const selectChat = (id: string) => {
    if (id !== currentChatId) {
      setCurrentChatId(id);
      const selectedChat = chatHistories.find(chat => chat.id === id);
      if (selectedChat) {
        setMessages(selectedChat.messages || []);
        setIsChatStarted(selectedChat.messages && selectedChat.messages.length > 0);
        // setInputText(''); // 切换时清空输入框
      }
    }
  };

  const goToSettings = () => {
    navigate('/settings');
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

  // 删除聊天历史记录
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

  // ----------------------- 新增的函数 -----------------------
  // 获取当前可见的最后一个消息气泡
  const getVisibleLastMessageIndex = (): number => {
    if (!chatAreaRef.current || !messagesListRef.current) return -1;

    const chatAreaTop = chatAreaRef.current.scrollTop;
    const chatAreaBottom = chatAreaTop + chatAreaRef.current.clientHeight;

    let lastVisibleIndex = -1;

    for (let i = 0; i < messages.length; i++) {
      const messageElement = document.getElementById(`message-${i}`);
      if (messageElement) {
        const messageTop = messageElement.offsetTop - messagesListRef.current.offsetTop; // 消息顶部相对于消息列表的偏移
        const messageBottom = messageTop + messageElement.offsetHeight;

        // 检查消息是否在可见区域内
        if (messageTop < chatAreaBottom && messageBottom > chatAreaTop) {
          lastVisibleIndex = i;
        }
      }
    }

    return lastVisibleIndex;
  };

  // 获取当前可见的第一个消息气泡  
  const getVisibleFirstMessageIndex = (): number => {
    if (!chatAreaRef.current || !messagesListRef.current) return -1;

    const chatAreaTop = chatAreaRef.current.scrollTop;
    const chatAreaBottom = chatAreaTop + chatAreaRef.current.clientHeight;

    let firstVisibleIndex = -1;

    for (let i = 0; i < messages.length; i++) {
      const messageElement = document.getElementById(`message-${i}`);
      if (messageElement) {
        const messageTop = messageElement.offsetTop - messagesListRef.current.offsetTop; // 消息顶部相对于消息列表的偏移
        const messageBottom = messageTop + messageElement.offsetHeight;

        // 检查消息是否在可见区域内
        if (messageTop < chatAreaBottom && messageBottom > chatAreaTop) {
          firstVisibleIndex = i;
          break; // Exit loop after finding the first visible message
        }
      }
    }

    return firstVisibleIndex;
  };

  // 滚动到可见的第一个消息气泡的顶部
  const scrollToFirstVisibleMessageTop = () => {
    const lastVisibleIndex = getVisibleFirstMessageIndex();
    if (lastVisibleIndex !== -1) {
      const messageElement = document.getElementById(`message-${lastVisibleIndex}`);
      if (messageElement && chatAreaRef.current && messagesListRef.current) {
        const messageTop = messageElement.offsetTop - messagesListRef.current.offsetTop - 40;
        chatAreaRef.current.scrollTo({
          top: messageTop,
          behavior: 'smooth',
        });
      }
    }
  };

  // 滚动到可见的最后一个消息气泡的底部
  const scrollToLastVisibleMessageBottom = () => {
    const lastVisibleIndex = getVisibleLastMessageIndex();
    if (lastVisibleIndex !== -1) {
      const messageElement = document.getElementById(`message-${lastVisibleIndex}`);
      if (messageElement && chatAreaRef.current && messagesListRef.current) {
        const messageTop = messageElement.offsetTop - messagesListRef.current.offsetTop;
        const messageHeight = messageElement.offsetHeight;
        chatAreaRef.current.scrollTo({
          top: messageTop + messageHeight - chatAreaRef.current.clientHeight + 60,
          behavior: 'smooth',
        });
      }
    }
  };
  // ----------------------- 新增的函数结束 -----------------------

  return (
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
        <ChatHistoryList>
          {chatHistories.map((chat) => (
            <ChatHistoryItem 
              key={chat.id} 
              active={chat.id === currentChatId}
              onClick={() => selectChat(chat.id)}
            >
              <ChatHistoryContent>
                <ChatHistoryTitle>{chat.title}</ChatHistoryTitle>
                <ChatHistoryPreview>{chat.lastMessage}</ChatHistoryPreview>
              </ChatHistoryContent>
              <ChatHistoryDate>{chat.date}</ChatHistoryDate>
              <DeleteButton 
                type="text"
                icon={<DeleteOutlined />}
                onClick={(e) => handleDeleteHistory(e, chat.id)}
                title="删除聊天"
              />
            </ChatHistoryItem>
          ))}
        </ChatHistoryList>
      </Sidebar>

      {/* 主内容区 */}
      <MainContent showGradient={messages.length === 0 && !isStreaming}>
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
            <MessagesList ref={messagesListRef}>
              {messages.map((message, index) => (
                <MessageContainer isUser={message.user !== 'Copilot'}>
                  <MessageItem 
                    key={message.id} 
                    id={`message-${index}`}
                    isUser={message.user !== 'Copilot'} 
                    isError={message.text.startsWith('❌ API调用错误') || message.text.startsWith('发送消息失败')}
                  >
                    {settings.enableMarkdown ? (
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
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
                          )
                        }}
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
                        remarkPlugins={[remarkGfm]}
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
                          )
                        }}
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
        
        {/* 滚动按钮 */}
        {isChatStarted && (
          <ScrollButtonsContainer>
            <ScrollButton onClick={scrollToFirstVisibleMessageTop} title="滚动到顶部">
              <UpOutlined />
            </ScrollButton>
            <ScrollButton onClick={scrollToLastVisibleMessageBottom} title="滚动到底部">
              <DownOutlined />
            </ScrollButton>
          </ScrollButtonsContainer>
        )}

        {/* 输入区域 - 仅在聊天已开始时显示 */}
        {isChatStarted && (
          <SlideUpInputContainer>
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
          </SlideUpInputContainer>
        )}
      </MainContent>
    </Container>
  );
};

export default CopilotChat;