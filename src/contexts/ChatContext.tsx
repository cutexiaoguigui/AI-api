import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, ChatSession, AppSettings } from '../interfaces';

interface ChatContextType {
  sessions: ChatSession[];
  currentSessionId: string | null;
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  createNewSession: () => string;
  deleteSession: (sessionId: string) => void;
  selectSession: (sessionId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  messages: Message[];
  isStreaming: boolean;
  clearCache: () => void;
}

const defaultSettings: AppSettings = {
  apiEndpoint: 'https://gemini-2.cutexiaoguigui.eu.org/',
  apiKey: 'AIzaSyDg6HBz-IH_bDkwTgfWWlBcVy2BKwQIpEU',
  model: 'gemini-2.0-flash',
  systemPrompt: '你是一个有用的AI助手。',
  theme: {
    primaryColor: '#49D9FD', // 浅青色
  },
  enableMarkdown: true,
  enableStreaming: true,
  showTimestamp: true,
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const savedSessions = localStorage.getItem('chatSessions');
    return savedSessions ? JSON.parse(savedSessions) : [];
  });
  
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    const savedId = localStorage.getItem('currentSessionId');
    return savedId || (sessions.length > 0 ? sessions[0].id : null);
  });
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const savedSettings = localStorage.getItem('appSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });
  
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    localStorage.setItem('chatSessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem('currentSessionId', currentSessionId);
    }
  }, [currentSessionId]);

  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
  }, [settings]);

  const createNewSession = (): string => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions(prevSessions => [newSession, ...prevSessions]);
    setCurrentSessionId(newSession.id);
    return newSession.id;
  };

  const deleteSession = (sessionId: string) => {
    const newSessions = sessions.filter(session => session.id !== sessionId);
    setSessions(newSessions);
    
    if (currentSessionId === sessionId) {
      setCurrentSessionId(newSessions.length > 0 ? newSessions[0].id : null);
    }
  };

  const selectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const updateSession = (sessionId: string, updateFn: (session: ChatSession) => ChatSession) => {
    setSessions(prevSessions => 
      prevSessions.map(session => 
        session.id === sessionId ? updateFn(session) : session
      )
    );
  };

  const addMessageToCurrentSession = (message: Message) => {
    if (!currentSessionId) return;
    
    updateSession(currentSessionId, session => {
      // 如果是第一条用户消息，更新会话标题
      if (message.role === 'user' && session.messages.length === 0) {
        const title = message.content.length > 20 
          ? `${message.content.substring(0, 20)}...` 
          : message.content;
        
        return {
          ...session,
          title,
          messages: [...session.messages, message],
          updatedAt: Date.now(),
        };
      }
      
      return {
        ...session,
        messages: [...session.messages, message],
        updatedAt: Date.now(),
      };
    });
  };

  const sendMessage = async (content: string) => {
    if (!currentSessionId || !content.trim() || isStreaming) return;
    
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    
    addMessageToCurrentSession(userMessage);
    
    // 如果没有会话，创建一个新的
    if (!currentSessionId) {
      createNewSession();
    }
    
    // 准备发送到 AI 的消息
    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (!currentSession) return;
    
    try {
      setIsStreaming(true);
      
      // 创建一个初始的空助手消息
      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      
      addMessageToCurrentSession(assistantMessage);
      
      // 准备 API 请求
      const messages = [
        { role: 'system', content: settings.systemPrompt },
        ...currentSession.messages.map(msg => ({ 
          role: msg.role, 
          content: msg.content 
        })),
        { role: 'user', content }
      ];

      // 构建完整的API URL
      const apiUrl = `${settings.apiEndpoint.endsWith('/') 
        ? settings.apiEndpoint.slice(0, -1) 
        : settings.apiEndpoint}/chat/completions`;
      
      // 发送 API 请求并处理流式响应
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.model,
          messages,
          stream: settings.enableStreaming,
        }),
      });
      
      if (!response.body) {
        throw new Error('Response body is null');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      let done = false;
      let accumulatedContent = '';
      let buffer = '';
      
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // 处理完整的行
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后一个不完整的行
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // 跳过空行
          if (!trimmedLine) continue;
          
          // 处理数据行
          if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.substring(6);
            
            // 处理流结束标记
            if (data === '[DONE]') {
              done = true;
              break;
            }
            
            try {
              const jsonData = JSON.parse(data);
              const contentDelta = jsonData.choices?.[0]?.delta?.content || '';
              
              if (contentDelta) {
                const newContent = accumulatedContent + contentDelta;
                accumulatedContent = newContent;
                
                // 更新消息内容
                updateSession(currentSessionId, session => {
                  const updatedMessages = [...session.messages];
                  const lastIndex = updatedMessages.length - 1;
                  
                  if (lastIndex >= 0 && updatedMessages[lastIndex].role === 'assistant') {
                    updatedMessages[lastIndex] = {
                      ...updatedMessages[lastIndex],
                      content: newContent,
                    };
                  }
                  
                  return {
                    ...session,
                    messages: updatedMessages,
                  };
                });
              }
            } catch (e) {
              console.error('解析流式数据失败:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // 添加错误提示消息
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: '发送消息时出错，请检查网络连接和API设置。',
        timestamp: Date.now(),
      };
      
      updateSession(currentSessionId, session => ({
        ...session,
        messages: session.messages.filter(m => m.role !== 'assistant' || m.content !== '')
          .concat(errorMessage),
      }));
    } finally {
      setIsStreaming(false);
    }
  };

  const messages = currentSessionId 
    ? sessions.find(s => s.id === currentSessionId)?.messages || [] 
    : [];

    const clearCache = () => {
      // 清除所有localStorage数据
      localStorage.clear(); // 使用clear()而不是单独移除项目，确保清除所有存储
      
      // 重置状态到初始值
      setSessions([]);
      setCurrentSessionId(null);
      setSettings(defaultSettings);
      
      // 可能还需要清除sessionStorage
      sessionStorage.clear();
      
      // 如果使用了IndexedDB或其他存储，也需要清除
      // 例如:
      // indexedDB.deleteDatabase('your-database-name');
    };

  return (
    <ChatContext.Provider value={{
      sessions,
      currentSessionId,
      settings,
      setSettings,
      createNewSession,
      deleteSession,
      selectSession,
      sendMessage,
      messages,
      isStreaming,
      clearCache,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}; 